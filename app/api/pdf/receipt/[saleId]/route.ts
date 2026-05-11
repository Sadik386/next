import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getSettings } from "@/services/setting.service";
import { generateReceiptPDF } from "@/lib/pdf/receipt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { saleId } = await params;
  const id = Number(saleId);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid sale ID" }, { status: 400 });
  }

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      order: { include: { items: { include: { product: true } } } },
    },
  });

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
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
}