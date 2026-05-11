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

  const sale = await prisma.sale.findUnique({
    where: { saleId },
    include: {
      customer: true,
      order: { include: { items: { include: { product: true } } } },
    },
  });

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  const settings = await getSettings();
  const currencySymbol = settings?.currency || "BDT";

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  let items: { name: string; quantity: number; unitPrice: number; total: number }[] = [];
  if (sale.order?.items) {
    items = sale.order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.totalPrice),
    }));
  } else if (sale.productName) {
    items = [
      {
        name: sale.productName,
        quantity: sale.quantity,
        unitPrice: Number(sale.unitPrice),
        total: Number(sale.totalAmount),
      },
    ];
  }

  const data = {
    receiptId: sale.saleId,
    date: formatDate(sale.createdAt),
    business: {
      name: settings?.businessName || "My Business",
      address: settings?.address || "",
    },
    customer: sale.customer ? { name: sale.customer.name } : undefined,
    items,
    subtotal: Number(sale.totalAmount) - Number(sale.taxAmount) + Number(sale.discountAmount),
    discount: Number(sale.discountAmount),
    tax: Number(sale.taxAmount),
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
      "Content-Disposition": `attachment; filename="receipt-${saleId}.pdf"`,
    },
  });
}