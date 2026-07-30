import { desc } from "drizzle-orm";
import { db } from "@/db";
import { accidentTimeline, accidents, notifications, users, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";
import { buildFrame } from "@/lib/simulation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return guard(async () => {
    await ensureSeeded();
    const { response } = await requireUser();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity") ?? "";
    const vehicleFilter = Number(searchParams.get("vehicleId") ?? 0);

    const [rows, fleet, people] = await Promise.all([
      db.select().from(accidents).orderBy(desc(accidents.detectedAt)),
      db.select().from(vehicles),
      db.select().from(users),
    ]);

    const filtered = rows.filter(
      (r) => (!severity || r.severity === severity) && (!vehicleFilter || r.vehicleId === vehicleFilter),
    );

    const live = fleet[0] ? buildFrame(fleet[0].id, Math.floor(Date.now() / 1000) % 600, fleet[0].lat, fleet[0].lng) : null;

    return ok({
      accidents: filtered.map((a) => ({
        ...a,
        vehicle: fleet.find((v) => v.id === a.vehicleId) ?? null,
        driver: (() => {
          const d = people.find((p) => p.id === a.driverId);
          return d ? { id: d.id, fullName: d.fullName, mobile: d.mobile } : null;
        })(),
      })),
      fleet,
      live,
      stats: {
        total: rows.length,
        critical: rows.filter((r) => r.severity === "critical").length,
        responding: rows.filter((r) => r.status === "responding").length,
        avgResponseSec: Math.round(rows.reduce((a, r) => a + r.responseTimeSec, 0) / Math.max(1, rows.length)),
      },
    });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const { user, response } = await requireUser();
    if (response) return response;
    const body = (await request.json()) as Record<string, unknown>;

    const vehicleId = Number(body.vehicleId ?? 1);
    const severity = String(body.severity ?? "accident");
    const code = `ACC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`;

    const [created] = await db
      .insert(accidents)
      .values({
        code,
        vehicleId,
        driverId: user.id,
        severity,
        confidence: Number(body.confidence ?? 0.9),
        impactG: Number(body.impactG ?? 5.4),
        airbagDeployed: severity === "critical",
        lat: Number(body.lat ?? 12.9716),
        lng: Number(body.lng ?? 77.5946),
        address: String(body.address ?? "Auto-resolved from GPS uplink"),
        status: "responding",
        description: String(body.description ?? "AI CrashNet impact signature confirmed by edge inference node."),
        responseTimeSec: 38,
      })
      .returning();

    const now = Date.now();
    await db.insert(accidentTimeline).values(
      ["AI Impact Detection", "Vehicle Auto-Stop", "Emergency Signal Sent", "GPS Location Shared", "Emergency Contacts Notified"].map(
        (label, index) => ({
          accidentId: created.id,
          step: index + 1,
          label,
          description: `${label} completed by autonomous response controller.`,
          occurredAt: new Date(now + index * 1500),
        }),
      ),
    );

    await db.insert(notifications).values({
      userId: user.id,
      vehicleId,
      title: `${severity === "critical" ? "Critical" : "Accident"} event ${code}`,
      message: "Autonomous emergency protocol engaged and dispatch initiated.",
      level: severity === "critical" ? "critical" : "warning",
      category: "accident",
    });

    return ok(created, undefined, 201);
  });
}
