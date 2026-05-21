import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { deleteHeldOrder } from "@/services/pos.service";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.USE_POS);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const result = await deleteHeldOrder(Number(id), auth.user.id, auth.businessId);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
