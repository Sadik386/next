import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { runWithBusinessContext } from "@/lib/business-context";
import { checkoutPos, POS_PAYMENT_METHOD_REQUIRED_MESSAGE } from "@/services/pos.service";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.USE_POS);
  if (auth instanceof NextResponse) return auth;

  try {
    await guardReadOnlyWrite(auth.businessId);
  } catch (guardErr) {
    if (guardErr instanceof SubscriptionGuardError) {
      return NextResponse.json({ error: guardErr.message, code: guardErr.code }, { status: guardErr.status });
    }
    throw guardErr;
  }

  const user = { ...auth.user, businessId: auth.businessId };

  return runWithBusinessContext(user, async () => {
    try {
      const body = await req.json();
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
      }
      const paymentStatus =
        typeof body.paymentStatus === "string" ? body.paymentStatus : "paid";
      const paymentMethod =
        typeof body.paymentMethod === "string" ? body.paymentMethod.trim() : null;
      const normalizedPaymentMethod =
        paymentStatus === "unpaid" ? null : paymentMethod;

      if (
        (paymentStatus === "paid" || paymentStatus === "partial") &&
        !normalizedPaymentMethod
      ) {
        return NextResponse.json(
          { error: POS_PAYMENT_METHOD_REQUIRED_MESSAGE },
          { status: 400 }
        );
      }

      const order = await checkoutPos(
        {
          customerId: body.customerId ?? null,
          items: body.items,
          discountAmount: body.discountAmount ?? 0,
          paymentMethod: normalizedPaymentMethod,
          paymentStatus,
          paidAmount: body.paidAmount,
          notes: body.notes ?? null,
        },
        auth.user.id
      );
      return NextResponse.json({ order });
    } catch (err) {
      if (err instanceof SubscriptionGuardError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }
      console.error("POS checkout error:", err);
      const message = err instanceof Error ? err.message : "Server error";
      const status =
        message === "Customer not found" || message === "Product not found" ? 404 : 400;
      return NextResponse.json({ error: message }, { status });
    }
  });
}
