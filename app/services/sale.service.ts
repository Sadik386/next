import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";

export interface SaleFilters {
  search?: string;
  paymentStatus?: string;
  returnStatus?: string;
  customerId?: number;
  productId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface SaleInput {
  date?: string | Date;
  customerId: number;
  productId: number;
  orderId?: number | null;
  quantity: number;
  unitPrice: number | string;
  taxAmount?: number | string;
  discountAmount?: number | string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  shippingAddress?: string | null;
  billingAddress?: string | null;
  deliveryDate?: string | Date | null;
  trackingNumber?: string | null;
  warrantyPeriod?: string | null;
  salesCommission?: number | string;
  returnStatus?: string;
  notes?: string | null;
}

const PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;
const RETURN_STATUSES = ["none", "requested", "approved", "completed"] as const;

export async function generateSaleId(): Promise<string> {
  const count = await prisma.sale.count();
  return `SL-${String(count + 1).padStart(3, "0")}`;
}

function toDecimal(
  value: number | string | Prisma.Decimal | undefined | null,
  fallback = 0
): Prisma.Decimal {
  if (value === undefined || value === null || value === "") return new Prisma.Decimal(fallback);
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value);
}

function toDate(value: string | Date | undefined | null): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return value instanceof Date ? value : new Date(value);
}

export async function getSales(filters: SaleFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.SaleWhereInput = {};
  if (filters.search) {
    where.OR = [
      { saleId: { contains: filters.search } },
      { productName: { contains: filters.search } },
      { customer: { name: { contains: filters.search } } },
      { customer: { customerId: { contains: filters.search } } },
    ];
  }
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.returnStatus) where.returnStatus = filters.returnStatus;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.productId) where.productId = filters.productId;
  if (filters.fromDate || filters.toDate) {
    where.date = {};
    if (filters.fromDate) where.date.gte = new Date(filters.fromDate);
    if (filters.toDate) where.date.lte = new Date(filters.toDate);
  }

  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, customerId: true, name: true, email: true, mobile: true } },
        product: { select: { id: true, productId: true, name: true, unit: true } },
      },
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getSaleById(id: number) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      product: true,
      order: { select: { id: true, orderId: true } },
      createdByUser: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createSale(data: SaleInput, userId: number) {
  if (!data.customerId) throw new Error("Customer is required");
  if (!data.productId) throw new Error("Product is required");

  const [customer, product] = await Promise.all([
    prisma.customer.findFirst({ where: { id: data.customerId, deletedAt: null } }),
    prisma.product.findFirst({ where: { id: data.productId, deletedAt: null } }),
  ]);
  if (!customer) throw new Error("Customer not found");
  if (!product) throw new Error("Product not found");

  const qty = Math.max(1, Math.floor(Number(data.quantity) || 1));
  const unitPrice = toDecimal(data.unitPrice ?? product.salePrice);
  const taxAmount = toDecimal(data.taxAmount ?? 0);
  const discountAmount = toDecimal(data.discountAmount ?? 0);
  const totalAmount = unitPrice.mul(qty).add(taxAmount).sub(discountAmount);

  const paymentStatus = PAYMENT_STATUSES.includes(
    (data.paymentStatus ?? "unpaid") as (typeof PAYMENT_STATUSES)[number]
  )
    ? (data.paymentStatus ?? "unpaid")
    : "unpaid";

  const returnStatus = RETURN_STATUSES.includes(
    (data.returnStatus ?? "none") as (typeof RETURN_STATUSES)[number]
  )
    ? (data.returnStatus ?? "none")
    : "none";

  const saleId = await generateSaleId();

  const sale = await prisma.sale.create({
    data: {
      saleId,
      orderId: data.orderId ?? null,
      customerId: data.customerId,
      productId: data.productId,
      productName: product.name,
      date: toDate(data.date) ?? new Date(),
      quantity: qty,
      unitPrice,
      totalAmount,
      taxAmount,
      discountAmount,
      paymentStatus,
      paymentMethod: data.paymentMethod ?? null,
      shippingAddress: data.shippingAddress ?? null,
      billingAddress: data.billingAddress ?? null,
      deliveryDate: toDate(data.deliveryDate) ?? null,
      trackingNumber: data.trackingNumber ?? null,
      warrantyPeriod: data.warrantyPeriod ?? null,
      salesCommission: toDecimal(data.salesCommission ?? 0),
      returnStatus,
      notes: data.notes ?? null,
      createdBy: userId,
    },
  });

  await createLog({
    userId,
    action: "create",
    module: "sale",
    entityId: String(sale.id),
    entityName: sale.saleId,
    description: `Created sale ${sale.saleId} for ${product.name}`,
    metadata: {
      saleId: sale.saleId,
      customerId: customer.customerId,
      productId: product.productId,
      totalAmount: totalAmount.toString(),
    },
  });

  return sale;
}

