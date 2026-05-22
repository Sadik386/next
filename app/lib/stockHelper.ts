import { Prisma } from "@prisma/client";
import { getStockStatus, StockStatus } from "@/services/inventory.service";
import { createNotification } from "@/services/notification.service";

export interface ApplyStockDeltaResult {
  previousQty: number;
  newQty: number;
  status: StockStatus;
  previousStatus: StockStatus;
}

async function ensureStockRecord(
  tx: Prisma.TransactionClient,
  businessId: number,
  productId: number
) {
  const existingStock = await tx.stock.findFirst({
    where: { productId, businessId },
    include: { product: { select: { businessId: true } } },
  });
  if (
    existingStock &&
    (existingStock.businessId !== businessId ||
      existingStock.product.businessId !== businessId)
  ) {
    throw new Error("Product not found");
  }
  const conflictingStock = existingStock
    ? null
    : await tx.stock.findFirst({
        where: { productId },
        select: { id: true },
      });
  if (conflictingStock) throw new Error("Product not found");

  return (
    existingStock ??
    (await tx.stock.create({ data: { businessId, productId, quantity: 0, threshold: 10 } }))
  );
}

export async function applyStockDelta(
  tx: Prisma.TransactionClient,
  businessId: number,
  productId: number,
  delta: number,
  reason: string,
  userId: number,
  productVariantId?: number | null
): Promise<ApplyStockDeltaResult> {
  const product = await tx.product.findFirst({
    where: { id: productId, businessId, deletedAt: null },
  });
  if (!product) throw new Error("Product not found");

  if (productVariantId) {
    const variant = await tx.productVariant.findFirst({
      where: { id: productVariantId, productId, businessId, deletedAt: null },
    });
    if (!variant) throw new Error("Product variant not found");
    if (variant.status !== "active") throw new Error("Product variant is inactive");

    const previousQty = variant.stockQuantity;
    const threshold = variant.lowStockThreshold;
    if (delta < 0 && previousQty + delta < 0) {
      throw new Error(`Insufficient stock for ${product.name} / ${variant.label}`);
    }

    const updatedVariant = await tx.productVariant.updateMany({
      where: {
        id: variant.id,
        businessId,
        productId,
        ...(delta < 0 ? { stockQuantity: { gte: Math.abs(delta) } } : {}),
      },
      data: { stockQuantity: { increment: delta } },
    });
    if (updatedVariant.count !== 1) {
      throw new Error(`Insufficient stock for ${product.name} / ${variant.label}`);
    }

    const nextVariant = await tx.productVariant.findUniqueOrThrow({
      where: { id: variant.id },
    });
    const newQty = nextVariant.stockQuantity;
    const stockRecord = await ensureStockRecord(tx, businessId, productId);

    await tx.stockLog.create({
      data: {
        businessId,
        stockId: stockRecord.id,
        productId,
        productVariantId: variant.id,
        type: delta >= 0 ? "add" : "subtract",
        quantity: Math.abs(delta),
        reason,
        previousQty,
        newQty,
        createdBy: userId,
      },
    });

    const previousStatus = getStockStatus(previousQty, threshold);
    const status = getStockStatus(newQty, threshold);
    if (status !== previousStatus) {
      const variantName = `${product.name} / ${variant.label}`;
      if (status === "out_of_stock") {
        void createNotification({
          type: "out_of_stock",
          title: "Out of Stock",
          message: `Variant ${variantName} is out of stock`,
          link: "/inventory",
        });
      } else if (status === "low") {
        void createNotification({
          type: "low_stock",
          title: "Low Stock Alert",
          message: `Variant ${variantName} is running low (${newQty} units)`,
          link: "/inventory",
        });
      }
    }

    return { previousQty, newQty, status, previousStatus };
  }

  const stockRecord = await ensureStockRecord(tx, businessId, productId);
  const previousQty = stockRecord.quantity;
  const threshold = stockRecord.threshold;
  if (delta < 0 && previousQty + delta < 0) {
    throw new Error(`Insufficient stock for ${product.name}`);
  }

  const updatedStock = await tx.stock.updateMany({
    where: {
      id: stockRecord.id,
      businessId,
      ...(delta < 0 ? { quantity: { gte: Math.abs(delta) } } : {}),
    },
    data: { quantity: { increment: delta } },
  });
  if (updatedStock.count !== 1) throw new Error(`Insufficient stock for ${product.name}`);

  const nextStock = await tx.stock.findUniqueOrThrow({ where: { id: stockRecord.id } });
  const newQty = nextStock.quantity;

  await tx.stockLog.create({
    data: {
      businessId,
      stockId: stockRecord.id,
      productId,
      type: delta >= 0 ? "add" : "subtract",
      quantity: Math.abs(delta),
      reason,
      previousQty,
      newQty,
      createdBy: userId,
    },
  });

  const previousStatus = getStockStatus(previousQty, threshold);
  const status = getStockStatus(newQty, threshold);
  const targetProductStatus =
    status === "out_of_stock"
      ? "inactive"
      : status === "in_stock"
      ? "active"
      : product.status;
  if (targetProductStatus !== product.status) {
    await tx.product.updateMany({
      where: { id: productId, businessId },
      data: { status: targetProductStatus },
    });
  }

  if (status !== previousStatus) {
    if (status === "out_of_stock") {
      void createNotification({
        type: "out_of_stock",
        title: "Out of Stock",
        message: `Product ${product.name} is out of stock`,
        link: "/inventory",
      });
    } else if (status === "low") {
      void createNotification({
        type: "low_stock",
        title: "Low Stock Alert",
        message: `Product ${product.name} is running low (${newQty} units)`,
        link: "/inventory",
      });
    }
  }

  return { previousQty, newQty, status, previousStatus };
}
