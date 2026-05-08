import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { ROLES, ROLE_HIERARCHY, RoleName } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import { csvResponse, generateCsv, ORDER_COLUMNS } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_ORDERS);
  if (auth instanceof NextResponse) return auth;

  if (ROLE_HIERARCHY[auth.user.role as RoleName] < ROLE_HIERARCHY[ROLES.MANAGER]) {
    return NextResponse.json({ error: "Forbidden — manager or higher required" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    include: { customer: { select: { customerId: true } } },
    orderBy: { id: "asc" },
  });

  const rows = orders.map((o) => ({
    "Customer ID*": o.customer?.customerId ?? "",
    "Date*": o.createdAt.toISOString().slice(0, 10),
    "Total Amount*": o.totalAmount.toString(),
    "Status*": o.status,
    "Payment Status*": o.paymentStatus,
    "Payment Method*": o.paymentMethod ?? "",
    "Shipping Address*": o.shippingAddress ?? "",
  }));

  const csv = generateCsv(rows, ORDER_COLUMNS);
  return csvResponse(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
