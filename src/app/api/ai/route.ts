import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { detections, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";
import { buildFrame, moduleSnapshot } from "@/lib/simulation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return guard(async () => {
    await ensureSeeded();
    const { response } = await requireUser();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const vehicleId = Number(searchParams.get("vehicleId") ?? 0);
    const fleet = await db.select().from(vehicles).orderBy(desc(vehicles.currentSpeed));
    const vehicle = fleet.find((v) => v.id === vehicleId) ?? fleet[0];
    const tick = Math.floor(Date.now() / 1000) % 600;
    const frame = buildFrame(vehicle?.id ?? 1, tick, vehicle?.lat, vehicle?.lng);

    const logs = vehicle
      ? await db.select().from(detections).where(eq(detections.vehicleId, vehicle.id)).orderBy(desc(detections.createdAt)).limit(20)
      : [];

    return ok({
      vehicle: vehicle ?? null,
      fleet,
      modules: moduleSnapshot(frame),
      frame,
      logs,
      pipeline: {
        inferenceEngine: "TensorRT 10 · CUDA 12.4",
        models: ["YOLOv8n-seg", "LaneNet", "MediaPipe BlazePose", "ArcFace", "CrashNet-PyTorch"],
        fps: frame.systemHealth.fps,
        latencyMs: frame.systemHealth.latencyMs,
        queueDepth: 2,
      },
    });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const { response } = await requireUser();
    if (response) return response;
    const body = (await request.json()) as Record<string, unknown>;

    const [created] = await db
      .insert(detections)
      .values({
        vehicleId: Number(body.vehicleId ?? 1),
        module: String(body.module ?? "object"),
        label: String(body.label ?? "Unlabelled detection"),
        confidence: Number(body.confidence ?? 0.8),
        severity: String(body.severity ?? "normal"),
        engine: String(body.engine ?? "YOLOv8"),
        frameRef: String(body.frameRef ?? `frame_${Date.now()}`),
        meta: (body.meta as Record<string, unknown>) ?? {},
      })
      .returning();

    return ok(created, undefined, 201);
  });
}
