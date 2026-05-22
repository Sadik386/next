import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { notifyDeleteRequest } from "@/services/delete-request.service";
import { getCurrentBusinessId } from "@/lib/business";
import { USAGE_KEYS } from "@/lib/pricing";
import { guardProductCreation, SubscriptionGuardError } from "@/lib/subscription-guard";
import { incrementUsageSafely } from "@/lib/usage-service";

export class ProductValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ProductValidationError";
  }
}

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  status?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export interface ProductVariantInput {
  id?: number;
  label: string;
  sku?: string | null;
  barcode?: string | null;
  stockQuantity?: number | string;
  lowStockThreshold?: number | string;
  location?: string | null;
  salePriceOverride?: number | string | null;
  costPriceOverride?: number | string | null;
  status?: string;
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
  variants?: ProductVariantInput[];
}

type NormalizedVariantInput = {
  id?: number;
  label: string;
  optionSignature: string;
  sku: string | null;
  barcode: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  location: string | null;
  salePriceOverride: Prisma.Decimal | null;
  costPriceOverride: Prisma.Decimal | null;
  status: string;
};

const productInclude = {
  category: true,
  stock: true,
  variants: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
  },
};

const VALID_VARIANT_STATUSES = ["active", "inactive"] as const;

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

function cleanOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeVariantSignature(label: string): string {
  return label
    .split("/")
    .map((part) => part.trim().replace(/\s+/g, " ").toLowerCase())
    .filter(Boolean)
    .join(" / ");
}

function nonNegativeInt(value: unknown, fallback: number, field: string): number {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ProductValidationError(`${field} must be a non-negative number`);
  }
  return Math.floor(parsed);
}

function optionalDecimal(value: unknown, field: string): Prisma.Decimal | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ProductValidationError(`${field} must be a non-negative number`);
  }
  return new Prisma.Decimal(parsed);
}

function normalizeProductSku(value: unknown): string | null {
  return cleanOptionalString(value);
}

function normalizeVariants(
  variants: ProductVariantInput[] | undefined
): NormalizedVariantInput[] | undefined {
  if (variants === undefined) return undefined;
  if (!Array.isArray(variants)) {
    throw new ProductValidationError("Variants must be an array");
  }

  const seenSignatures = new Map<string, string>();
  const seenSkus = new Map<string, string>();
  const seenBarcodes = new Map<string, string>();

  return variants.map((variant) => {
    const label = cleanOptionalString(variant.label);
    if (!label) throw new ProductValidationError("Variant label is required");

    const optionSignature = normalizeVariantSignature(label);
    if (!optionSignature) throw new ProductValidationError("Variant label is required");
    if (seenSignatures.has(optionSignature)) {
      throw new ProductValidationError(`Duplicate variant combination: ${label}`);
    }
    seenSignatures.set(optionSignature, label);

    const sku = cleanOptionalString(variant.sku);
    const skuKey = sku?.toLowerCase() ?? null;
    if (skuKey) {
      if (seenSkus.has(skuKey)) {
        throw new ProductValidationError(`Duplicate variant SKU: ${sku}`);
      }
      seenSkus.set(skuKey, label);
    }

    const barcode = cleanOptionalString(variant.barcode);
    const barcodeKey = barcode?.toLowerCase() ?? null;
    if (barcodeKey) {
      if (seenBarcodes.has(barcodeKey)) {
        throw new ProductValidationError(`Duplicate variant barcode: ${barcode}`);
      }
      seenBarcodes.set(barcodeKey, label);
    }

    const status = VALID_VARIANT_STATUSES.includes(
      variant.status as (typeof VALID_VARIANT_STATUSES)[number]
    )
      ? variant.status!
      : "active";

    return {
      id:
        variant.id !== undefined && Number.isInteger(Number(variant.id))
          ? Number(variant.id)
          : undefined,
      label,
      optionSignature,
      sku,
      barcode,
      stockQuantity: nonNegativeInt(variant.stockQuantity, 0, "Variant stock quantity"),
      lowStockThreshold: nonNegativeInt(
        variant.lowStockThreshold,
        10,
        "Variant low stock threshold"
      ),
      location: cleanOptionalString(variant.location),
      salePriceOverride: optionalDecimal(variant.salePriceOverride, "Variant sale price override"),
      costPriceOverride: optionalDecimal(variant.costPriceOverride, "Variant cost price override"),
      status,
    };
  });
}

