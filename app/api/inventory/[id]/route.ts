import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { runWithBusinessContext } from "@/lib/business-context";
import { adjustStock, type AdjustmentType } from "@/services/inventory.service";

const VALID_TYPES: AdjustmentType[] = ["add", "subtract", "set"];

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.ADJUST_INVENTORY);
  if (auth instanceof NextResponse) return auth;

  const user = { ...auth.user, businessId: auth.businessId };

  return runWithBusinessContext(user, async () => {
    try {
      const { id } = await ctx.params;
      const productId = Number(id);
      if (!productId || Number.isNaN(productId)) {
        return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
      }

      const body = await req.json();
      if (!VALID_TYPES.includes(body.type)) {
        return NextResponse.json({ error: "Invalid adjustment type" }, { status: 400 });
      }
      if (body.quantity == null || Number(body.quantity) < 0) {
        return NextResponse.json({ error: "Quantity must be a non-negative number" }, { status: 400 });
      }

      const result = await adjustStock(
        productId,
        {
          type: body.type as AdjustmentType,
          quantity: Number(body.quantity),
          reason: body.reason ?? null,
          threshold: body.threshold !== undefined && body.threshold !== "" ? Number(body.threshold) : undefined,
          location: body.location !== undefined ? (body.location || null) : undefined,
        },
        auth.user.id
      );

      if (!result) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json(result);
    } catch (err) {
      console.error("Inventory adjust error:", err);
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
