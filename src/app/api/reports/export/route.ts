import { desc } from "drizzle-orm";
import { db } from "@/db";
import { accidents, trips, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "no data";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export async function GET(request: Request) {
  await ensureSeeded();
  const { response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "accidents";
  const severity = searchParams.get("severity") ?? "";
  const format = searchParams.get("format") ?? "csv";

  const fleet = await db.select().from(vehicles);
  let rows: Record<string, string | number>[] = [];

  if (scope === "trips") {
    const data = await db.select().from(trips).orderBy(desc(trips.startedAt));
    rows = data.map((t) => ({
      trip_id: t.id,
      vehicle: fleet.find((v) => v.id === t.vehicleId)?.vehicleNumber ?? "—",
      origin: t.origin,
      destination: t.destination,
      distance_km: t.distanceKm,
      avg_speed: t.avgSpeed,
      max_speed: t.maxSpeed,
      safety_score: t.safetyScore,
      started_at: t.startedAt.toISOString(),
    }));
  } else if (scope === "vehicles") {
    rows = fleet.map((v) => ({
      vehicle: v.vehicleNumber,
      model: v.model,
      status: v.status,
      autonomy_level: v.autonomyLevel,
      safety_score: v.safetyScore,
      odometer_km: v.odometerKm,
      battery: v.batteryLevel,
    }));
  } else {
    const data = await db.select().from(accidents).orderBy(desc(accidents.detectedAt));
    rows = data
      .filter((a) => !severity || a.severity === severity)
      .map((a) => ({
        code: a.code,
        vehicle: fleet.find((v) => v.id === a.vehicleId)?.vehicleNumber ?? "—",
        severity: a.severity,
        confidence: a.confidence,
        impact_g: a.impactG,
        status: a.status,
        address: a.address,
        detected_at: a.detectedAt.toISOString(),
      }));
  }

  const body = toCsv(rows);
  const filename = `aas-${scope}-${Date.now()}.${format === "excel" ? "csv" : format === "pdf" ? "csv" : "csv"}`;

  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
