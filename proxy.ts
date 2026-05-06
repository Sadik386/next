import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const publicRoutes = ["/login", "/register", "/forgot-password"];
const publicApiRoutes = ["/api/auth/login", "/api/auth/logout", "/pos/mobile"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (publicApiRoutes.some((r) => pathname.startsWith(r))) return NextResponse.next();
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads")
  ) {
    return NextResponse.next();
  }
  if (publicRoutes.includes(pathname)) {
    const token = req.cookies.get("auth_token")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  const payload = await verifyToken(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("auth_token", "", { maxAge: 0 });
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
