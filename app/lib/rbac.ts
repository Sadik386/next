import { ROLE_PERMISSIONS, Permission } from "@/constants/permissions";
import { RoleName } from "@/constants/roles";
import { JWTPayload, verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";

export function hasPermission(role: RoleName, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes(permission);
}

export async function getUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function requireAuth(req: NextRequest): Promise<{ user: JWTPayload } | NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return { user };
}

export async function requirePermission(
  req: NextRequest,
  permission: Permission
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;
  if (!hasPermission(user.role as RoleName, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { user };
}
