import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getOrderByIdOrOrderId, requestDeleteOrder } from "@/services/order.service";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_DELETE_REQUEST);
  if (auth instanceof NextResponse) return auth;

  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;

  return runWithBusinessContext(user, async () => {
    const { id } = await ctx.params;

    const order = await getOrderByIdOrOrderId(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    try {
      const { reason } = await req.json();
      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return NextResponse.json({ error: "Reason is required" }, { status: 400 });
      }
      const result = await requestDeleteOrder(order.id, reason.trim(), auth.user.id);
      if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ request: result, message: "Delete request submitted." });
    } catch (err) {
      console.error("Order delete request error:", err);
      const message =
        err instanceof Error && process.env.NODE_ENV !== "production"
          ? err.message
          : "Failed to submit delete request";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
