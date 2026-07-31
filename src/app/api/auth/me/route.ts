import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, vehicles } from "@/db/schema";
import { guard, ok, requireUser } from "@/lib/api";
import { publicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    const { user, response } = await requireUser();
    if (response) return response;

    const [config] = await db.select().from(settings).where(eq(settings.userId, user.id)).limit(1);
    const assigned = await db.select().from(vehicles).where(eq(vehicles.driverId, user.id));

    return ok({ user: publicUser(user), settings: config ?? null, vehicles: assigned });
  });
}

export async function PATCH(request: Request) {
  return guard(async () => {
    const { user, response } = await requireUser();
    if (response) return response;
    const body = (await request.json()) as Record<string, string>;
    const { users: usersTable } = await import("@/db/schema");

    const [updated] = await db
      .update(usersTable)
      .set({
        fullName: body.fullName ?? user.fullName,
        mobile: body.mobile ?? user.mobile,
        vehicleNumber: body.vehicleNumber ?? user.vehicleNumber,
        avatarUrl: body.avatarUrl ?? user.avatarUrl,
        role: body.role ?? user.role,
      })
      .where(eq(usersTable.id, user.id))
      .returning();

    return ok({ user: publicUser(updated) });
  });
}
