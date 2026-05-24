import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/services/email.service";
import { getSettings } from "@/services/setting.service";
import { generateInvoicePDF } from "@/lib/pdf/invoice";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";
import { mapOrderInvoiceItems } from "@/lib/pdf/documentItems";
import { buildDocumentProfile, toBusinessInfo } from "@/lib/pdf/documentProfile";
import { invoiceTotals } from "@/lib/pdf/documentTotals";
import { formatDocumentDate } from "@/lib/pdf/formatters";
import { printLogoUrl } from "@/lib/pdf/assets";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId) {
    return NextResponse.json({ error: "Business context required" }, { status: 403 });
  }

  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;
  const { orderId } = await ctx.params;

  return runWithBusinessContext(user, async () => {
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
      return NextResponse.json({ success: false, message: "Order not found or access denied." }, { status: 404 });
    }

    if (!order.customer.email) {
      return NextResponse.json({ success: false, message: "Customer does not have an email address." }, { status: 400 });
    }

    const settings = await getSettings();
    const profile = buildDocumentProfile(settings);
    const totals = invoiceTotals(order);

    const invoiceData = {
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

    let pdfBuffer: Buffer;
    try {
      const blob = await generateInvoicePDF(invoiceData);
      pdfBuffer = Buffer.from(await blob.arrayBuffer());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate invoice PDF";
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }

    const businessName = profile.businessName || "Your Business";
    const subject = `Invoice ${order.orderId} from ${businessName}`;
    const greeting = `Dear ${order.customer.name}`;
    const totalAmount = `${profile.currencySymbol}${Number(order.totalAmount).toFixed(2)}`;

    const htmlBody = `
      <p>${greeting},</p>
      <p>Please find attached your invoice <strong>${order.orderId}</strong> for the amount of <strong>${totalAmount}</strong>.</p>
      <p>If you have any questions regarding this invoice, please do not hesitate to contact us.</p>
      <p>Thank you for your business.</p>
    `;

    const result = await sendEmail({
      to: order.customer.email,
      subject,
      html: htmlBody,
      businessId: auth.businessId,
      attachments: [
        {
          filename: `invoice-${order.orderId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  });
}