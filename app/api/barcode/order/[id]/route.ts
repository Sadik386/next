import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { generateBarcodeSVG } from "@/lib/barcode";
import { runWithBusinessContext } from "@/lib/business-context";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_ORDERS);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const { id } = await ctx.params;
    const numId = Number(id);
    const isNumeric = !isNaN(numId) && isFinite(numId);

    const order = await prisma.order.findFirst({
      where: {
        deletedAt: null,
        businessId: auth.businessId,
        OR: isNumeric
          ? [{ id: numId }, { orderId: id }]
          : [{ orderId: id }],
      },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const svg = generateBarcodeSVG(order.orderId);
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  });
}
