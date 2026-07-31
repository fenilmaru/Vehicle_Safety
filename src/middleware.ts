import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * DISABLED: All auth is handled by:
 * 1. Django backend (JWT validation on every /api/* call)
 * 2. Client-side AuthContext + ProtectedRoute components
 * 
 * Middleware was causing redirect loops after Django login.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
