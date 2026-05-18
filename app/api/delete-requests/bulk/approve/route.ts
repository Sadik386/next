import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { approveBulkDeleteRequests } from "@/services/delete-request.service";
import { runWithBusinessContext } from "@/lib/business-context";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.BULK_APPROVE_DELETE_REQUEST);
  if (auth instanceof NextResponse) return auth;

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ success: false, message: "No IDs provided" }, { status: 400 });
  }

  try {
    const result = await runWithBusinessContext(
      { ...auth.user, businessId: auth.businessId },
      () => approveBulkDeleteRequests(ids.map(Number), auth.user.id)
    );
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Internal error" }, { status: 500 });
  }
}