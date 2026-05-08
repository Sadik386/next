import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  status?: string;
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
}

export async function generateProductId(): Promise<string> {
  const count = await prisma.product.count();
  const next = count + 1;
  return `PRD-${String(next).padStart(3, "0")}`;
}

export async function getProducts(filters: ProductFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = { deletedAt: null };
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { productId: { contains: filters.search } },
      { sku: { contains: filters.search } },
    ];
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status) where.status = filters.status;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
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
    where: { id, deletedAt: null },
    include: { category: true },
  });
}

export async function createProduct(data: ProductInput, userId: number) {
  const productId = await generateProductId();
  const product = await prisma.product.create({
    data: {
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

  await prisma.stock.create({
    data: { productId: product.id, quantity: 0, threshold: 10 },
  });

  await createLog({
    userId,
    action: "create",
    module: "product",
    entityId: String(product.id),
    entityName: product.name,
    description: `Created product: ${product.name} (${product.productId})`,
    metadata: { productId: product.productId, name: product.name },
  });

  return product;
}

export async function updateProduct(id: number, data: Partial<ProductInput>, userId: number) {
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
    where: { id },
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
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!product) return null;

  const existing = await prisma.deleteRequest.findFirst({
    where: { entityType: "product", entityId: String(id), status: "pending" },
  });
  if (existing) return existing;

  const request = await prisma.deleteRequest.create({
    data: {
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

  return request;
}
