import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accidents, detections, driverStatus, telemetry, trips, users, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, notFound, ok, requireUser } from "@/lib/api";
import { buildFrame } from "@/lib/simulation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return guard(async () => {
    await ensureSeeded();
    const { response } = await requireUser();
    if (response) return response;
    const id = Number((await params).id);

    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    if (!vehicle) return notFound("Vehicle");

    const [driver] = vehicle.driverId
      ? await db.select().from(users).where(eq(users.id, vehicle.driverId)).limit(1)
      : [];

    const [tripRows, accidentRows, detectionRows, telemetryRows, statusRows] = await Promise.all([
      db.select().from(trips).where(eq(trips.vehicleId, id)).orderBy(desc(trips.startedAt)).limit(10),
      db.select().from(accidents).where(eq(accidents.vehicleId, id)).orderBy(desc(accidents.detectedAt)).limit(10),
      db.select().from(detections).where(eq(detections.vehicleId, id)).orderBy(desc(detections.createdAt)).limit(12),
      db.select().from(telemetry).where(eq(telemetry.vehicleId, id)).orderBy(desc(telemetry.recordedAt)).limit(24),
      db.select().from(driverStatus).where(eq(driverStatus.vehicleId, id)).orderBy(desc(driverStatus.recordedAt)).limit(1),
    ]);

    const tick = Math.floor(Date.now() / 1000) % 600;
    return ok({
      vehicle,
      driver: driver ? { ...driver, passwordHash: undefined } : null,
      trips: tripRows,
      accidents: accidentRows,
      detections: detectionRows,
      telemetry: telemetryRows.reverse(),
      driverStatus: statusRows[0] ?? null,
      frame: buildFrame(vehicle.id, tick, vehicle.lat, vehicle.lng),
    });
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  return guard(async () => {
    const { response } = await requireUser();
    if (response) return response;
    const id = Number((await params).id);
    const body = (await request.json()) as Record<string, unknown>;

    const patch: Record<string, unknown> = {};
    for (const key of ["model", "manufacturer", "vehicleType", "status", "vehicleNumber"]) {
      if (body[key] !== undefined) patch[key] = String(body[key]);
    }
    for (const key of ["year", "autonomyLevel", "safetyScore", "batteryLevel", "driverId"]) {
      if (body[key] !== undefined && body[key] !== null && body[key] !== "") patch[key] = Number(body[key]);
    }

    const [updated] = await db.update(vehicles).set(patch).where(eq(vehicles.id, id)).returning();
    if (!updated) return notFound("Vehicle");
    return ok(updated);
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  return guard(async () => {
    const { response } = await requireUser();
    if (response) return response;
    const id = Number((await params).id);
    const [removed] = await db.delete(vehicles).where(eq(vehicles.id, id)).returning({ id: vehicles.id });
    if (!removed) return notFound("Vehicle");
    return ok({ deleted: removed.id });
  });
}
