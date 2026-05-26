import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { RoleName } from "@/constants/roles";
import { changeRole } from "@/services/user.service";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.ASSIGN_ROLE);
  if (auth instanceof NextResponse) return auth;

  try {
    try {
      await guardReadOnlyWrite(auth.businessId);
    } catch (guardErr) {
      if (guardErr instanceof SubscriptionGuardError) {
        return NextResponse.json({ error: guardErr.message, code: guardErr.code }, { status: guardErr.status });
      }
      throw guardErr;
    }
    const { id } = await ctx.params;
    const body = await req.json();
    const roleName = body.roleName as RoleName;
    if (!roleName) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }
    const result = await changeRole(
      Number(id),
      roleName,
      { id: auth.user.id, role: auth.user.role as RoleName, businessId: auth.businessId }
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }
    return NextResponse.json({ user: result.user });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
