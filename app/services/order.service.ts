import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { createNotification } from "@/services/notification.service";
import { notifyDeleteRequest } from "@/services/delete-request.service";
import { applyStockDelta } from "@/lib/stockHelper";
import { getCurrentBusinessId } from "@/lib/business";

export interface OrderFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  customerId?: number;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export interface OrderItemInput {
  productId: number;
  quantity: number;
  unitPrice?: number | string;
}

export interface OrderInput {
  customerId: number;
  items: OrderItemInput[];
  paymentMethod?: string | null;
  shippingAddress?: string | null;
  billingAddress?: string | null;
  notes?: string | null;
  taxRate?: number | string;
  discountAmount?: number | string;
  paidAmount?: number | string;
  paymentStatus?: string;
}

const ORDER_STATUSES = ["pending", "confirmed", "delivered", "cancelled"] as const;
const PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;

function normalizeLookupInput(value: string): string {
  return value.trim();
}

function lookupVariants(value: string): string[] {
  const trimmed = normalizeLookupInput(value);
  if (!trimmed) return [];
  return Array.from(new Set([trimmed, trimmed.toUpperCase(), trimmed.toLowerCase()]));
}

function isNumericLookup(value: string): boolean {
  const numId = Number(value);
  return Number.isInteger(numId) && numId > 0;
}

export async function generateOrderId(businessId = getCurrentBusinessId()): Promise<string> {
  const count = await prisma.order.count({ where: { businessId } });
  const next = count + 1;
  return `ORD-${String(next).padStart(3, "0")}`;
}

export async function getOrders(filters: OrderFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const businessId = getCurrentBusinessId();
  const where: Prisma.OrderWhereInput = { deletedAt: null, businessId };
  if (filters.search) {
    const variants = lookupVariants(filters.search);
    if (variants.length > 0) {
      where.OR = variants.flatMap((variant) => [
        { orderId: { contains: variant } },
        { customer: { is: { businessId, name: { contains: variant } } } },
        { customer: { is: { businessId, customerId: { contains: variant } } } },
      ]);
    }
  }
  if (filters.status) where.status = filters.status;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) (where.createdAt as any).gte = filters.from;
    if (filters.to) (where.createdAt as any).lte = filters.to;
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, customerId: true, name: true, email: true, mobile: true } },
        _count: { select: { items: true } },
      },
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getOrderById(id: number) {
  return prisma.order.findFirst({
    where: { id, deletedAt: null, businessId: getCurrentBusinessId() },
    include: {
      customer: true,
      createdByUser: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, productId: true, name: true, unit: true, imageUrl: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });
}

export async function getOrderByIdOrOrderId(idOrOrderId: string) {
  const lookup = normalizeLookupInput(idOrOrderId);
  if (!lookup) return null;

  const numId = Number(lookup);
  const isNumeric = isNumericLookup(lookup);
  const variants = lookupVariants(lookup);

  return prisma.order.findFirst({
    where: {
      deletedAt: null,
      businessId: getCurrentBusinessId(),
      OR: isNumeric
        ? [{ id: numId }, { orderId: { in: variants } }]
        : [{ orderId: { in: variants } }],
    },
    include: {
      customer: true,
      createdByUser: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, productId: true, name: true, unit: true, imageUrl: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });
}

function toDecimal(
  value: number | string | Prisma.Decimal | undefined | null,
  fallback = 0
): Prisma.Decimal {
  if (value === undefined || value === null || value === "") return new Prisma.Decimal(fallback);
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value);
}

function computePaymentStatus(total: Prisma.Decimal, paid: Prisma.Decimal): string {
  if (paid.lte(0)) return "unpaid";
  if (paid.gte(total)) return "paid";
  return "partial";
}

export async function createOrder(data: OrderInput, userId: number) {
  if (!data.items || data.items.length === 0) {
    throw new Error("At least one item is required");
  }

  const businessId = getCurrentBusinessId();
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, businessId, deletedAt: null },
  });
  if (!customer) throw new Error("Customer not found");

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId, deletedAt: null },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const itemRows = data.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("Product not found");
    const qty = Math.max(1, Math.floor(item.quantity));
    const unitPrice = toDecimal(item.unitPrice ?? product.salePrice);
    const totalPrice = unitPrice.mul(qty);
    return {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice,
      totalPrice,
    };
  });

  const subtotal = itemRows.reduce(
    (acc, row) => acc.add(row.totalPrice),
    new Prisma.Decimal(0)
  );
  const taxRate = toDecimal(data.taxRate ?? 0);
  const taxAmount = subtotal.mul(taxRate).div(100);
  const discountAmount = toDecimal(data.discountAmount ?? 0);
  const totalAmount = subtotal.add(taxAmount).sub(discountAmount);
  const paidAmount = toDecimal(data.paidAmount ?? 0);
  const paymentStatus = data.paymentStatus ?? computePaymentStatus(totalAmount, paidAmount);

  const orderId = await generateOrderId(businessId);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderId,
        businessId,
        customerId: customer.id,
        status: "pending",
        paymentStatus,
        paymentMethod: data.paymentMethod ?? null,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paidAmount,
        shippingAddress: data.shippingAddress ?? customer.shippingAddress ?? customer.streetAddress ?? null,
        billingAddress: data.billingAddress ?? customer.billingAddress ?? customer.streetAddress ?? null,
        notes: data.notes ?? null,
        createdBy: userId,
        items: {
          create: itemRows.map((r) => ({
            businessId,
            productId: r.productId,
            productName: r.productName,
            quantity: r.quantity,
            unitPrice: r.unitPrice,
            totalPrice: r.totalPrice,
          })),
        },
      },
      include: { items: true },
    });

    for (const row of itemRows) {
      await applyStockDelta(tx, businessId, row.productId, -row.quantity, `Order ${orderId}`, userId);
    }

    return created;
  });

  await createLog({
    userId,
    action: "create",
    module: "order",
    entityId: String(order.id),
    entityName: order.orderId,
    description: `Created order: ${order.orderId}`,
    metadata: {
      orderId: order.orderId,
      customerId: customer.customerId,
      totalAmount: totalAmount.toString(),
      itemCount: itemRows.length,
    },
  });

  await createNotification({
    type: "new_order",
    title: "New Order Received",
    message: `New order ${order.orderId} received`,
    link: `/orders/${order.id}`,
  });

  return order;
}

