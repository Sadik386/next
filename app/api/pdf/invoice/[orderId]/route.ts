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
  const id = Number(orderId);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const settings = await getSettings();
  const currencySymbol = settings?.currency === "USD" ? "$" : settings?.currency === "EUR" ? "€" : "৳";

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const balanceDue = Number(order.totalAmount) - Number(order.paidAmount);

  const data = {
    invoiceNumber: order.orderId,
    date: formatDate(order.createdAt),
    business: {
      name: settings?.businessName || "My Business",
      address: settings?.address ? `${settings.address}${settings.city ? ", " + settings.city : ""}` : undefined,
      phone: settings?.phone ?? undefined,
      email: settings?.email ?? undefined,
      taxId: settings?.taxId ?? undefined,
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
      name: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    subtotal: Number(order.subtotal),
    tax: Number(order.taxAmount) || undefined,
    discount: Number(order.discountAmount) || undefined,
    total: Number(order.totalAmount),
    paymentMethod: order.paymentMethod || undefined,
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
}