function assertNoDuplicateSkuWithVariants(
  baseSku: string | null,
  variants: NormalizedVariantInput[] | undefined
) {
  if (!baseSku || !variants) return;
  const baseKey = baseSku.toLowerCase();
  const duplicate = variants.find((variant) => variant.sku?.toLowerCase() === baseKey);
  if (duplicate) {
    throw new ProductValidationError(
      `Product SKU cannot match variant SKU: ${duplicate.sku}`
    );
  }
}

async function validateSkuAndBarcodeCollisions({
  businessId,
  productId,
  baseSku,
  variants,
}: {
  businessId: number;
  productId?: number;
  baseSku: string | null;
  variants: NormalizedVariantInput[] | undefined;
}) {
  assertNoDuplicateSkuWithVariants(baseSku, variants);

  const skuValues = [
    ...(baseSku ? [baseSku] : []),
    ...(variants ?? []).map((variant) => variant.sku).filter(Boolean) as string[],
  ];
  const barcodeValues = (variants ?? [])
    .map((variant) => variant.barcode)
    .filter(Boolean) as string[];

  if (skuValues.length > 0) {
    const productSkuConflict = await prisma.product.findFirst({
      where: {
        businessId,
        deletedAt: null,
        sku: { in: skuValues },
        ...(productId ? { id: { not: productId } } : {}),
      },
      select: { name: true, sku: true },
    });
    if (productSkuConflict) {
      throw new ProductValidationError(
        `SKU ${productSkuConflict.sku} is already used by product ${productSkuConflict.name}`
      );
    }

    const variantWhere: Prisma.ProductVariantWhereInput = {
      businessId,
      deletedAt: null,
      sku: { in: skuValues },
    };
    if (productId && variants !== undefined) {
      variantWhere.productId = { not: productId };
    }
    const variantSkuConflict = await prisma.productVariant.findFirst({
      where: variantWhere,
      include: { product: { select: { name: true } } },
    });
    if (variantSkuConflict) {
      throw new ProductValidationError(
        `SKU ${variantSkuConflict.sku} is already used by variant ${variantSkuConflict.product.name} / ${variantSkuConflict.label}`
      );
    }
  }

  if (barcodeValues.length > 0) {
    const barcodeWhere: Prisma.ProductVariantWhereInput = {
      businessId,
      deletedAt: null,
      barcode: { in: barcodeValues },
    };
    if (productId && variants !== undefined) {
      barcodeWhere.productId = { not: productId };
    }
    const variantBarcodeConflict = await prisma.productVariant.findFirst({
      where: barcodeWhere,
      include: { product: { select: { name: true } } },
    });
    if (variantBarcodeConflict) {
      throw new ProductValidationError(
        `Barcode ${variantBarcodeConflict.barcode} is already used by variant ${variantBarcodeConflict.product.name} / ${variantBarcodeConflict.label}`
      );
    }
  }
}

async function ensureStockRecord(
  tx: Prisma.TransactionClient,
  businessId: number,
  productId: number
) {
  const existing = await tx.stock.findFirst({ where: { businessId, productId } });
  if (existing) return existing;
  return tx.stock.create({ data: { businessId, productId, quantity: 0, threshold: 10 } });
}

async function writeVariantStockLog(
  tx: Prisma.TransactionClient,
  businessId: number,
  productId: number,
  productVariantId: number,
  stockId: number,
  previousQty: number,
  newQty: number,
  reason: string,
  userId: number
) {
  if (previousQty === newQty) return;
  await tx.stockLog.create({
    data: {
      businessId,
      stockId,
      productId,
      productVariantId,
      type: "set",
      quantity: newQty,
      reason,
      previousQty,
      newQty,
      createdBy: userId,
    },
  });
}

