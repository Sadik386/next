import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getSettings } from "@/services/setting.service";
import { generateDeliverySlipPDF } from "@/lib/pdf/deliverySlip";
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
      const currencySymbol = settings?.currency === "USD" ? "$" : settings?.currency === "EUR" ? "€" : "৳";

      const formatDate = (date: Date) =>
        new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      const balanceDue = Number(order.totalAmount) - Number(order.paidAmount);

      const data = {
        slipNumber: `DS-${order.orderId.replace("ORD-", "")}`,
        orderId: order.orderId,
        date: formatDate(order.createdAt),
        business: {
          name: settings?.businessName || "My Business",
          address: settings?.address ? `${settings.address}${settings.city ? ", " + settings.city : ""}` : undefined,
          phone: settings?.phone ?? undefined,
        },
        customer: {
          name: order.customer.name,
          phone: order.customer.mobile || undefined,
          shippingAddress: order.shippingAddress || order.customer.streetAddress || "N/A",
        },
        courierName: undefined,
        trackingId: undefined,
        codAmount: balanceDue > 0 ? balanceDue : undefined,
        currencySymbol,
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
    } catch (err) {
      console.error("Delivery slip PDF generation error:", err);
      const message = err instanceof Error ? err.message : "Failed to generate delivery slip PDF";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}