import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/db/schema";

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message: string; code: string; fields?: Record<string, string> };
  meta?: Record<string, unknown>;
};

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json<ApiEnvelope<T>>({ success: true, data, meta }, { status });
}

export function fail(
  message: string,
  status = 400,
  code = "bad_request",
  fields?: Record<string, string>,
) {
  return NextResponse.json<ApiEnvelope<never>>(
    { success: false, error: { message, code, fields } },
    { status },
  );
}

export const unauthorized = () => fail("Authentication required", 401, "unauthorized");
export const forbidden = () => fail("Insufficient role privileges", 403, "forbidden");
export const notFound = (what = "Resource") => fail(`${what} not found`, 404, "not_found");

export async function requireUser(): Promise<
  { user: User; response?: never } | { user?: never; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { response: unauthorized() };
  return { user };
}

export async function guard<T>(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    console.error("[api]", message);
    return fail(message, 500, "server_error");
  }
}

export function numberOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
