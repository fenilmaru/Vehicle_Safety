import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    await ensureSeeded();
    const { user, response } = await requireUser();
    if (response) return response;

    let [row] = await db.select().from(settings).where(eq(settings.userId, user.id)).limit(1);
    if (!row) {
      [row] = await db.insert(settings).values({ userId: user.id }).returning();
    }
    return ok(row);
  });
}

export async function PUT(request: Request) {
  return guard(async () => {
    const { user, response } = await requireUser();
    if (response) return response;
    const body = (await request.json()) as Record<string, unknown>;

    const patch = {
      theme: body.theme !== undefined ? String(body.theme) : undefined,
      accent: body.accent !== undefined ? String(body.accent) : undefined,
      units: body.units !== undefined ? String(body.units) : undefined,
      autonomyLevel: body.autonomyLevel !== undefined ? Number(body.autonomyLevel) : undefined,
      aiSensitivity: body.aiSensitivity !== undefined ? Number(body.aiSensitivity) : undefined,
      emergencyAutoDispatch:
        body.emergencyAutoDispatch !== undefined ? Boolean(body.emergencyAutoDispatch) : undefined,
      notifyEmail: body.notifyEmail !== undefined ? Boolean(body.notifyEmail) : undefined,
      notifySms: body.notifySms !== undefined ? Boolean(body.notifySms) : undefined,
      notifyPush: body.notifyPush !== undefined ? Boolean(body.notifyPush) : undefined,
      updatedAt: new Date(),
    };

    const existing = await db.select().from(settings).where(eq(settings.userId, user.id)).limit(1);
    if (!existing.length) {
      const [created] = await db.insert(settings).values({ userId: user.id, ...patch }).returning();
      return ok(created);
    }
    const [updated] = await db.update(settings).set(patch).where(eq(settings.userId, user.id)).returning();
    return ok(updated);
  });
}
