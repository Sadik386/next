import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { notifyDeleteRequest } from "@/services/delete-request.service";
import { getCurrentBusinessId } from "@/lib/business";
import { USAGE_KEYS } from "@/lib/pricing";
import { guardProductCreation, SubscriptionGuardError } from "@/lib/subscription-guard";
import { incrementUsageSafely } from "@/lib/usage-service";

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  status?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export interface ProductInput {
  name: string;
  sku?: string | null;
  categoryId?: number | null;
  unit: string;
  salePrice: number | string;
  costPrice: number | string;
  taxRate?: number | string;
  description?: string | null;
  imageUrl?: string | null;
  status?: string;
  openingStock?: number;
  lowStockThreshold?: number;
}

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

export async function generateProductId(): Promise<string> {
  const count = await prisma.product.count({ where: { businessId: getCurrentBusinessId() } });
  const next = count + 1;
  return `PRD-${String(next).padStart(3, "0")}`;
}

export async function getProducts(filters: ProductFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = { deletedAt: null, businessId: getCurrentBusinessId() };
  if (filters.search) {
    const variants = lookupVariants(filters.search);
    if (variants.length > 0) {
      where.OR = variants.flatMap((variant) => [
        { name: { contains: variant } },
        { productId: { contains: variant } },
        { sku: { contains: variant } },
      ]);
    }
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status) where.status = filters.status;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) (where.createdAt as any).gte = filters.from;
    if (filters.to) (where.createdAt as any).lte = filters.to;
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, stock: true },
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProductById(id: number) {
  return prisma.product.findFirst({
    where: { id, deletedAt: null, businessId: getCurrentBusinessId() },
    include: { category: true },
  });
}

export async function getProductByIdOrProductId(idOrProductId: string) {
  const lookup = normalizeLookupInput(idOrProductId);
  if (!lookup) return null;

  const numId = Number(lookup);
  const isNumeric = isNumericLookup(lookup);
  const variants = lookupVariants(lookup);

  return prisma.product.findFirst({
    where: {
      deletedAt: null,
      businessId: getCurrentBusinessId(),
      OR: isNumeric
        ? [{ id: numId }, { productId: { in: variants } }]
        : [{ productId: { in: variants } }],
    },
    include: { category: true, stock: true },
  });
}

export async function findProductByFlexibleCode(code: string, businessId = getCurrentBusinessId()) {
  const lookup = normalizeLookupInput(code);
  if (!lookup) return null;

  const variants = lookupVariants(lookup);
  return prisma.product.findFirst({
    where: {
      deletedAt: null,
      businessId,
      OR: [
        { productId: { in: variants } },
        { sku: { in: variants } },
        { name: { in: variants } },
      ],
    },
    include: { category: true, stock: true },
  });
}

export async function createProduct(data: ProductInput, userId: number) {
  const businessId = getCurrentBusinessId();
  const guard = await guardProductCreation(businessId);
  if (!guard.allowed) {
    throw new SubscriptionGuardError(
      guard.reason ?? "Product limit reached for your current plan.",
      guard.code
    );
  }

  const productId = await generateProductId();
  const product = await prisma.product.create({
    data: {
      businessId,
      productId,
      name: data.name,
      sku: data.sku ?? null,
      categoryId: data.categoryId ?? null,
      unit: data.unit,
      salePrice: new Prisma.Decimal(data.salePrice),
      costPrice: new Prisma.Decimal(data.costPrice),
      taxRate: new Prisma.Decimal(data.taxRate ?? 0),
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      status: data.status ?? "active",
    },
    include: { category: true },
  });

  const openingStock = Math.max(0, Math.floor(Number(data.openingStock) || 0));
  const threshold = Math.max(0, Math.floor(Number(data.lowStockThreshold) || 10));

  await prisma.stock.create({
    data: { productId: product.id, quantity: openingStock, threshold, businessId },
  });

  if (openingStock > 0) {
    await createLog({
      userId,
      action: "create",
      module: "inventory",
      entityId: String(product.id),
      entityName: product.name,
      description: `Initial stock: ${openingStock} units`,
      metadata: { productId: product.productId, quantity: openingStock },
    });
  }

  await createLog({
    userId,
    action: "create",
    module: "product",
    entityId: String(product.id),
    entityName: product.name,
    description: `Created product: ${product.name} (${product.productId})`,
    metadata: { productId: product.productId, name: product.name },
  });

  await incrementUsageSafely(businessId, USAGE_KEYS.PRODUCTS_CREATED);

  return product;
}

export async function updateProduct(id: number, data: Partial<ProductInput>, userId: number) {
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null, businessId: getCurrentBusinessId() },
    select: { id: true },
  });
  if (!existing) return null;

  const update: Prisma.ProductUpdateInput = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.sku !== undefined) update.sku = data.sku;
  if (data.categoryId !== undefined) {
    update.category = data.categoryId
      ? { connect: { id: data.categoryId } }
      : { disconnect: true };
  }
  if (data.unit !== undefined) update.unit = data.unit;
  if (data.salePrice !== undefined) update.salePrice = new Prisma.Decimal(data.salePrice);
  if (data.costPrice !== undefined) update.costPrice = new Prisma.Decimal(data.costPrice);
  if (data.taxRate !== undefined) update.taxRate = new Prisma.Decimal(data.taxRate);
  if (data.description !== undefined) update.description = data.description;
  if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;
  if (data.status !== undefined) update.status = data.status;

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: update,
    include: { category: true },
  });

  await createLog({
    userId,
    action: "update",
    module: "product",
    entityId: String(product.id),
    entityName: product.name,
    description: `Updated product: ${product.name} (${product.productId})`,
    metadata: { productId: product.productId, fields: Object.keys(update) },
  });

  return product;
}

export async function requestDeleteProduct(id: number, reason: string, userId: number) {
  const businessId = getCurrentBusinessId();
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null, businessId } });
  if (!product) return null;

  const existing = await prisma.deleteRequest.findFirst({
    where: { businessId, entityType: "product", entityId: String(id), status: "pending" },
  });
  if (existing) return existing;

  const request = await prisma.deleteRequest.create({
    data: {
      businessId,
      entityType: "product",
      entityId: String(id),
      entityName: product.name,
      reason,
      requestedBy: userId,
    },
  });

  await createLog({
    userId,
    action: "delete_request",
    module: "product",
    entityId: String(id),
    entityName: product.name,
    description: `Requested deletion for product: ${product.name} (${product.productId})`,
    metadata: { productId: product.productId, reason },
  });

  await notifyDeleteRequest("product", product.name);

  return request;
}
