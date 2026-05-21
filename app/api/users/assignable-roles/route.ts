import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { getAssignableRolesForActor } from "@/services/user.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const result = await getAssignableRolesForActor({
    id: auth.user.id,
    role: auth.user.role as RoleName,
    businessId: auth.businessId,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json({ roles: result.roles });
}
