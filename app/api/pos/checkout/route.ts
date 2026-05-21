import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { runWithBusinessContext } from "@/lib/business-context";
import { checkoutPos } from "@/services/pos.service";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.USE_POS);
  if (auth instanceof NextResponse) return auth;

  const user = { ...auth.user, businessId: auth.businessId };

  return runWithBusinessContext(user, async () => {
    try {
      const body = await req.json();
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
      }
      const order = await checkoutPos(
        {
          customerId: body.customerId ?? null,
          items: body.items,
          discountAmount: body.discountAmount ?? 0,
          paymentMethod: body.paymentMethod ?? null,
          paymentStatus: body.paymentStatus ?? "paid",
          paidAmount: body.paidAmount,
          notes: body.notes ?? null,
        },
        auth.user.id
      );
      return NextResponse.json({ order });
    } catch (err) {
      console.error("POS checkout error:", err);
      const message = err instanceof Error ? err.message : "Server error";
      const status =
        message === "Customer not found" || message === "Product not found" ? 404 : 400;
      return NextResponse.json({ error: message }, { status });
    }
  });
}
