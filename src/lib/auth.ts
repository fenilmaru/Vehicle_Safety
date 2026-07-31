import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SESSION_COOKIE = "aas_session";
const SECRET = process.env.AUTH_SECRET ?? "aas-autonomous-activation-system-dev-secret-key";
const encodedSecret = new TextEncoder().encode(SECRET);

export type SessionPayload = {
  sub: string;
  username: string;
  role: string;
  email: string;
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== derived.length) return false;
  return timingSafeEqual(derived, keyBuffer);
}

export function biometricSignature(raw: string): string {
  return createHash("sha256").update(raw).digest("hex").slice(0, 48);
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("autonomous-activation-system")
    .setExpirationTime("7d")
    .sign(encodedSecret);
}

export async function readToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      issuer: "autonomous-activation-system",
    });
    return {
      sub: String(payload.sub ?? payload.userId ?? ""),
      username: String(payload.username ?? ""),
      role: String(payload.role ?? "driver"),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.sub) return null;
  const id = Number(session.sub);
  if (!Number.isFinite(id)) return null;
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export function publicUser<T extends { passwordHash?: string }>(user: T) {
  const clone = { ...user };
  delete clone.passwordHash;
  return clone;
}
