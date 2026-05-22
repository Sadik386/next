import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getStockLogsByProductId } from "@/services/inventory.service";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const productId = Number(id);
  if (!productId || Number.isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const sp = req.nextUrl.searchParams;
  const limit = sp.get("limit") ? Number(sp.get("limit")) : 20;
  const variantId = sp.get("variantId") ? Number(sp.get("variantId")) : null;
  const logs = await getStockLogsByProductId(productId, limit, variantId);
  return NextResponse.json({ logs });
}
