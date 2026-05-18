import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getSettings } from "@/services/setting.service";
import { generateReceiptPDF } from "@/lib/pdf/receipt";
import { runWithBusinessContext } from "@/lib/business-context";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    try {
      const { saleId } = await params;
      const numId = Number(saleId);
      const isNumeric = !isNaN(numId) && isFinite(numId);

      let sale = await prisma.sale.findFirst({
        where: isNumeric
          ? { id: numId, businessId: auth.businessId }
          : { saleId: saleId, businessId: auth.businessId },
        include: {
          customer: true,
          order: { include: { items: { include: { product: true } } } },
        },
      });

      if (!sale) {
        const order = await prisma.order.findFirst({
          where: isNumeric
            ? { id: numId, businessId: auth.businessId, deletedAt: null }
            : { orderId: saleId, businessId: auth.businessId, deletedAt: null },
          include: {
            customer: true,
            items: { include: { product: true } },
          },
        });
        if (order) {
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
      const currencySymbol = settings?.currency === "USD" ? "$" : settings?.currency === "EUR" ? "€" : "৳";

      const formatDate = (date: Date) =>
        new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      let items: { name: string; quantity: number; unitPrice: number; total: number }[] = [];
      if (sale.order?.items && sale.order.items.length > 0) {
        items = sale.order.items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.totalPrice),
        }));
      } else {
        items = [
          {
            name: sale.productName ?? "Product",
            quantity: sale.quantity,
            unitPrice: Number(sale.unitPrice),
            total: Number(sale.totalAmount),
          },
        ];
      }

      const data = {
        receiptId: sale.saleId,
        date: formatDate(sale.date),
        business: {
          name: settings?.businessName || "My Business",
          address: settings?.address ? `${settings.address}${settings.city ? ", " + settings.city : ""}` : undefined,
          invoiceFooter: settings?.invoiceFooter ?? undefined,
        },
        customer: sale.customer ? { name: sale.customer.name } : undefined,
        items,
        subtotal: Number(sale.totalAmount) - Number(sale.taxAmount) + Number(sale.discountAmount),
        discount: Number(sale.discountAmount) || undefined,
        tax: Number(sale.taxAmount) || undefined,
        total: Number(sale.totalAmount),
        paymentMethod: sale.paymentMethod || "Cash",
        paidAmount: Number(sale.totalAmount),
        change: 0,
        currencySymbol,
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