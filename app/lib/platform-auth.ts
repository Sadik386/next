import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, forbiddenResponse, unauthorizedResponse } from "./rbac";
import { isCloud } from "./config/app-mode";
import { ROLES, type RoleName } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/lib/jwt";
import { activeBusinessMemberStatusWhere } from "@/constants/business-member-status";

export type PlatformAdminUser = {
  id: number;
  name: string;
  email: string;
  username?: string;
  role: RoleName;
  isFounder: boolean;
};

export async function getPlatformAdminUser(
  user: JWTPayload | null
): Promise<PlatformAdminUser | null> {
  if (!isCloud || !user) {
    return null;
  }

  const dbUser = await prisma.user.findFirst({
    where: {
      id: user.id,
      isActive: true,
      deletedAt: null,
      isFounder: true,
    },
    include: { role: true },
  });

  if (!dbUser) return null;

  const hasSuperAdminMembership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      status: activeBusinessMemberStatusWhere(),
      business: { isActive: true },
      role: { name: ROLES.SUPER_ADMIN },
    },
  });
  if (!hasSuperAdminMembership) return null;

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    username: dbUser.username || undefined,
    role: ROLES.SUPER_ADMIN,
    isFounder: dbUser.isFounder,
  };
}

/**
 * Guard for platform-level access.
 * Checks if:
 * 1. APP_MODE is cloud
 * 2. User is authenticated
 * 3. User has a live active super_admin role in the database
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

  // 3. DB-backed platform role check
  const platformUser = await getPlatformAdminUser(user);
  if (!platformUser) {
    return forbiddenResponse();
  }

  return { user: platformUser };
}
