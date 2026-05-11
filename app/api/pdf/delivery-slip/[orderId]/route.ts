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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const data = {
    orderId: order.orderId,
    date: formatDate(order.createdAt),
    business: {
      name: settings?.businessName || "My Business",
    },
    customer: {
      name: order.customer.name,
      phone: order.customer.mobile || undefined,
      shippingAddress: order.shippingAddress || order.customer.streetAddress || "",
    },
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unit: "pcs",
    })),
    notes: order.notes || undefined,
  };

  const blob = await generateDeliverySlipPDF(data);

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="delivery-slip-${orderId}.pdf"`,
    },
  });
}