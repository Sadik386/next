import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { requestDeleteCustomer } from "@/services/customer.service";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_DELETE_REQUEST);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await ctx.params;
    const { reason } = await req.json();
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }
    const result = await requestDeleteCustomer(Number(id), reason.trim(), auth.user.id);
    if (!result) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ request: result });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
