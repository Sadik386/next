import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { RoleName } from "@/constants/roles";
import { changeStatus } from "@/services/user.service";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_USER);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be boolean" }, { status: 400 });
    }
    const result = await changeStatus(
      Number(id),
      body.isActive,
      auth.user.role as RoleName,
      auth.user.id
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ user: result.user });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
