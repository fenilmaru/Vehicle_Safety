import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accidentTimeline, accidents, detections, dispatches, emergencyContacts, users, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, notFound, ok, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return guard(async () => {
    await ensureSeeded();
    const { response } = await requireUser();
    if (response) return response;
    const id = Number((await params).id);

    const [accident] = await db.select().from(accidents).where(eq(accidents.id, id)).limit(1);
    if (!accident) return notFound("Accident");

    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, accident.vehicleId)).limit(1);
    const [driver] = accident.driverId
      ? await db.select().from(users).where(eq(users.id, accident.driverId)).limit(1)
      : [];

    const [timeline, dispatchRows, aiRows, contacts] = await Promise.all([
      db.select().from(accidentTimeline).where(eq(accidentTimeline.accidentId, id)).orderBy(asc(accidentTimeline.step)),
      db.select().from(dispatches).where(eq(dispatches.accidentId, id)),
      db.select().from(detections).where(eq(detections.vehicleId, accident.vehicleId)).orderBy(desc(detections.createdAt)).limit(6),
      db.select().from(emergencyContacts),
    ]);

    return ok({
      accident,
      vehicle: vehicle ?? null,
      driver: driver ? { ...driver, passwordHash: undefined } : null,
      timeline,
      dispatches: dispatchRows,
      detections: aiRows,
      contacts,
      evidence: [
        { id: "ev-1", type: "image", label: "Front ADAS keyframe", ref: "frame_100241", capturedAt: accident.detectedAt },
        { id: "ev-2", type: "image", label: "Cabin DMS keyframe", ref: "frame_100242", capturedAt: accident.detectedAt },
        { id: "ev-3", type: "video", label: "Impact clip (-8s → +12s)", ref: "clip_44121", capturedAt: accident.detectedAt },
        { id: "ev-4", type: "telemetry", label: "CAN bus snapshot", ref: "can_88213", capturedAt: accident.detectedAt },
      ],
    });
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  return guard(async () => {
    const { response } = await requireUser();
    if (response) return response;
    const id = Number((await params).id);
    const body = (await request.json()) as Record<string, unknown>;

    const [updated] = await db
      .update(accidents)
      .set({
        status: body.status ? String(body.status) : undefined,
        severity: body.severity ? String(body.severity) : undefined,
        resolvedAt: body.status === "resolved" ? new Date() : undefined,
      })
      .where(eq(accidents.id, id))
      .returning();

    if (!updated) return notFound("Accident");
    return ok(updated);
  });
}
