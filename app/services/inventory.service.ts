import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { createNotification } from "@/services/notification.service";
import { getCurrentBusinessId } from "@/lib/business";

export type StockStatus = "in_stock" | "low" | "out_of_stock";

export interface InventoryFilters {
  search?: string;
  status?: StockStatus | "all";
  from?: Date;
  to?: Date;
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

type InventoryRow = {
  id: number;
  inventoryKey: string;
  productId: string;
  variantId: number | null;
  variantLabel: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string;
  categoryName: string | null;
  productStatus: string;
  stockId: number | null;
  quantity: number;
  threshold: number;
  location: string | null;
  updatedAt: Date;
  stockStatus: StockStatus;
  isVariant: boolean;
};

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

function matchesSearch(values: Array<string | null | undefined>, search?: string) {
  const q = search?.trim().toLowerCase();
  if (!q) return true;
  return values.some((value) => (value ?? "").toLowerCase().includes(q));
}

function nonNegativeInt(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return Math.floor(parsed);
}

export async function getInventory(filters: InventoryFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const productWhere: Prisma.ProductWhereInput = {
    deletedAt: null,
    businessId: getCurrentBusinessId(),
  };
  if (filters.search) {
    productWhere.OR = [
      { name: { contains: filters.search } },
      { productId: { contains: filters.search } },
      { sku: { contains: filters.search } },
      { variants: { some: { deletedAt: null, label: { contains: filters.search } } } },
      { variants: { some: { deletedAt: null, sku: { contains: filters.search } } } },
      { variants: { some: { deletedAt: null, barcode: { contains: filters.search } } } },
    ];
  }

  const products = await prisma.product.findMany({
    where: productWhere,
    include: {
      stock: true,
      category: true,
      variants: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
    orderBy: { id: "desc" },
  });

  const enriched: InventoryRow[] = products.flatMap((p): InventoryRow[] => {
    if (p.variants.length > 0) {
      return p.variants
        .map((variant) => {
          const quantity = variant.stockQuantity;
          const threshold = variant.lowStockThreshold;
          return {
            id: p.id,
            inventoryKey: `${p.id}:${variant.id}`,
            productId: p.productId,
            variantId: variant.id,
            variantLabel: variant.label,
            name: p.name,
            sku: variant.sku ?? p.sku,
            barcode: variant.barcode,
            unit: p.unit,
            categoryName: p.category?.name ?? null,
            productStatus: p.status,
            stockId: p.stock?.id ?? null,
            quantity,
            threshold,
            location: variant.location ?? p.stock?.location ?? null,
            updatedAt: variant.updatedAt,
            stockStatus: getStockStatus(quantity, threshold),
            isVariant: true,
          };
        })
        .filter((row) =>
          matchesSearch(
            [row.productId, row.name, row.sku, row.barcode, row.variantLabel],
            filters.search
          )
        );
    }

    const quantity = p.stock?.quantity ?? 0;
    const threshold = p.stock?.threshold ?? 10;
    const row = {
      id: p.id,
      inventoryKey: String(p.id),
      productId: p.productId,
      variantId: null,
      variantLabel: null,
      name: p.name,
      sku: p.sku,
      barcode: null,
      unit: p.unit,
      categoryName: p.category?.name ?? null,
      productStatus: p.status,
      stockId: p.stock?.id ?? null,
      quantity,
      threshold,
      location: p.stock?.location ?? null,
      updatedAt: p.stock?.updatedAt ?? p.updatedAt,
      stockStatus: getStockStatus(quantity, threshold),
      isVariant: false,
    };
    return matchesSearch([row.productId, row.name, row.sku], filters.search) ? [row] : [];
  });

  const filtered =
    filters.status && filters.status !== "all"
      ? enriched.filter((e) => e.stockStatus === filters.status)
      : enriched;
  const dateFiltered =
    filters.from || filters.to
      ? filtered.filter((e) => {
          const updatedAt = e.updatedAt;
          if (filters.from && updatedAt < filters.from) return false;
          if (filters.to && updatedAt > filters.to) return false;
          return true;
        })
      : filtered;

  const total = dateFiltered.length;
  const items = dateFiltered.slice(skip, skip + pageSize);

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
  userId: number,
  productVariantId?: number | null
) {
  const businessId = getCurrentBusinessId();
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, businessId },
  });
  if (!product) return null;

  const qty = nonNegativeInt(input.quantity, "Quantity");

  if (productVariantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: productVariantId, productId, businessId, deletedAt: null },
    });
    if (!variant) return null;

    const previousQty = variant.stockQuantity;
    let newQty = previousQty;
    if (input.type === "add") newQty = previousQty + qty;
    else if (input.type === "subtract") newQty = Math.max(0, previousQty - qty);
    else if (input.type === "set") newQty = qty;

    const threshold =
      input.threshold !== undefined && input.threshold !== null
        ? nonNegativeInt(input.threshold, "Low stock threshold")
        : variant.lowStockThreshold;
    const location = input.location !== undefined ? input.location : variant.location;
    const stock = await ensureStockForProduct(productId);

    const updated = await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        stockQuantity: newQty,
        lowStockThreshold: threshold,
        location: location ?? null,
      },
    });

    await prisma.stockLog.create({
      data: {
        businessId,
        stockId: stock.id,
        productId,
        productVariantId: variant.id,
        type: input.type,
        quantity: qty,
        reason: input.reason ?? null,
        previousQty,
        newQty,
        createdBy: userId,
      },
    });

    await createLog({
      userId,
      action: "adjust_stock",
      module: "inventory",
      entityId: String(variant.id),
      entityName: `${product.name} / ${variant.label}`,
      description: `Adjusted stock for ${product.name} / ${variant.label} (${input.type} ${qty}, new quantity: ${newQty})`,
      metadata: {
        productId: product.productId,
        productVariantId: variant.id,
        variantLabel: variant.label,
        type: input.type,
        quantity: qty,
        previousQty,
        newQty,
        reason: input.reason ?? null,
      },
    });

    const previousStatus = getStockStatus(previousQty, variant.lowStockThreshold);
    const status = getStockStatus(newQty, threshold);
    if (status !== previousStatus) {
      const variantName = `${product.name} / ${variant.label}`;
      if (status === "out_of_stock") {
        await createNotification({
          type: "out_of_stock",
          title: "Out of Stock",
          message: `Variant ${variantName} is out of stock`,
          link: `/inventory`,
        });
      } else if (status === "low") {
        await createNotification({
          type: "low_stock",
          title: "Low Stock Alert",
          message: `Variant ${variantName} is running low (${newQty} units)`,
          link: `/inventory`,
        });
      }
    }

    return { variant: updated, status };
  }

  const stock = await ensureStockForProduct(productId);
  const previousQty = stock.quantity;

  let newQty = previousQty;
  if (input.type === "add") newQty = previousQty + qty;
  else if (input.type === "subtract") newQty = Math.max(0, previousQty - qty);
  else if (input.type === "set") newQty = qty;

  const threshold =
    input.threshold !== undefined && input.threshold !== null
      ? nonNegativeInt(input.threshold, "Low stock threshold")
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
      productVariant: { select: { id: true, label: true, sku: true } },
    },
    orderBy: { id: "desc" },
    take: Math.min(100, Math.max(1, limit)),
  });
}

export async function getStockLogsByProductId(
  productId: number,
  limit = 20,
  productVariantId?: number | null
) {
  const businessId = getCurrentBusinessId();
  const variantFilter: Prisma.StockLogWhereInput =
    productVariantId === undefined
      ? {}
      : productVariantId === null
        ? { productVariantId: null }
        : { productVariantId };

  if (productVariantId !== undefined && productVariantId !== null) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: productVariantId, productId, businessId, deletedAt: null },
      select: { id: true },
    });
    if (!variant) return [];
  }

  return prisma.stockLog.findMany({
    where: {
      productId,
      businessId,
      ...variantFilter,
    },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, productId: true, name: true, unit: true } },
      productVariant: { select: { id: true, label: true, sku: true } },
    },
    orderBy: { id: "desc" },
    take: Math.min(100, Math.max(1, limit)),
  });
}
