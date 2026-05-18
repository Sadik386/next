import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { approveDeleteRequest } from "@/services/delete-request.service";
import { runWithBusinessContext } from "@/lib/business-context";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.APPROVE_DELETE_REQUEST);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  try {
    const result = await runWithBusinessContext(
      { ...auth.user, businessId: auth.businessId },
      () => approveDeleteRequest(Number(id), auth.user.id)
    );

    if ("error" in result) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Delete request approved." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Internal error" }, { status: 500 });
  }
}