import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { rejectDeleteRequest } from "@/services/delete-request.service";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(req, PERMISSIONS.APPROVE_DELETE_REQUEST);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const result = await rejectDeleteRequest(Number(id), auth.user.id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
