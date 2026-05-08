import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getOrderById } from "@/services/order.service";
import { generateBarcodeSVG } from "@/lib/barcode";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_ORDERS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const order = await getOrderById(Number(id));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const svg = generateBarcodeSVG(order.orderId);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
