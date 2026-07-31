import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { guard, ok, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    await ensureSeeded();
    const { response } = await requireUser();
    if (response) return response;
    const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(50);
    return ok({ notifications: rows, unread: rows.filter((r) => !r.isRead).length });
  });
}

export async function PATCH(request: Request) {
  return guard(async () => {
    const { response } = await requireUser();
    if (response) return response;
    const body = (await request.json()) as { id?: number; all?: boolean };

    if (body.all) {
      await db.update(notifications).set({ isRead: true });
      return ok({ updated: "all" });
    }
    if (body.id) {
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, Number(body.id)));
      return ok({ updated: body.id });
    }
    return ok({ updated: 0 });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const { user, response } = await requireUser();
    if (response) return response;
    const body = (await request.json()) as Record<string, unknown>;
    const [created] = await db
      .insert(notifications)
      .values({
        userId: user.id,
        vehicleId: body.vehicleId ? Number(body.vehicleId) : null,
        title: String(body.title ?? "System event"),
        message: String(body.message ?? ""),
        level: String(body.level ?? "info"),
        category: String(body.category ?? "system"),
      })
      .returning();
    return ok(created, undefined, 201);
  });
}