export async function updateSale(id: number, data: Partial<SaleInput>, userId: number) {
  const existing = await prisma.sale.findUnique({ where: { id } });
  if (!existing) return null;

  const update: Prisma.SaleUpdateInput = {};

  if (data.date !== undefined) update.date = toDate(data.date) ?? new Date();
  if (data.customerId !== undefined) {
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, deletedAt: null },
    });
    if (!customer) throw new Error("Customer not found");
    update.customer = { connect: { id: data.customerId } };
  }
  if (data.productId !== undefined) {
    const product = await prisma.product.findFirst({
      where: { id: data.productId, deletedAt: null },
    });
    if (!product) throw new Error("Product not found");
    update.product = { connect: { id: data.productId } };
    update.productName = product.name;
  }
  if (data.orderId !== undefined) {
    update.order = data.orderId ? { connect: { id: data.orderId } } : { disconnect: true };
  }

  const nextQuantity =
    data.quantity !== undefined ? Math.max(1, Math.floor(Number(data.quantity))) : existing.quantity;
  const nextUnitPrice = data.unitPrice !== undefined ? toDecimal(data.unitPrice) : existing.unitPrice;
  const nextTax = data.taxAmount !== undefined ? toDecimal(data.taxAmount) : existing.taxAmount;
  const nextDiscount =
    data.discountAmount !== undefined ? toDecimal(data.discountAmount) : existing.discountAmount;

  if (data.quantity !== undefined) update.quantity = nextQuantity;
  if (data.unitPrice !== undefined) update.unitPrice = nextUnitPrice;
  if (data.taxAmount !== undefined) update.taxAmount = nextTax;
  if (data.discountAmount !== undefined) update.discountAmount = nextDiscount;

  if (
    data.quantity !== undefined ||
    data.unitPrice !== undefined ||
    data.taxAmount !== undefined ||
    data.discountAmount !== undefined
  ) {
    update.totalAmount = nextUnitPrice.mul(nextQuantity).add(nextTax).sub(nextDiscount);
  }

  if (data.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(data.paymentStatus as (typeof PAYMENT_STATUSES)[number])) {
      throw new Error("Invalid payment status");
    }
    update.paymentStatus = data.paymentStatus;
  }
  if (data.returnStatus !== undefined) {
    if (!RETURN_STATUSES.includes(data.returnStatus as (typeof RETURN_STATUSES)[number])) {
      throw new Error("Invalid return status");
    }
    update.returnStatus = data.returnStatus;
  }
  if (data.paymentMethod !== undefined) update.paymentMethod = data.paymentMethod;
  if (data.shippingAddress !== undefined) update.shippingAddress = data.shippingAddress;
  if (data.billingAddress !== undefined) update.billingAddress = data.billingAddress;
  if (data.deliveryDate !== undefined) update.deliveryDate = toDate(data.deliveryDate) ?? null;
  if (data.trackingNumber !== undefined) update.trackingNumber = data.trackingNumber;
  if (data.warrantyPeriod !== undefined) update.warrantyPeriod = data.warrantyPeriod;
  if (data.salesCommission !== undefined) update.salesCommission = toDecimal(data.salesCommission);
  if (data.notes !== undefined) update.notes = data.notes;

  const sale = await prisma.sale.update({ where: { id }, data: update });

  await createLog({
    userId,
    action: "update",
    module: "sale",
    entityId: String(id),
    entityName: existing.saleId,
    description: `Updated sale ${existing.saleId}`,
    metadata: { saleId: existing.saleId, fields: Object.keys(update) },
  });

  return sale;
}

export async function requestDeleteSale(id: number, reason: string, userId: number) {
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) return null;

  const existingRequest = await prisma.deleteRequest.findFirst({
    where: { entityType: "sale", entityId: String(id), status: "pending" },
  });
  if (existingRequest) return existingRequest;

  const request = await prisma.deleteRequest.create({
    data: {
      entityType: "sale",
      entityId: String(id),
      entityName: sale.saleId,
      reason,
      requestedBy: userId,
    },
  });

  await createLog({
    userId,
    action: "delete_request",
    module: "sale",
    entityId: String(id),
    entityName: sale.saleId,
    description: `Requested deletion of sale ${sale.saleId}`,
    metadata: { saleId: sale.saleId, reason },
  });

  return request;
}
