import { desc } from "drizzle-orm";
import { db } from "@/db";
import { accidents, emergencyContacts, vehicles } from "@/db/schema";
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
    const vehicleId = Number(searchParams.get("vehicleId") ?? 0);
    const fleet = await db.select().from(vehicles).orderBy(desc(vehicles.lastSeenAt));
    const vehicle = fleet.find((v) => v.id === vehicleId) ?? fleet[0];
    const tick = Math.floor(Date.now() / 1000) % 600;
    const frame = buildFrame(vehicle?.id ?? 1, tick, vehicle?.lat, vehicle?.lng);

    const [contacts, incidents] = await Promise.all([
      db.select().from(emergencyContacts),
      db.select().from(accidents).orderBy(desc(accidents.detectedAt)).limit(6),
    ]);

    const destination = { lat: 12.9279, lng: 77.6271, name: "Koramangala Charge Hub" };
    const route = Array.from({ length: 16 }, (_, i) => {
      const t = i / 15;
      return {
        lat: frame.lat + (destination.lat - frame.lat) * t + Math.sin(t * Math.PI * 2) * 0.004,
        lng: frame.lng + (destination.lng - frame.lng) * t + Math.cos(t * Math.PI * 2) * 0.004,
      };
    });

    const distanceKm = Number(
      (
        Math.hypot(destination.lat - frame.lat, destination.lng - frame.lng) * 111 +
        2.4
      ).toFixed(1),
    );

    return ok({
      vehicle: vehicle ?? null,
      fleet: fleet.map((v) => ({
        id: v.id,
        vehicleNumber: v.vehicleNumber,
        lat: v.lat,
        lng: v.lng,
        status: v.status,
        currentSpeed: v.currentSpeed,
        heading: v.heading,
      })),
      position: { lat: frame.lat, lng: frame.lng, heading: frame.heading, speed: frame.speed },
      destination,
      route,
      metrics: {
        speed: frame.speed,
        distanceKm,
        etaMin: Math.max(1, Math.round((distanceKm / Math.max(12, frame.speed)) * 60)),
        arrivalAt: new Date(Date.now() + (distanceKm / Math.max(12, frame.speed)) * 3600_000).toISOString(),
      },
      poi: contacts
        .filter((c) => ["hospital", "police", "ambulance"].includes(c.contactType))
        .map((c) => ({ id: c.id, name: c.name, type: c.contactType, lat: c.lat, lng: c.lng, etaMin: c.etaMin })),
      incidents: incidents.map((a) => ({
        id: a.id,
        code: a.code,
        lat: a.lat,
        lng: a.lng,
        severity: a.severity,
        address: a.address,
      })),
    });
  });
}
