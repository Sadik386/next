import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getSettings } from "@/services/setting.service";
import { generateInvoicePDF } from "@/lib/pdf/invoice";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { orderId },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
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

  const data = {
    invoiceNumber: order.orderId,
    date: formatDate(order.createdAt),
    business: {
      name: settings?.businessName || "My Business",
      address: settings?.address || "",
      phone: settings?.phone || "",
      email: settings?.email || "",
      taxId: settings?.taxId || "",
      invoiceFooter: settings?.invoiceFooter || "",
    },
    customer: {
      name: order.customer.name,
      email: order.customer.email || "",
      phone: order.customer.mobile || "",
      billingAddress: order.billingAddress || order.customer.streetAddress || "",
    },
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    subtotal: Number(order.subtotal),
    tax: Number(order.taxAmount),
    discount: Number(order.discountAmount),
    total: Number(order.totalAmount),
    paymentMethod: order.paymentMethod || "",
    paidAmount: Number(order.paidAmount),
    balanceDue: Number(order.totalAmount) - Number(order.paidAmount),
    notes: order.notes || "",
    currencySymbol,
  };

  const blob = await generateInvoicePDF(data);

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${orderId}.pdf"`,
    },
  });
}