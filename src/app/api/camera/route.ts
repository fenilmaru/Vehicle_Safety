import { desc } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";
import { buildFrame } from "@/lib/simulation";

export const dynamic = "force-dynamic";

const FEEDS = [
  { id: "front", name: "Front ADAS", resolution: "1920×1080", fps: 30, model: "YOLOv8n-seg" },
  { id: "cabin", name: "Cabin DMS", resolution: "1280×720", fps: 24, model: "MediaPipe FaceMesh" },
  { id: "rear", name: "Rear Guard", resolution: "1280×720", fps: 24, model: "YOLOv8n" },
  { id: "left", name: "Left Blind Spot", resolution: "1280×720", fps: 20, model: "YOLOv8n" },
  { id: "right", name: "Right Blind Spot", resolution: "1280×720", fps: 20, model: "YOLOv8n" },
];

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

    return ok({
      vehicle: vehicle ?? null,
      fleet,
      feeds: FEEDS.map((feed, i) => ({ ...feed, online: i !== 4 || frame.tick % 5 !== 0 })),
      frame,
      detectionPanel: [
        { key: "vehicle", label: "Vehicle", value: frame.boxes.filter((b) => b.label.startsWith("Vehicle")).length, tone: "primary" },
        { key: "pedestrian", label: "Pedestrian", value: frame.boxes.filter((b) => b.label === "Pedestrian").length, tone: "warning" },
        { key: "lane", label: "Lane", value: Math.round(frame.laneConfidence * 100), unit: "%", tone: "success" },
        { key: "signal", label: "Traffic Signal", value: frame.traffic.signal.toUpperCase(), tone: frame.traffic.signal === "red" ? "danger" : "success" },
        { key: "seatbelt", label: "Seat Belt", value: frame.driver.seatbelt ? "FASTENED" : "UNFASTENED", tone: frame.driver.seatbelt ? "success" : "danger" },
        { key: "phone", label: "Phone Usage", value: frame.driver.phoneUsage, unit: "%", tone: frame.driver.phoneUsage > 10 ? "warning" : "success" },
        { key: "attention", label: "Driver Attention", value: frame.driver.attention, unit: "%", tone: frame.driver.attention < 70 ? "warning" : "success" },
        { key: "drowsiness", label: "Drowsiness", value: frame.driver.drowsiness, unit: "%", tone: frame.driver.drowsiness > 25 ? "danger" : "success" },
      ],
    });
  });
}
