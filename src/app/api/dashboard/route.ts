import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accidents, detections, driverStatus, notifications, trips, users, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";
import { buildFrame } from "@/lib/simulation";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    await ensureSeeded();
    const { user, response } = await requireUser();
    if (response) return response;

    const fleet = await db.select().from(vehicles).orderBy(desc(vehicles.currentSpeed));
    const primary = fleet.find((v) => v.driverId === user.id) ?? fleet[0];
    const tick = Math.floor(Date.now() / 1000) % 600;
    const frame = primary ? buildFrame(primary.id, tick, primary.lat, primary.lng) : null;

    const [recentTrips, recentAlerts, detectionLogs, driverRows, accidentRows] = await Promise.all([
      db.select().from(trips).orderBy(desc(trips.startedAt)).limit(5),
      db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(6),
      db.select().from(detections).orderBy(desc(detections.createdAt)).limit(8),
      db.select().from(driverStatus).orderBy(desc(driverStatus.recordedAt)).limit(4),
      db.select().from(accidents).orderBy(desc(accidents.detectedAt)).limit(5),
    ]);

    const driverIds = driverRows.map((d) => d.driverId);
    const driverProfiles = driverIds.length
      ? await db
          .select({ id: users.id, fullName: users.fullName, role: users.role, safetyScore: users.safetyScore })
          .from(users)
      : [];

    const [{ openIncidents }] = await db
      .select({ openIncidents: sql<number>`cast(count(*) as int)` })
      .from(accidents)
      .where(eq(accidents.status, "responding"));

    const safetySeries = Array.from({ length: 14 }, (_, i) => ({
      label: `D-${13 - i}`,
      value: Math.round(86 + Math.sin(i / 2) * 7 + (i % 3)),
    }));
    const detectionSeries = Array.from({ length: 12 }, (_, i) => ({
      label: `${String(i * 2).padStart(2, "0")}:00`,
      objects: Math.round(120 + Math.sin(i / 1.7) * 60 + i * 4),
      pedestrians: Math.round(40 + Math.cos(i / 2) * 22),
      lanes: Math.round(90 + Math.sin(i / 3) * 30),
    }));
    const speedSeries = Array.from({ length: 20 }, (_, i) => ({
      label: `${i}`,
      value: Math.max(0, Math.round(52 + Math.sin(i / 2.4) * 26)),
    }));

    return ok({
      operator: {
        name: user.fullName,
        role: user.role,
        safetyScore: user.safetyScore,
        avatarUrl: user.avatarUrl,
      },
      primaryVehicle: primary ?? null,
      frame,
      kpis: {
        fleetSize: fleet.length,
        online: fleet.filter((v) => v.status === "online").length,
        avgSafety: Math.round(fleet.reduce((a, v) => a + v.safetyScore, 0) / Math.max(1, fleet.length)),
        openIncidents,
        aiUptime: 99.94,
        detections24h: 1846,
      },
      recentTrips,
      recentAlerts,
      detectionLogs,
      driverStatuses: driverRows.map((row) => ({
        ...row,
        driver: driverProfiles.find((p) => p.id === row.driverId) ?? null,
      })),
      accidents: accidentRows,
      charts: { safetySeries, detectionSeries, speedSeries },
      systemHealth: frame?.systemHealth ?? { cpu: 42, gpu: 58, memory: 51, latencyMs: 24, fps: 30 },
    });
  });
}
