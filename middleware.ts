import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge as verifyToken } from "@/lib/jwt-edge";

const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/health",
  "/api/v1/docs",
  "/api/setup",
];

const API_KEY_PROTECTED_ROUTES = [
  "/api/v1/products",
  "/api/v1/orders",
  "/api/v1/customers",
  "/api/v1/inventory",
  "/api/v1/webhooks",
];

const SECURITY_HEADERS = [
  ["X-Frame-Options", "SAMEORIGIN"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
] as const;

function addSecurityHeaders(response: NextResponse) {
  for (const [key, value] of SECURITY_HEADERS) {
    response.headers.set(key, value);
  }
  return response;
}

function jsonUnauthorized(message = "Unauthorized") {
  const response = NextResponse.json(
    { success: false, message },
    { status: 401 }
  );
  return addSecurityHeaders(response);
}

function isRouteMatch(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isPublicApi(pathname: string, method: string) {
  if (pathname === "/" || pathname === "/api") {
    return true;
  }

  if (PUBLIC_API_ROUTES.some((route) => isRouteMatch(pathname, route))) {
    return true;
  }

  if (isRouteMatch(pathname, "/api/pos/m") && method === "GET") {
    return true;
  }

  if (/^\/api\/pos\/session\/[^/]+$/.test(pathname) && method === "GET") {
    return true;
  }

  if (/^\/api\/pos\/session\/[^/]+\/scan$/.test(pathname) && method === "POST") {
    return true;
  }

  if (/^\/api\/scan\/products\/session\/[^/]+$/.test(pathname) && method === "GET") {
    return true;
  }

  if (/^\/api\/scan\/products\/session\/[^/]+\/scan$/.test(pathname) && method === "POST") {
    return true;
  }

  return false;
}

function isApiKeyProtectedRoute(pathname: string) {
  return API_KEY_PROTECTED_ROUTES.some((route) => pathname === route);
}

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return req.cookies.get("auth_token")?.value ?? null;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Root or health / docs routes
  if (isPublicApi(pathname, req.method) || isApiKeyProtectedRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/api/")) {
    const token = extractToken(req);
    if (!token) {
      return jsonUnauthorized("Authentication required");
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return jsonUnauthorized("Invalid or expired token");
    }

    return addSecurityHeaders(NextResponse.next());
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|assets/|uploads/|.*\\.(?:avif|css|gif|ico|jpg|jpeg|js|map|png|svg|txt|webmanifest|webp|xml)$).*)",
  ],
};
