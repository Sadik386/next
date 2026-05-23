import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getSettings } from "@/services/setting.service";
import { generateReceiptPDF } from "@/lib/pdf/receipt";
import { runWithBusinessContext } from "@/lib/business-context";
import { mapReceiptItems } from "@/lib/pdf/documentItems";
import { buildDocumentProfile, toBusinessInfo } from "@/lib/pdf/documentProfile";
import { receiptTotals } from "@/lib/pdf/documentTotals";
import { formatDocumentDate } from "@/lib/pdf/formatters";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    try {
      const { saleId } = await params;
      
      // Try finding by exact saleId string first (e.g. SL-001)
      let sale = await prisma.sale.findFirst({
        where: { saleId: saleId, businessId: auth.businessId },
        include: {
          customer: true,
          order: { include: { items: { include: { product: true } } } },
        },
      });

      const numId = Number(saleId);
      const isNumeric = !isNaN(numId) && isFinite(numId) && Number.isInteger(numId);

      // If not found by string and it's numeric, try finding by numeric ID
      if (!sale && isNumeric) {
        sale = await prisma.sale.findFirst({
          where: { id: numId, businessId: auth.businessId },
          include: {
            customer: true,
            order: { include: { items: { include: { product: true } } } },
          },
        });
      }

      // If still not found, try finding by Order ID or Order Number
      if (!sale) {
        const order = await prisma.order.findFirst({
          where: {
            businessId: auth.businessId,
            deletedAt: null,
            OR: [
              isNumeric ? { id: numId } : {},
              { orderId: saleId }
            ].filter(o => Object.keys(o).length > 0)
          },
          include: {
            customer: true,
            items: { include: { product: true } },
          },
        });

        if (order) {
          // For an order, we represent it using its first sale context
          const firstSale = await prisma.sale.findFirst({
            where: { orderId: order.id, businessId: auth.businessId },
            include: { customer: true },
          });
          if (firstSale) {
            sale = { ...firstSale, order: order as any };
          }
        }
      }

      if (!sale) {
        return NextResponse.json({ error: "Sale not found or access denied" }, { status: 404 });
      }

      const settings = await getSettings();
      const profile = buildDocumentProfile(settings);
      const totals = receiptTotals(sale);

      const data = {
        receiptId: sale.saleId,
        date: formatDocumentDate(sale.date),
        business: toBusinessInfo(profile),
        customer: sale.customer ? { name: sale.customer.name } : undefined,
        items: mapReceiptItems(sale),
        ...totals,
        currencySymbol: profile.currencySymbol,
      };

      const blob = await generateReceiptPDF(data);

      return new NextResponse(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="receipt-${sale.saleId}.pdf"`,
        },
      });
    } catch (err) {
      console.error("Receipt PDF generation error:", err);
      const message = err instanceof Error ? err.message : "Failed to generate receipt PDF";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
