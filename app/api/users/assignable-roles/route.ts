import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { getAssignableRoleNames } from "@/services/user.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const roles = await getAssignableRoleNames(auth.user.role as RoleName);
  return NextResponse.json({ roles });
}
