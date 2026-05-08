import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getProductById } from "@/services/product.service";
import { generateBarcodeSVG } from "@/lib/barcode";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_PRODUCTS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const product = await getProductById(Number(id));
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const svg = generateBarcodeSVG(product.productId);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