async function syncProductVariants(
  tx: Prisma.TransactionClient,
  businessId: number,
  productId: number,
  variants: NormalizedVariantInput[],
  userId: number,
  reason: string
) {
  const existing = await tx.productVariant.findMany({
    where: { businessId, productId, deletedAt: null },
  });
  const existingById = new Map(existing.map((variant) => [variant.id, variant]));
  const requestedIds = new Set(variants.map((variant) => variant.id).filter(Boolean) as number[]);

  for (const variant of variants) {
    if (variant.id && !existingById.has(variant.id)) {
      throw new ProductValidationError("Variant not found for this product");
    }
  }

  for (const variant of existing) {
    if (requestedIds.has(variant.id)) continue;
    await tx.productVariant.update({
      where: { id: variant.id },
      data: {
        deletedAt: new Date(),
        status: "inactive",
        sku: null,
        barcode: null,
        optionSignature: `deleted:${variant.id}`,
      },
    });
  }

  for (const variant of existing) {
    if (!requestedIds.has(variant.id)) continue;
    await tx.productVariant.update({
      where: { id: variant.id },
      data: {
        optionSignature: `pending:${variant.id}`,
        sku: null,
        barcode: null,
      },
    });
  }

  const stock = await ensureStockRecord(tx, businessId, productId);

  for (const [index, variant] of variants.entries()) {
    if (variant.id) {
      const current = existingById.get(variant.id)!;
      const updated = await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          label: variant.label,
          optionSignature: variant.optionSignature,
          sku: variant.sku,
          barcode: variant.barcode,
          stockQuantity: variant.stockQuantity,
          lowStockThreshold: variant.lowStockThreshold,
          location: variant.location,
          salePriceOverride: variant.salePriceOverride,
          costPriceOverride: variant.costPriceOverride,
          status: variant.status,
          sortOrder: index,
        },
      });
      await writeVariantStockLog(
        tx,
        businessId,
        productId,
        updated.id,
        stock.id,
        current.stockQuantity,
        updated.stockQuantity,
        reason,
        userId
      );
      continue;
    }

    const created = await tx.productVariant.create({
      data: {
        businessId,
        productId,
        label: variant.label,
        optionSignature: variant.optionSignature,
        sku: variant.sku,
        barcode: variant.barcode,
        stockQuantity: variant.stockQuantity,
        lowStockThreshold: variant.lowStockThreshold,
        location: variant.location,
        salePriceOverride: variant.salePriceOverride,
        costPriceOverride: variant.costPriceOverride,
        status: variant.status,
        sortOrder: index,
      },
    });
    await writeVariantStockLog(
      tx,
      businessId,
      productId,
      created.id,
      stock.id,
      0,
      created.stockQuantity,
      reason,
      userId
    );
  }
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
        { variants: { some: { deletedAt: null, label: { contains: variant } } } },
        { variants: { some: { deletedAt: null, sku: { contains: variant } } } },
        { variants: { some: { deletedAt: null, barcode: { contains: variant } } } },
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
      include: productInclude,
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
    include: productInclude,
  });
}

export async function getProductByIdOrProductId(idOrProductId: string) {
  const lookup = normalizeLookupInput(idOrProductId);
  if (!lookup) return null;

  const numId = Number(lookup);
  const isNumeric = isNumericLookup(lookup);
  const variants = lookupVariants(lookup);

  const product = await prisma.product.findFirst({
    where: {
      deletedAt: null,
      businessId: getCurrentBusinessId(),
      OR: isNumeric
        ? [{ id: numId }, { productId: { in: variants } }]
        : [{ productId: { in: variants } }],
    },
    include: productInclude,
  });
  if (product) return product;

  const matchedVariant = await prisma.productVariant.findFirst({
    where: {
      deletedAt: null,
      businessId: getCurrentBusinessId(),
      OR: [{ sku: { in: variants } }, { barcode: { in: variants } }],
      product: { deletedAt: null, businessId: getCurrentBusinessId() },
    },
    include: { product: { include: productInclude } },
  });

  return matchedVariant
    ? { ...matchedVariant.product, matchedVariant }
    : null;
}

