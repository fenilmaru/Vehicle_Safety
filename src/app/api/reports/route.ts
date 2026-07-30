import { desc } from "drizzle-orm";
import { db } from "@/db";
import { accidents, reports, trips, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    await ensureSeeded();
    const { response } = await requireUser();
    if (response) return response;

    const [rows, fleet, incidentRows, tripRows] = await Promise.all([
      db.select().from(reports).orderBy(desc(reports.createdAt)),
      db.select().from(vehicles),
      db.select().from(accidents).orderBy(desc(accidents.detectedAt)),
      db.select().from(trips).orderBy(desc(trips.startedAt)),
    ]);

    return ok({
      reports: rows,
      fleet,
      dataset: incidentRows.map((a) => ({
        code: a.code,
        vehicle: fleet.find((v) => v.id === a.vehicleId)?.vehicleNumber ?? "—",
        severity: a.severity,
        confidence: a.confidence,
        status: a.status,
        detectedAt: a.detectedAt,
        address: a.address,
      })),
      tripCount: tripRows.length,
    });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const { user, response } = await requireUser();
    if (response) return response;
    const body = (await request.json()) as Record<string, unknown>;

    const scope = String(body.scope ?? "accidents");
    const format = String(body.format ?? "pdf");
    const [created] = await db
      .insert(reports)
      .values({
        name: String(body.name ?? `${scope} report — ${new Date().toLocaleDateString()}`),
        format,
        scope,
        filters: (body.filters as Record<string, unknown>) ?? {},
        rowCount: Number(body.rowCount ?? 42),
        sizeKb: format === "pdf" ? 1420 : format === "excel" ? 680 : 220,
        generatedBy: user.fullName,
        status: "ready",
      })
      .returning();

    return ok(created, undefined, 201);
  });
}
