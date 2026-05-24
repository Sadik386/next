import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getSettings } from "@/services/setting.service";
import { generateDeliverySlipPDF } from "@/lib/pdf/deliverySlip";
import { runWithBusinessContext } from "@/lib/business-context";
import { mapOrderDeliveryItems } from "@/lib/pdf/documentItems";
import { buildDocumentProfile, toBusinessInfo } from "@/lib/pdf/documentProfile";
import { deliveryTotals } from "@/lib/pdf/documentTotals";
import { formatDocumentDate } from "@/lib/pdf/formatters";
import { guardPdfPrintUsage, incrementUsageSafely } from "@/lib/subscription-guard";
import { USAGE_KEYS } from "@/lib/pricing";
import { checkPdfUsageCount } from "@/lib/subscription-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const guard = await guardPdfPrintUsage(auth.businessId);
    if (!guard.allowed) {
      return NextResponse.json({ error: guard.reason || "PDF/Print limit reached for your current plan." }, { status: 403 });
    }

    try {
      const { orderId } = await params;
      const numId = Number(orderId);
      const isNumeric = !isNaN(numId) && isFinite(numId);

      const order = await prisma.order.findFirst({
        where: {
          deletedAt: null,
          businessId: auth.businessId,
          OR: isNumeric
            ? [{ id: numId }, { orderId: orderId }]
            : [{ orderId: orderId }],
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
      }

      const settings = await getSettings();
      const profile = buildDocumentProfile(settings);
      const totals = deliveryTotals(order);

      const data = {
        slipNumber: `DS-${order.orderId.replace("ORD-", "")}`,
        orderId: order.orderId,
        date: formatDocumentDate(order.createdAt),
        business: toBusinessInfo(profile),
        customer: {
          name: order.customer.name,
          phone: order.customer.mobile || undefined,
          shippingAddress: order.shippingAddress || order.customer.streetAddress || "N/A",
        },
        courierName: undefined,
        trackingId: undefined,
        deliveryMethod: undefined,
        deliveryStatus: order.status || undefined,
        codAmount: totals.codAmount,
        currencySymbol: profile.currencySymbol,
        items: mapOrderDeliveryItems(order.items),
        notes: order.notes || undefined,
      };

      const blob = await generateDeliverySlipPDF(data);

      const docId = order.id.toString();
      const { counted } = checkPdfUsageCount(auth.businessId, "delivery", docId);
      if (counted) {
        incrementUsageSafely(auth.businessId, USAGE_KEYS.PDF_PRINT_COUNT);
      }

      return new NextResponse(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="delivery-${order.orderId}.pdf"`,
        },
      });
    } catch (err) {
      console.error("Delivery slip PDF generation error:", err);
      const message = err instanceof Error ? err.message : "Failed to generate delivery slip PDF";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
