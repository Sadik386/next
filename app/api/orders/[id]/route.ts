import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import {
  getOrderByIdOrOrderId,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/services/order.service";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId) {
    return NextResponse.json({ error: "Business context required" }, { status: 403 });
  }

  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;
  const { id } = await ctx.params;

  return runWithBusinessContext(user, async () => {
    const order = await getOrderByIdOrOrderId(id);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ order });
  });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_ORDER);
  if (auth instanceof NextResponse) return auth;

  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;
  const { id } = await ctx.params;

  return runWithBusinessContext(user, async () => {
    try {
      const order = await getOrderByIdOrOrderId(id);
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

      const body = await req.json();

      if (body.status !== undefined) {
        if (body.status === "cancelled") {
          const cancelAuth = await requirePermission(req, PERMISSIONS.CANCEL_ORDER);
          if (cancelAuth instanceof NextResponse) return cancelAuth;
        }
        const result = await updateOrderStatus(order.id, body.status, auth.user.id);
        if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        return NextResponse.json({ order: result });
      }

      if (body.paymentStatus !== undefined) {
        const result = await updatePaymentStatus(
          order.id,
          body.paymentStatus,
          body.paidAmount,
          auth.user.id
        );
        if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        return NextResponse.json({ order: result });
      }

      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  });
}
