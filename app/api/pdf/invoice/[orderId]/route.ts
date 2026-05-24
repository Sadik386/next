import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getSettings } from "@/services/setting.service";
import { generateInvoicePDF } from "@/lib/pdf/invoice";
import { runWithBusinessContext } from "@/lib/business-context";
import { printLogoUrl } from "@/lib/pdf/assets";
import { mapOrderInvoiceItems } from "@/lib/pdf/documentItems";
import { buildDocumentProfile, toBusinessInfo } from "@/lib/pdf/documentProfile";
import { invoiceTotals } from "@/lib/pdf/documentTotals";
import { formatDocumentDate } from "@/lib/pdf/formatters";
import { guardPdfPrintUsage, incrementUsageSafely } from "@/lib/subscription-guard";
import { USAGE_KEYS } from "@/lib/pricing";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const start = Date.now();

    const guard = await guardPdfPrintUsage(auth.businessId);
    if (!guard.allowed) {
      return NextResponse.json({ error: guard.reason || "PDF/Print limit reached for your current plan." }, { status: 403 });
    }

    try {
      const { orderId } = await params;
      const numId = Number(orderId);
      const isNumeric = !isNaN(numId) && isFinite(numId);

      console.time(`[PDF] DB Query ${orderId}`);
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
      console.timeEnd(`[PDF] DB Query ${orderId}`);

      if (!order) {
        return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
      }

      console.time(`[PDF] Settings/Profile ${orderId}`);
      const settings = await getSettings();
      const profile = buildDocumentProfile(settings);
      const totals = invoiceTotals(order);
      console.timeEnd(`[PDF] Settings/Profile ${orderId}`);

      const data = {
        invoiceNumber: order.orderId,
        orderId: order.orderId,
        date: formatDocumentDate(order.createdAt),
        business: toBusinessInfo(profile, { logoUrl: printLogoUrl(profile, req.nextUrl.origin) }),
        customer: {
          name: order.customer.name,
          email: order.customer.email ?? undefined,
          phone: order.customer.mobile || undefined,
          billingAddress: order.billingAddress || order.customer.streetAddress || undefined,
          shippingAddress: order.shippingAddress || undefined,
        },
        items: mapOrderInvoiceItems(order.items),
        ...totals,
        notes: order.notes || undefined,
        currencySymbol: profile.currencySymbol,
      };

      console.log(`[PDF] Business Logo URL: ${data.business.logoUrl}`);
      
      console.time(`[PDF] Generate PDF ${orderId}`);
      const blob = await generateInvoicePDF(data);
      console.timeEnd(`[PDF] Generate PDF ${orderId}`);

      console.log(`[PDF] Total Route Time: ${Date.now() - start}ms`);

      incrementUsageSafely(auth.businessId, USAGE_KEYS.PDF_PRINT_COUNT);

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
