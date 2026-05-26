import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getStockLogsByProductId } from "@/services/inventory.service";
import { runWithBusinessContext } from "@/lib/business-context";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_INVENTORY);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const productId = Number(id);
  if (!productId || Number.isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const sp = req.nextUrl.searchParams;
  const limit = sp.get("limit") ? Number(sp.get("limit")) : 20;
  const variantParam = sp.get("variantId");
  let variantId: number | null = null;
  if (variantParam !== null && variantParam !== "") {
    variantId = Number(variantParam);
    if (!Number.isInteger(variantId) || variantId <= 0) {
      return NextResponse.json({ error: "Invalid product variant id" }, { status: 400 });
    }
  }
  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const logs = await getStockLogsByProductId(productId, limit, variantId);
    return NextResponse.json({ logs });
  });
}
