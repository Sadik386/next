import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, forbiddenResponse, unauthorizedResponse } from "./rbac";
import { isCloud } from "./config/app-mode";
import { ROLES } from "@/constants/roles";

/**
 * Guard for platform-level access.
 * Checks if:
 * 1. APP_MODE is cloud
 * 2. User is authenticated
 * 3. User has super_admin role
 */
export async function requirePlatformAdmin(req: NextRequest) {
  // 1. Cloud-only check
  if (!isCloud) {
    return NextResponse.json(
      { success: false, message: "Platform Admin is only available in Cloud mode" },
      { status: 403 }
    );
  }

  // 2. Auth check
  const user = await getUserFromRequest(req);
  if (!user) {
    return unauthorizedResponse();
  }

  // 3. Role check
  if (user.role !== ROLES.SUPER_ADMIN) {
    return forbiddenResponse();
  }

  return { user };
}
