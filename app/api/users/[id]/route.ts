import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getUserById } from "@/services/user.service";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_USERS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const userProfile = await getUserById(Number(id));
  if (!userProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user: userProfile });
}