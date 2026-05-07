import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import {
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/services/order.service";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_ORDERS);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const order = await getOrderById(Number(id));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_ORDER);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const orderId = Number(id);

    if (body.status !== undefined) {
      if (body.status === "cancelled") {
        const cancelAuth = await requirePermission(req, PERMISSIONS.CANCEL_ORDER);
        if (cancelAuth instanceof NextResponse) return cancelAuth;
      }
      const result = await updateOrderStatus(orderId, body.status, auth.user.id);
      if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ order: result });
    }

    if (body.paymentStatus !== undefined) {
      const result = await updatePaymentStatus(
        orderId,
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
}
