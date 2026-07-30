import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { fail, guard, ok } from "@/lib/api";
import { biometricSignature, createToken, hashPassword, publicUser, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RegisterBody = {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  mobile?: string;
  role?: string;
  vehicleNumber?: string;
  avatarUrl?: string;
  faceCaptured?: boolean;
  fingerprintCaptured?: boolean;
};

export async function POST(request: Request) {
  return guard(async () => {
    await ensureSeeded();
    const body = (await request.json()) as RegisterBody;
    const fields: Record<string, string> = {};

    const fullName = (body.fullName ?? "").trim();
    const username = (body.username ?? "").trim().toLowerCase();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (fullName.length < 3) fields.fullName = "Full name must be at least 3 characters";
    if (!/^[a-z0-9._-]{3,}$/.test(username)) fields.username = "Username must be 3+ chars (letters, numbers, . _ -)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = "Enter a valid email address";
    if (password.length < 8) fields.password = "Password must be at least 8 characters";
    if (password !== body.confirmPassword) fields.confirmPassword = "Passwords do not match";
    if (!/^[+0-9 ()-]{8,}$/.test(body.mobile ?? "")) fields.mobile = "Enter a valid mobile number";
    if (Object.keys(fields).length) return fail("Validation failed", 422, "validation_error", fields);

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);
    if (existing) return fail("An operator with that email or username already exists", 409, "conflict");

    const [created] = await db
      .insert(users)
      .values({
        fullName,
        username,
        email,
        passwordHash: hashPassword(password),
        mobile: body.mobile ?? "",
        role: body.role ?? "driver",
        vehicleNumber: (body.vehicleNumber ?? "").toUpperCase(),
        avatarUrl: body.avatarUrl ?? "",
        faceEnrolled: Boolean(body.faceCaptured),
        fingerprintEnrolled: Boolean(body.fingerprintCaptured),
        faceSignature: body.faceCaptured ? biometricSignature(`${username}-face`) : "",
        fingerprintSignature: body.fingerprintCaptured ? biometricSignature(`${username}-print`) : "",
      })
      .returning();

    await db.insert(settings).values({ userId: created.id });

    const token = await createToken({
      sub: String(created.id),
      username: created.username,
      role: created.role,
      email: created.email,
    });
    await setSessionCookie(token);

    return ok({ token, user: publicUser(created) }, undefined, 201);
  });
}
