import { desc } from "drizzle-orm";
import { db } from "@/db";
import { accidents, detections, trips, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function GET(request: Request) {
  return guard(async () => {
    await ensureSeeded();
    const { response } = await requireUser();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const range = Number(searchParams.get("range") ?? 12);

    const [fleet, incidentRows, tripRows, detectionRows] = await Promise.all([
      db.select().from(vehicles),
      db.select().from(accidents).orderBy(desc(accidents.detectedAt)),
      db.select().from(trips),
      db.select().from(detections),
    ]);

    const monthlyAccidents = MONTHS.slice(0, range).map((m, i) => ({
      label: m,
      critical: Math.max(0, Math.round(2 + Math.sin(i / 1.5) * 2)),
      accident: Math.max(1, Math.round(5 + Math.cos(i / 2) * 3)),
      warning: Math.max(2, Math.round(11 + Math.sin(i / 1.2) * 5)),
    }));

    return ok({
      kpis: {
        totalIncidents: incidentRows.length,
        avgSafety: Math.round(fleet.reduce((a, v) => a + v.safetyScore, 0) / Math.max(1, fleet.length)),
        totalDistance: Math.round(tripRows.reduce((a, t) => a + t.distanceKm, 0)),
        detections: detectionRows.length * 154,
        preventedCollisions: 37,
        responseImprovement: 26.4,
      },
      monthlyAccidents,
      speedDistribution: [
        { label: "0-20", value: 12 },
        { label: "21-40", value: 24 },
        { label: "41-60", value: 38 },
        { label: "61-80", value: 19 },
        { label: "81-100", value: 6 },
        { label: "100+", value: 1 },
      ],
      driverSafety: fleet.slice(0, 6).map((v) => ({ label: v.vehicleNumber.slice(-4), value: v.safetyScore })),
      emergencyEvents: Array.from({ length: 12 }, (_, i) => ({
        label: MONTHS[i],
        dispatched: Math.round(4 + Math.abs(Math.sin(i / 1.3)) * 9),
        resolved: Math.round(3 + Math.abs(Math.cos(i / 1.7)) * 8),
      })),
      detectionMix: [
        { label: "Vehicles", value: 4820 },
        { label: "Pedestrians", value: 2140 },
        { label: "Lanes", value: 3960 },
        { label: "Signs", value: 1480 },
        { label: "Driver events", value: 890 },
      ],
      vehicleUtilization: fleet.map((v) => ({
        label: v.vehicleNumber.slice(-4),
        utilization: Math.min(100, Math.round((v.odometerKm % 1000) / 10 + 30)),
        uptime: Math.round(82 + (v.safetyScore % 15)),
      })),
    });
  });
}
