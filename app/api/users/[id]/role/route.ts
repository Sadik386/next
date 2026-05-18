import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { RoleName } from "@/constants/roles";
import { changeRole } from "@/services/user.service";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.ASSIGN_ROLE);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const roleName = body.roleName as RoleName;
    if (!roleName) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }
    const result = await changeRole(
      Number(id),
      roleName,
      auth.user.role as RoleName,
      auth.user.id
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ user: (result as any).user });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
