import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { users, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { fail, guard, ok, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return guard(async () => {
    await ensureSeeded();
    const { response } = await requireUser();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const status = searchParams.get("status") ?? "";

    const rows = q
      ? await db
          .select()
          .from(vehicles)
          .where(or(ilike(vehicles.vehicleNumber, `%${q}%`), ilike(vehicles.model, `%${q}%`)))
          .orderBy(desc(vehicles.lastSeenAt))
      : await db.select().from(vehicles).orderBy(desc(vehicles.lastSeenAt));

    const drivers = await db.select({ id: users.id, fullName: users.fullName, role: users.role }).from(users);
    const filtered = status ? rows.filter((r) => r.status === status) : rows;

    return ok(
      filtered.map((v) => ({ ...v, driver: drivers.find((d) => d.id === v.driverId) ?? null })),
      { total: filtered.length },
    );
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const { response } = await requireUser();
    if (response) return response;
    const body = (await request.json()) as Record<string, unknown>;

    const vehicleNumber = String(body.vehicleNumber ?? "").trim().toUpperCase();
    const model = String(body.model ?? "").trim();
    const fields: Record<string, string> = {};
    if (vehicleNumber.length < 4) fields.vehicleNumber = "Vehicle number required";
    if (model.length < 2) fields.model = "Model required";
    if (Object.keys(fields).length) return fail("Validation failed", 422, "validation_error", fields);

    const [created] = await db
      .insert(vehicles)
      .values({
        vehicleNumber,
        model,
        manufacturer: String(body.manufacturer ?? ""),
        year: Number(body.year ?? 2026),
        vehicleType: String(body.vehicleType ?? "sedan"),
        status: String(body.status ?? "online"),
        autonomyLevel: Number(body.autonomyLevel ?? 3),
        driverId: body.driverId ? Number(body.driverId) : null,
        safetyScore: Number(body.safetyScore ?? 90),
        aiModules: ["object", "lane", "driver"],
      })
      .returning();

    return ok(created, undefined, 201);
  });
}
