import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { requestDeleteProduct } from "@/services/product.service";
import { runWithBusinessContext } from "@/lib/business-context";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_DELETE_REQUEST);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const { id } = await ctx.params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    try {
      const { reason } = await req.json();
      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return NextResponse.json({ error: "Reason is required" }, { status: 400 });
      }
      const result = await requestDeleteProduct(productId, reason.trim(), auth.user.id);
      if (!result) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ request: result, message: "Delete request submitted." });
    } catch (err) {
      console.error("Product delete request error:", err);
      const message =
        err instanceof Error && process.env.NODE_ENV !== "production"
          ? err.message
          : "Failed to submit delete request";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
