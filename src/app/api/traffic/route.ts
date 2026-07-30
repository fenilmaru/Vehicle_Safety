import { desc } from "drizzle-orm";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";
import { buildFrame } from "@/lib/simulation";

export const dynamic = "force-dynamic";

const SIGN_LIBRARY = [
  { key: "stop", label: "Stop", action: "Full stop required", limit: 0 },
  { key: "speed", label: "Speed Limit 60", action: "Maintain ≤ 60 km/h", limit: 60 },
  { key: "school", label: "School Zone", action: "Reduce to 25 km/h", limit: 25 },
  { key: "noentry", label: "No Entry", action: "Reroute required", limit: 0 },
  { key: "crossing", label: "Pedestrian Crossing", action: "Yield to pedestrians", limit: 30 },
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
      traffic: frame.traffic,
      speed: frame.speed,
      signs: SIGN_LIBRARY.map((sign, index) => ({
        ...sign,
        detected: frame.traffic.sign.toLowerCase().includes(sign.label.split(" ")[0].toLowerCase()),
        confidence: Number((0.8 + Math.abs(Math.sin(tick / 10 + index)) * 0.19).toFixed(3)),
      })),
      corridor: Array.from({ length: 8 }, (_, i) => ({
        junction: ["MG Road", "Trinity", "Domlur", "Marathahalli", "Silk Board", "Hebbal", "KR Puram", "Hosur Rd"][i],
        congestion: Math.round(30 + Math.abs(Math.sin(tick / 12 + i)) * 60),
        signal: (["green", "yellow", "red"] as const)[(tick + i) % 3],
        avgSpeed: Math.round(18 + Math.abs(Math.cos(tick / 9 + i)) * 42),
      })),
    });
  });
}
