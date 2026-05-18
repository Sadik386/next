import { ROLE_PERMISSIONS, Permission } from "@/constants/permissions";
import { RoleName } from "@/constants/roles";
import {
  BusinessContextError,
  setActiveBusinessContextForUser,
  type BusinessContext,
} from "@/lib/business-context";
import { JWTPayload, verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";

export function hasPermission(role: RoleName, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes(permission);
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { success: false, message: "Forbidden" },
    { status: 403 }
  );
}

export async function getUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function requireAuth(
  req: NextRequest
): Promise<
  { user: JWTPayload; businessId: number; businessContext: BusinessContext } | NextResponse
> {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorizedResponse();
  try {
    const businessContext = await setActiveBusinessContextForUser(user);
    const userWithBusiness = { ...user, businessId: businessContext.businessId };
    return { user: userWithBusiness, businessId: businessContext.businessId, businessContext };
  } catch (error) {
    if (error instanceof BusinessContextError) return forbiddenResponse();
    throw error;
  }
}

export async function requirePermission(
  req: NextRequest,
  permission: Permission
): Promise<
  { user: JWTPayload; businessId: number; businessContext: BusinessContext } | NextResponse
> {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;
  if (!hasPermission(user.role as RoleName, permission)) {
    return forbiddenResponse();
  }
  return authResult;
}
