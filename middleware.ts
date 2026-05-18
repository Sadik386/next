import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge as verifyToken } from "@/lib/jwt-edge";
import { currentAppMode } from "@/lib/config/app-mode";

const PUBLIC_PAGE_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

const PUBLIC_AUTH_PAGE_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

const PUBLIC_PAGE_PREFIXES = ["/pos/mobile"];

const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
  "/api/v1/docs",
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
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
] as const;

function addSecurityHeaders(response: NextResponse) {
  for (const [key, value] of SECURITY_HEADERS) {
    response.headers.set(key, value);
  }
  return response;
}

function nextResponse() {
  return addSecurityHeaders(NextResponse.next());
}

function jsonUnauthorized(clearCookie = false) {
  const response = NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 }
  );
  if (clearCookie) {
    response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
  }
  return addSecurityHeaders(response);
}

function loginRedirect(req: NextRequest, clearCookie = false) {
  const loginUrl = new URL("/login", req.url);
  const redirectPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;

  if (redirectPath !== "/") {
    loginUrl.searchParams.set("redirect", redirectPath);
  }

  const response = NextResponse.redirect(loginUrl);
  if (clearCookie) {
    response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
  }
  return addSecurityHeaders(response);
}

function isRouteMatch(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isPublicAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/uploads/") ||
    /\.(?:avif|css|gif|ico|jpg|jpeg|js|map|png|svg|txt|webmanifest|webp|xml)$/.test(pathname)
  );
}

function isPublicPage(pathname: string) {
  return (
    PUBLIC_PAGE_ROUTES.has(pathname) ||
    isSetupPage(pathname) ||
    PUBLIC_PAGE_PREFIXES.some((route) => isRouteMatch(pathname, route))
  );
}

function isSetupPage(pathname: string) {
  if (pathname !== "/setup") return false;

  // TODO: Once setup completion is edge-readable, block this route after
  // installation in mode-specific ways for cloud, self-hosted, and desktop.
  return (
    currentAppMode === "cloud" ||
    currentAppMode === "self_hosted" ||
    currentAppMode === "desktop"
  );
}

function isSetupApi(pathname: string) {
  if (!isRouteMatch(pathname, "/api/setup")) return false;

  // Setup APIs stay public for first-run installation in every supported mode.
  return (
    currentAppMode === "cloud" ||
    currentAppMode === "self_hosted" ||
    currentAppMode === "desktop"
  );
}

function isPublicApi(pathname: string, method: string) {
  if (PUBLIC_API_ROUTES.some((route) => isRouteMatch(pathname, route))) {
    return true;
  }

  if (isSetupApi(pathname)) {
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

  return false;
}

function isApiKeyProtectedRoute(pathname: string) {
  return API_KEY_PROTECTED_ROUTES.some((route) => pathname === route);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicAssetPath(pathname)) {
    return nextResponse();
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname, req.method) || isApiKeyProtectedRoute(pathname)) {
      return nextResponse();
    }

    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return jsonUnauthorized();
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return jsonUnauthorized(true);
    }

    // TODO: Use payload.businessId for edge-level tenant-aware routing once
    // middleware needs business scoping beyond authentication.
    return nextResponse();
  }

  if (isPublicPage(pathname)) {
    // If the path is "/setup" and the user is not authenticated, redirect to login.
    // This prevents the incorrect redirect to onboarding when setup is complete.
    if (pathname === "/setup") {
      const token = req.cookies.get("auth_token")?.value;
      if (!token) {
        return loginRedirect(req);
      }
    }

    if (PUBLIC_AUTH_PAGE_ROUTES.has(pathname)) {
      const token = req.cookies.get("auth_token")?.value;
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          return addSecurityHeaders(NextResponse.redirect(new URL("/dashboard", req.url)));
        }
      }
    }
    return nextResponse();
  }

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return loginRedirect(req);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return loginRedirect(req, true);
  }

  // TODO: Use payload.businessId for edge-level tenant-aware routing once
  // middleware needs business scoping beyond authentication.
  return nextResponse();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|assets/|uploads/|.*\\.(?:avif|css|gif|ico|jpg|jpeg|js|map|png|svg|txt|webmanifest|webp|xml)$).*)",
  ],
};
