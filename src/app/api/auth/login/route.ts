import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { fail, guard, ok } from "@/lib/api";
import { createToken, publicUser, setSessionCookie, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return guard(async () => {
    await ensureSeeded();
    const body = (await request.json()) as { identifier?: string; password?: string };
    const identifier = (body.identifier ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    const fields: Record<string, string> = {};
    if (!identifier) fields.identifier = "Email or username is required";
    if (!password) fields.password = "Password is required";
    if (Object.keys(fields).length) return fail("Validation failed", 422, "validation_error", fields);

    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.username, identifier)))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return fail("Invalid credentials. Please try again.", 401, "invalid_credentials");
    }
    if (user.status !== "active") return fail("Account is suspended", 403, "forbidden");

    const token = await createToken({
      sub: String(user.id),
      username: user.username,
      role: user.role,
      email: user.email,
    });
    await setSessionCookie(token);
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    return ok({
      token,
      user: publicUser(user),
      nextStep: user.faceEnrolled ? "face" : user.fingerprintEnrolled ? "fingerprint" : "dashboard",
    });
  });
}
