import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { createNotification } from "@/services/notification.service";
import { getCurrentBusinessId } from "@/lib/business";

export type StockStatus = "in_stock" | "low" | "out_of_stock";

export interface InventoryFilters {
  search?: string;
  status?: StockStatus | "all";
  page?: number;
  pageSize?: number;
}

export type AdjustmentType = "add" | "subtract" | "set";

export interface AdjustStockInput {
  type: AdjustmentType;
  quantity: number;
  reason?: string | null;
  threshold?: number;
  location?: string | null;
}

export function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low";
  return "in_stock";
}

export async function ensureStockForProduct(productId: number) {
  const businessId = getCurrentBusinessId();
  const existing = await prisma.stock.findUnique({ where: { productId, businessId } });
  if (existing) return existing;
  return prisma.stock.create({ data: { productId, quantity: 0, threshold: 10, businessId } });
}

export async function getInventory(filters: InventoryFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const productWhere: Prisma.ProductWhereInput = { deletedAt: null, businessId: getCurrentBusinessId() };
  if (filters.search) {
    productWhere.OR = [
      { name: { contains: filters.search } },
      { productId: { contains: filters.search } },
      { sku: { contains: filters.search } },
    ];
  }

  const products = await prisma.product.findMany({
    where: productWhere,
    include: { stock: true, category: true },
    orderBy: { id: "desc" },
  });

  const enriched = products.map((p) => {
    const quantity = p.stock?.quantity ?? 0;
    const threshold = p.stock?.threshold ?? 10;
    return {
      id: p.id,
      productId: p.productId,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      categoryName: p.category?.name ?? null,
      productStatus: p.status,
      stockId: p.stock?.id ?? null,
      quantity,
      threshold,
      location: p.stock?.location ?? null,
      updatedAt: p.stock?.updatedAt ?? p.updatedAt,
      stockStatus: getStockStatus(quantity, threshold),
    };
  });

  const filtered =
    filters.status && filters.status !== "all"
      ? enriched.filter((e) => e.stockStatus === filters.status)
      : enriched;

  const total = filtered.length;
  const items = filtered.slice(skip, skip + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function adjustStock(
  productId: number,
  input: AdjustStockInput,
  userId: number
) {
  const businessId = getCurrentBusinessId();
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, businessId },
  });
  if (!product) return null;

  const stock = await ensureStockForProduct(productId);
  const previousQty = stock.quantity;
  const qty = Math.max(0, Math.floor(input.quantity));

  let newQty = previousQty;
  if (input.type === "add") newQty = previousQty + qty;
  else if (input.type === "subtract") newQty = Math.max(0, previousQty - qty);
  else if (input.type === "set") newQty = qty;

  const threshold =
    input.threshold !== undefined && input.threshold !== null
      ? Math.max(0, Math.floor(input.threshold))
      : stock.threshold;
  const location = input.location !== undefined ? input.location : stock.location;

  const updated = await prisma.stock.update({
    where: { id: stock.id, businessId },
    data: {
      quantity: newQty,
      threshold,
      location: location ?? null,
    },
  });

  await prisma.stockLog.create({
    data: {
      businessId,
      stockId: stock.id,
      productId,
      type: input.type,
      quantity: qty,
      reason: input.reason ?? null,
      previousQty,
      newQty,
      createdBy: userId,
    },
  });

  const status = getStockStatus(newQty, threshold);
  const targetProductStatus =
    status === "out_of_stock" ? "inactive" : status === "in_stock" ? "active" : product.status;

  if (targetProductStatus !== product.status) {
    await prisma.product.update({
      where: { id: productId, businessId },
      data: { status: targetProductStatus },
    });
  }

  await createLog({
    userId,
    action: "adjust_stock",
    module: "inventory",
    entityId: String(stock.id),
    entityName: product.name,
    description: `Adjusted stock for ${product.name} (${input.type} ${qty}, new quantity: ${newQty})`,
    metadata: {
      productId: product.productId,
      type: input.type,
      quantity: qty,
      previousQty,
      newQty,
      reason: input.reason ?? null,
    },
  });

  const previousStatus = getStockStatus(previousQty, stock.threshold);
  if (status !== previousStatus) {
    if (status === "out_of_stock") {
      await createNotification({
        type: "out_of_stock",
        title: "Out of Stock",
        message: `Product ${product.name} is out of stock`,
        link: `/inventory`,
      });
    } else if (status === "low") {
      await createNotification({
        type: "low_stock",
        title: "Low Stock Alert",
        message: `Product ${product.name} is running low (${newQty} units)`,
        link: `/inventory`,
      });
    }
  }

  return { stock: updated, status };
}

export async function getStockLogs(stockId: number, limit = 20) {
  return prisma.stockLog.findMany({
    where: { stockId, businessId: getCurrentBusinessId() },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, productId: true, name: true, unit: true } },
    },
    orderBy: { id: "desc" },
    take: Math.min(100, Math.max(1, limit)),
  });
}

export async function getStockLogsByProductId(productId: number, limit = 20) {
  return prisma.stockLog.findMany({
    where: { productId, businessId: getCurrentBusinessId() },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, productId: true, name: true, unit: true } },
    },
    orderBy: { id: "desc" },
    take: Math.min(100, Math.max(1, limit)),
  });
}