export async function updateOrderStatus(id: number, status: string, userId: number) {
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    throw new Error("Invalid status");
  }
  const order = await prisma.order.findFirst({ where: { id, deletedAt: null, businessId: getCurrentBusinessId() } });
  if (!order) return null;

  const updated = await prisma.order.update({
    where: { id, businessId: getCurrentBusinessId() },
    data: { status },
  });

  await createLog({
    userId,
    action: status === "cancelled" ? "cancel" : "update_status",
    module: "order",
    entityId: String(id),
    entityName: order.orderId,
    description: status === "cancelled" ? `Cancelled order: ${order.orderId}` : `Updated status of order ${order.orderId} to ${status}`,
    metadata: { orderId: order.orderId, from: order.status, to: status },
  });

  if (status === "cancelled" && order.status !== "cancelled") {
    await createNotification({
      type: "order_cancelled",
      title: "Order Cancelled",
      message: `Order ${order.orderId} was cancelled`,
      link: `/orders/${id}`,
    });
  }

  return updated;
}

export async function updatePaymentStatus(
  id: number,
  paymentStatus: string,
  paidAmount: number | string | undefined,
  userId: number
) {
  if (!PAYMENT_STATUSES.includes(paymentStatus as (typeof PAYMENT_STATUSES)[number])) {
    throw new Error("Invalid payment status");
  }
  const order = await prisma.order.findFirst({ where: { id, deletedAt: null, businessId: getCurrentBusinessId() } });
  if (!order) return null;

  let nextPaid: Prisma.Decimal;
  if (paymentStatus === "paid") {
    nextPaid = order.totalAmount;
  } else if (paymentStatus === "unpaid") {
    nextPaid = new Prisma.Decimal(0);
  } else {
    nextPaid = toDecimal(paidAmount ?? order.paidAmount);
    if (nextPaid.gt(order.totalAmount)) nextPaid = order.totalAmount;
    if (nextPaid.lt(0)) nextPaid = new Prisma.Decimal(0);
  }

  const updated = await prisma.order.update({
    where: { id, businessId: getCurrentBusinessId() },
    data: { paymentStatus, paidAmount: nextPaid },
  });

  await createLog({
    userId,
    action: "update_payment",
    module: "order",
    entityId: String(id),
    entityName: order.orderId,
    description: `Updated payment status of order ${order.orderId} to ${paymentStatus}`,
    metadata: {
      orderId: order.orderId,
      from: order.paymentStatus,
      to: paymentStatus,
      paidAmount: nextPaid.toString(),
    },
  });

  return updated;
}

export async function requestDeleteOrder(id: number, reason: string, userId: number) {
  const businessId = getCurrentBusinessId();
  const order = await prisma.order.findFirst({ where: { id, deletedAt: null, businessId } });
  if (!order) return null;

  const existing = await prisma.deleteRequest.findFirst({
    where: { businessId, entityType: "order", entityId: String(id), status: "pending" },
  });
  if (existing) return existing;

  const request = await prisma.deleteRequest.create({
    data: {
      businessId,
      entityType: "order",
      entityId: String(id),
      entityName: order.orderId,
      reason,
      requestedBy: userId,
    },
  });

  await createLog({
    userId,
    action: "delete_request",
    module: "order",
    entityId: String(id),
    entityName: order.orderId,
    description: `Requested deletion for order: ${order.orderId}`,
    metadata: { orderId: order.orderId, reason },
  });

  await notifyDeleteRequest("order", order.orderId);

  return request;
}
