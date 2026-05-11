import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getSettings } from "@/services/setting.service";
import { generateDeliverySlipPDF } from "@/lib/pdf/deliverySlip";

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

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const data = {
    orderId: order.orderId,
    date: formatDate(order.createdAt),
    business: {
      name: settings?.businessName || "My Business",
      phone: settings?.phone ?? undefined,
    },
    customer: {
      name: order.customer.name,
      phone: order.customer.mobile || undefined,
      shippingAddress: order.shippingAddress || order.customer.streetAddress || "N/A",
    },
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unit: item.product?.unit ?? "pcs",
    })),
    notes: order.notes || undefined,
  };

  const blob = await generateDeliverySlipPDF(data);

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="delivery-${order.orderId}.pdf"`,
    },
  });
}