export async function findProductByFlexibleCode(code: string, businessId = getCurrentBusinessId()) {
  const lookup = normalizeLookupInput(code);
  if (!lookup) return null;

  const variants = lookupVariants(lookup);
  const product = await prisma.product.findFirst({
    where: {
      deletedAt: null,
      businessId,
      OR: [
        { productId: { in: variants } },
        { sku: { in: variants } },
        { name: { in: variants } },
      ],
    },
    include: productInclude,
  });
  if (product) return { ...product, matchedVariant: null };

  const matchedVariant = await prisma.productVariant.findFirst({
    where: {
      businessId,
      deletedAt: null,
      product: { deletedAt: null, businessId },
      OR: [
        { sku: { in: variants } },
        { barcode: { in: variants } },
        { label: { in: variants } },
      ],
    },
    include: { product: { include: productInclude } },
  });

  return matchedVariant
    ? { ...matchedVariant.product, matchedVariant }
    : null;
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

  const normalizedVariants = normalizeVariants(data.variants) ?? [];
  const normalizedSku = normalizeProductSku(data.sku);
  await validateSkuAndBarcodeCollisions({
    businessId,
    baseSku: normalizedSku,
    variants: normalizedVariants,
  });

  const productId = await generateProductId();
  const openingStock =
    normalizedVariants.length > 0 ? 0 : Math.max(0, Math.floor(Number(data.openingStock) || 0));
  const threshold = Math.max(0, Math.floor(Number(data.lowStockThreshold) || 10));

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        businessId,
        productId,
        name: data.name,
        sku: normalizedSku,
        categoryId: data.categoryId ?? null,
        unit: data.unit,
        salePrice: new Prisma.Decimal(data.salePrice),
        costPrice: new Prisma.Decimal(data.costPrice),
        taxRate: new Prisma.Decimal(data.taxRate ?? 0),
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        status: data.status ?? "active",
      },
    });

    await tx.stock.create({
      data: { productId: created.id, quantity: openingStock, threshold, businessId },
    });

    if (normalizedVariants.length > 0) {
      await syncProductVariants(
        tx,
        businessId,
        created.id,
        normalizedVariants,
        userId,
        "Product variant setup"
      );
    }

    return tx.product.findUniqueOrThrow({
      where: { id: created.id },
      include: productInclude,
    });
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
    metadata: {
      productId: product.productId,
      name: product.name,
      variantCount: product.variants.length,
    },
  });

  await incrementUsageSafely(businessId, USAGE_KEYS.PRODUCTS_CREATED);

  return product;
}

export async function updateProduct(id: number, data: Partial<ProductInput>, userId: number) {
  const businessId = getCurrentBusinessId();
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null, businessId },
    include: productInclude,
  });
  if (!existing) return null;

  const normalizedVariants = normalizeVariants(data.variants);
  const normalizedSku =
    data.sku !== undefined ? normalizeProductSku(data.sku) : existing.sku;

  if (data.sku !== undefined || normalizedVariants !== undefined) {
    await validateSkuAndBarcodeCollisions({
      businessId,
      productId: existing.id,
      baseSku: normalizedSku,
      variants: normalizedVariants,
    });
  }

  const update: Prisma.ProductUpdateInput = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.sku !== undefined) update.sku = normalizedSku;
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

  const product = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: existing.id },
      data: update,
    });

    if (normalizedVariants !== undefined) {
      await syncProductVariants(
        tx,
        businessId,
        existing.id,
        normalizedVariants,
        userId,
        "Product variant update"
      );
    }

    return tx.product.findUniqueOrThrow({
      where: { id: existing.id },
      include: productInclude,
    });
  });

  await createLog({
    userId,
    action: "update",
    module: "product",
    entityId: String(product.id),
    entityName: product.name,
    description: `Updated product: ${product.name} (${product.productId})`,
    metadata: {
      productId: product.productId,
      fields: [
        ...Object.keys(update),
        ...(normalizedVariants !== undefined ? ["variants"] : []),
      ],
      variantCount: product.variants.length,
    },
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
