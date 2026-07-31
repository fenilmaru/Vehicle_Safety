import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accidents, dispatches, emergencyContacts, notifications, vehicles } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    await ensureSeeded();
    const { response } = await requireUser();
    if (response) return response;

    const [contacts, activeDispatches, criticalAccidents, fleet] = await Promise.all([
      db.select().from(emergencyContacts),
      db.select().from(dispatches).orderBy(desc(dispatches.createdAt)).limit(12),
      db.select().from(accidents).where(eq(accidents.status, "responding")).orderBy(desc(accidents.detectedAt)),
      db.select().from(vehicles),
    ]);

    return ok({
      contacts,
      dispatches: activeDispatches,
      activeIncident: criticalAccidents[0]
        ? {
            ...criticalAccidents[0],
            vehicle: fleet.find((v) => v.id === criticalAccidents[0].vehicleId) ?? null,
          }
        : null,
      responseGrid: {
        hospital: contacts.filter((c) => c.contactType === "hospital"),
        police: contacts.filter((c) => c.contactType === "police"),
        ambulance: contacts.filter((c) => c.contactType === "ambulance"),
        family: contacts.filter((c) => c.contactType === "family"),
        operations: contacts.filter((c) => c.contactType === "operations"),
      },
      stats: {
        activeIncidents: criticalAccidents.length,
        unitsEnRoute: activeDispatches.filter((d) => d.status === "en_route").length,
        avgEtaMin: Math.round(
          activeDispatches.reduce((a, d) => a + d.etaMin, 0) / Math.max(1, activeDispatches.length),
        ),
        contactsReachable: contacts.filter((c) => c.available).length,
      },
    });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const { user, response } = await requireUser();
    if (response) return response;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "sos");
    const service = String(body.service ?? "ambulance");

    const [dispatch] = await db
      .insert(dispatches)
      .values({
        accidentId: body.accidentId ? Number(body.accidentId) : null,
        vehicleId: body.vehicleId ? Number(body.vehicleId) : null,
        service: action === "sos" ? "sos_broadcast" : service,
        status: action === "notify" ? "notified" : "dispatched",
        etaMin: action === "sos" ? 6 : 9,
        notes: String(body.notes ?? `Triggered by ${user.fullName} from Emergency Command Centre`),
      })
      .returning();

    await db.insert(notifications).values({
      userId: user.id,
      vehicleId: body.vehicleId ? Number(body.vehicleId) : null,
      title: action === "sos" ? "SOS broadcast transmitted" : `${service} notified`,
      message: `Emergency action "${action}" executed at ${new Date().toLocaleTimeString()}.`,
      level: action === "sos" ? "critical" : "warning",
      category: "emergency",
    });

    return ok({ dispatch, acknowledgedAt: new Date().toISOString() }, undefined, 201);
  });
}
