import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { driverStatus, users, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";
import { buildFrame } from "@/lib/simulation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return guard(async () => {
    await ensureSeeded();
    const { user, response } = await requireUser();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const driverId = Number(searchParams.get("driverId") ?? 0);

    const [rows, drivers, fleet] = await Promise.all([
      db.select().from(driverStatus).orderBy(desc(driverStatus.recordedAt)),
      db.select().from(users),
      db.select().from(vehicles),
    ]);

    const active = rows.find((r) => r.driverId === (driverId || user.id)) ?? rows[0] ?? null;
    const vehicle = fleet.find((v) => v.id === active?.vehicleId) ?? fleet[0];
    const tick = Math.floor(Date.now() / 1000) % 600;
    const frame = buildFrame(vehicle?.id ?? 1, tick, vehicle?.lat, vehicle?.lng);

    return ok({
      active: active
        ? {
            ...active,
            driver: drivers.find((d) => d.id === active.driverId)
              ? {
                  id: active.driverId,
                  fullName: drivers.find((d) => d.id === active.driverId)!.fullName,
                  role: drivers.find((d) => d.id === active.driverId)!.role,
                  safetyScore: drivers.find((d) => d.id === active.driverId)!.safetyScore,
                }
              : null,
            vehicle: vehicle ?? null,
          }
        : null,
      live: frame.driver,
      roster: rows.map((row) => ({
        ...row,
        driver: (() => {
          const d = drivers.find((x) => x.id === row.driverId);
          return d ? { id: d.id, fullName: d.fullName, role: d.role, safetyScore: d.safetyScore } : null;
        })(),
        vehicle: fleet.find((v) => v.id === row.vehicleId) ?? null,
      })),
      behaviourSeries: Array.from({ length: 12 }, (_, i) => ({
        label: `${i * 5}m`,
        attention: Math.round(78 + Math.sin(i / 1.6) * 16),
        drowsiness: Math.round(16 + Math.cos(i / 2) * 12),
        fatigue: Math.round(22 + Math.sin(i / 3) * 14),
      })),
    });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const { response } = await requireUser();
    if (response) return response;
    const body = (await request.json()) as Record<string, unknown>;
    const [row] = await db
      .insert(driverStatus)
      .values({
        driverId: Number(body.driverId ?? 1),
        vehicleId: Number(body.vehicleId ?? 1),
        attention: Number(body.attention ?? 90),
        drowsiness: Number(body.drowsiness ?? 8),
        fatigue: Number(body.fatigue ?? 12),
        phoneUsage: Number(body.phoneUsage ?? 0),
        seatbelt: Boolean(body.seatbelt ?? true),
        eyeStatus: String(body.eyeStatus ?? "open"),
        heartRate: Number(body.heartRate ?? 76),
      })
      .returning();
    if (body.safetyScore) {
      await db.update(users).set({ safetyScore: Number(body.safetyScore) }).where(eq(users.id, row.driverId));
    }
    return ok(row, undefined, 201);
  });
}
