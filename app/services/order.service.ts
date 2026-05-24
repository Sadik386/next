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
  productVariantId?: number | null;
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
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const PAYMENT_METHOD_REQUIRED_MESSAGE =
  "Payment method is required for paid or partial payments.";

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
          productVariant: { select: { id: true, label: true, sku: true } },
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
          productVariant: { select: { id: true, label: true, sku: true } },
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

function normalizePositiveId(value: unknown, message: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error(message);
  return id;
}

function normalizeOptionalPositiveId(value: unknown, message: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  return normalizePositiveId(value, message);
}

function normalizeQuantity(value: unknown): number {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be at least 1");
  }
  const wholeQuantity = Math.floor(quantity);
  if (wholeQuantity < 1) throw new Error("Quantity must be at least 1");
  return wholeQuantity;
}

function normalizePaymentStatus(
  status: string | undefined | null,
  total: Prisma.Decimal,
  paid: Prisma.Decimal
): PaymentStatus {
  if (status === undefined || status === null || status === "") {
    return computePaymentStatus(total, paid) as PaymentStatus;
  }
  if (!PAYMENT_STATUSES.includes(status as PaymentStatus)) {
    throw new Error("Invalid payment status");
  }
  return status as PaymentStatus;
}

function normalizePaymentMethod(
  paymentStatus: PaymentStatus,
  paymentMethod: unknown
): string | null {
  if (paymentStatus === "unpaid") return null;

  const normalizedPaymentMethod =
    typeof paymentMethod === "string" ? paymentMethod.trim() : "";
  if (!normalizedPaymentMethod) {
    throw new Error(PAYMENT_METHOD_REQUIRED_MESSAGE);
  }
  return normalizedPaymentMethod;
}

function normalizePaymentDetails(
  data: OrderInput,
  totalAmount: Prisma.Decimal
): {
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  paidAmount: Prisma.Decimal;
} {
  const requestedPaidAmount = toDecimal(data.paidAmount ?? 0);
  const paymentStatus = normalizePaymentStatus(
    data.paymentStatus,
    totalAmount,
    requestedPaidAmount
  );
  const paymentMethod = normalizePaymentMethod(paymentStatus, data.paymentMethod);

  if (paymentStatus === "unpaid") {
    return {
      paymentStatus,
      paymentMethod: null,
      paidAmount: new Prisma.Decimal(0),
    };
  }

  if (paymentStatus === "paid") {
    if (totalAmount.lte(0)) throw new Error("Paid orders require a positive total amount.");
    return {
      paymentStatus,
      paymentMethod,
      paidAmount: totalAmount,
    };
  }

  if (requestedPaidAmount.lte(0) || requestedPaidAmount.gte(totalAmount)) {
    throw new Error("Partial payment amount must be greater than 0 and less than the order total.");
  }

  return {
    paymentStatus,
    paymentMethod,
    paidAmount: requestedPaidAmount,
  };
}

export async function createOrder(data: OrderInput, userId: number) {
  if (!data.items || data.items.length === 0) {
    throw new Error("At least one item is required");
  }

  const businessId = getCurrentBusinessId();
  const customerId = normalizePositiveId(data.customerId, "Customer is required");
  const normalizedItems = data.items.map((item) => ({
    productId: normalizePositiveId(item.productId, "Product is required"),
    productVariantId: normalizeOptionalPositiveId(
      item.productVariantId,
      "Invalid product variant"
    ),
    quantity: normalizeQuantity(item.quantity),
    unitPrice: item.unitPrice,
  }));

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId, deletedAt: null },
  });
  if (!customer) throw new Error("Customer not found");

  const productIds = Array.from(new Set(normalizedItems.map((i) => i.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId, deletedAt: null },
    include: { variants: { where: { deletedAt: null } } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  const variantMap = new Map(
    products.flatMap((p) => p.variants.map((variant) => [variant.id, variant] as const))
  );

  const itemRows = normalizedItems.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("Product not found");
    const variantId = item.productVariantId;
    const variant = variantId ? variantMap.get(variantId) : null;
    if (variantId && !variant) throw new Error("Product variant not found");
    if (variant && variant.productId !== product.id) throw new Error("Product variant mismatch");
    if (product.variants.length > 0 && !variant) {
      throw new Error(`Select a variant for ${product.name}`);
    }
    if (variant && variant.status !== "active") {
      throw new Error(`Product variant is inactive: ${product.name} / ${variant.label}`);
    }
    const qty = item.quantity;
    const unitPriceSource =
      item.unitPrice === undefined || item.unitPrice === null || item.unitPrice === ""
        ? variant?.salePriceOverride ?? product.salePrice
        : item.unitPrice;
    const unitPrice = toDecimal(unitPriceSource);
    if (unitPrice.lt(0)) throw new Error("Unit price is required for all items");
    const totalPrice = unitPrice.mul(qty);
    return {
      productId: product.id,
      productVariantId: variant?.id ?? null,
      productName: product.name,
      variantLabel: variant?.label ?? null,
      skuSnapshot: variant?.sku ?? product.sku,
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
  const { paymentStatus, paymentMethod, paidAmount } = normalizePaymentDetails(
    data,
    totalAmount
  );

  const orderId = await generateOrderId(businessId);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderId,
        businessId,
        customerId: customer.id,
        status: "pending",
        paymentStatus,
        paymentMethod,
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
            productVariantId: r.productVariantId,
            productName: r.productName,
            variantLabel: r.variantLabel,
            skuSnapshot: r.skuSnapshot,
            quantity: r.quantity,
            unitPrice: r.unitPrice,
            totalPrice: r.totalPrice,
          })),
        },
      },
      include: { items: true },
    });

    for (const row of itemRows) {
      await applyStockDelta(
        tx,
        businessId,
        row.productId,
        -row.quantity,
        `Order ${orderId}`,
        userId,
        row.productVariantId
      );
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

  const previousStatus = order.status;
  const isCancelling = status === "cancelled" && previousStatus !== "cancelled";

  if (isCancelling) {
    await prisma.$transaction(async (tx) => {
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: id },
        select: { productId: true, productVariantId: true, quantity: true },
      });

      for (const item of orderItems) {
        await applyStockDelta(
          tx,
          order.businessId,
          item.productId,
          item.quantity,
          `Cancel order ${order.orderId}`,
          userId,
          item.productVariantId
        );
      }
    });
  }

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
    metadata: { orderId: order.orderId, from: previousStatus, to: status },
  });

  if (status === "cancelled" && previousStatus !== "cancelled") {
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
