import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/services/email.service";
import { getSettings } from "@/services/setting.service";
import { generateReceiptPDF } from "@/lib/pdf/receipt";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";
import { mapReceiptItems } from "@/lib/pdf/documentItems";
import { buildDocumentProfile, toBusinessInfo } from "@/lib/pdf/documentProfile";
import { receiptTotals } from "@/lib/pdf/documentTotals";
import { formatDocumentDate } from "@/lib/pdf/formatters";
import { printLogoUrl } from "@/lib/pdf/assets";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ saleId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId) {
    return NextResponse.json({ error: "Business context required" }, { status: 403 });
  }

  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;
  const { saleId } = await ctx.params;

  return runWithBusinessContext(user, async () => {
    const numId = Number(saleId);
    const isNumeric = !isNaN(numId) && isFinite(numId) && Number.isInteger(numId);

    const sale = await prisma.sale.findFirst({
      where: {
        businessId: auth.businessId,
        OR: isNumeric
          ? [{ id: numId }, { saleId: saleId }]
          : [{ saleId: saleId }],
      },
      include: {
        customer: true,
        order: { include: { items: { include: { product: true } } } },
      },
    });

    if (!sale) {
      return NextResponse.json({ success: false, message: "Sale not found or access denied." }, { status: 404 });
    }

    if (!sale.customer?.email) {
      return NextResponse.json({ success: false, message: "Customer does not have an email address." }, { status: 400 });
    }

    const settings = await getSettings();
    const profile = buildDocumentProfile(settings);
    const totals = receiptTotals(sale);

    const receiptData = {
      receiptId: sale.saleId,
      date: formatDocumentDate(sale.date),
      business: toBusinessInfo(profile, { logoUrl: printLogoUrl(profile, req.nextUrl.origin) }),
      customer: sale.customer ? { name: sale.customer.name } : undefined,
      items: mapReceiptItems(sale),
      ...totals,
      currencySymbol: profile.currencySymbol,
    };

    let pdfBuffer: Buffer;
    try {
      const blob = await generateReceiptPDF(receiptData);
      pdfBuffer = Buffer.from(await blob.arrayBuffer());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate receipt PDF";
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }

    const businessName = profile.businessName || "Your Business";
    const subject = `Receipt ${sale.saleId} from ${businessName}`;
    const greeting = sale.customer ? `Dear ${sale.customer.name}` : "Dear Customer";
    const totalAmount = `${profile.currencySymbol}${Number(sale.totalAmount || totals.total).toFixed(2)}`;

    const htmlBody = `
      <p>${greeting},</p>
      <p>Thank you for your purchase! Please find attached your receipt <strong>${sale.saleId}</strong> for the amount of <strong>${totalAmount}</strong>.</p>
      <p>If you have any questions regarding this receipt, please do not hesitate to contact us.</p>
      <p>Thank you for your business.</p>
    `;

    const result = await sendEmail({
      to: sale.customer.email,
      subject,
      html: htmlBody,
      businessId: auth.businessId,
      attachments: [
        {
          filename: `receipt-${sale.saleId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  });
}