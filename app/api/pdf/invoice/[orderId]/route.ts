import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getSettings } from "@/services/setting.service";
import { generateInvoicePDF } from "@/lib/pdf/invoice";
import { runWithBusinessContext } from "@/lib/business-context";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
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
      const currencySymbol = currencyPrefix(settings?.currency);

      const formatDate = (date: Date) =>
        new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      const balanceDue = Number(order.totalAmount) - Number(order.paidAmount);

      const data = {
        invoiceNumber: order.orderId,
        orderId: order.orderId,
        date: formatDate(order.createdAt),
        business: {
          name: settings?.businessName || "My Business",
          address: settings?.address ? `${settings.address}${settings.city ? ", " + settings.city : ""}` : undefined,
          phone: settings?.phone ?? undefined,
          email: settings?.email ?? undefined,
          taxId: settings?.taxId ?? undefined,
          logoUrl: publicAssetUrl(settings?.printLogoUrl ?? settings?.logoUrl, req.nextUrl.origin),
          brandColor: settings?.brandColor ?? undefined,
          invoiceFooter: settings?.invoiceFooter ?? undefined,
        },
        customer: {
          name: order.customer.name,
          email: order.customer.email ?? undefined,
          phone: order.customer.mobile || undefined,
          billingAddress: order.billingAddress || order.customer.streetAddress || undefined,
          shippingAddress: order.shippingAddress || undefined,
        },
        items: order.items.map((item) => ({
          name: item.variantLabel
            ? `${item.productName} / ${item.variantLabel}`
            : item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        subtotal: Number(order.subtotal),
        tax: Number(order.taxAmount) || undefined,
        discount: Number(order.discountAmount) || undefined,
        total: Number(order.totalAmount),
        paymentMethod: order.paymentMethod || undefined,
        paymentStatus: order.paymentStatus || undefined,
        paidAmount: Number(order.paidAmount) || undefined,
        balanceDue: balanceDue > 0 ? balanceDue : undefined,
        notes: order.notes || undefined,
        currencySymbol,
      };

      const blob = await generateInvoicePDF(data);

      return new NextResponse(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="invoice-${order.orderId}.pdf"`,
        },
      });
    } catch (err) {
      console.error("Invoice PDF generation error:", err);
      const message = err instanceof Error ? err.message : "Failed to generate invoice PDF";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}

function publicAssetUrl(url: string | null | undefined, origin: string) {
  if (!url) return undefined;
  if (/^(https?:|data:)/i.test(url)) return url;
  return new URL(url, origin).toString();
}

function currencyPrefix(currency: string | null | undefined) {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "EUR ";
  if (currency === "BDT" || !currency) return "Tk ";
  return `${currency} `;
}
