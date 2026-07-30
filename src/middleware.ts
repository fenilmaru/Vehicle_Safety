import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = process.env.AUTH_SECRET ?? "aas-autonomous-activation-system-dev-secret-key";
const key = new TextEncoder().encode(SECRET);

const PROTECTED = [
  "/dashboard",
  "/vehicles",
  "/camera",
  "/ai-detection",
  "/driver",
  "/traffic",
  "/gps",
  "/accidents",
  "/emergency",
  "/reports",
  "/analytics",
  "/settings",
  "/notifications",
  "/profile",
];

const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("aas_session")?.value;

  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, key, { issuer: "autonomous-activation-system" });
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`)) && !valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (valid && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vehicles/:path*",
    "/camera/:path*",
    "/ai-detection/:path*",
    "/driver/:path*",
    "/traffic/:path*",
    "/gps/:path*",
    "/accidents/:path*",
    "/emergency/:path*",
    "/reports/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
