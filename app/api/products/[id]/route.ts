import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import {
  getProductByIdOrProductId,
  updateProduct,
  ProductValidationError,
} from "@/services/product.service";
import { runWithBusinessContext } from "@/lib/business-context";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const { id } = await ctx.params;
    const product = await getProductByIdOrProductId(id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_PRODUCT);
  if (auth instanceof NextResponse) return auth;
  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    try {
      const { id } = await ctx.params;
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
      }
      const body = await req.json();
      const product = await updateProduct(numericId, body, auth.user.id);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ product });
    } catch (err) {
      if (err instanceof ProductValidationError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error("Product update error:", err);
      const message =
        err instanceof Error && process.env.NODE_ENV !== "production"
          ? err.message
          : "Failed to update product";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
