import { Prisma } from "@prisma/client";
import { getStockStatus, StockStatus } from "@/services/inventory.service";
import { createNotification } from "@/services/notification.service";

export interface ApplyStockDeltaResult {
  previousQty: number;
  newQty: number;
  status: StockStatus;
  previousStatus: StockStatus;
}

export async function applyStockDelta(
  tx: Prisma.TransactionClient,
  businessId: number,
  productId: number,
  delta: number,
  reason: string,
  userId: number
): Promise<ApplyStockDeltaResult> {
  const product = await tx.product.findFirst({
    where: { id: productId, businessId, deletedAt: null },
  });
  if (!product) throw new Error("Product not found");

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

  const stockRecord =
    existingStock ??
    (await tx.stock.create({ data: { businessId, productId, quantity: 0, threshold: 10 } }));

  const previousQty = stockRecord.quantity;
  const threshold = stockRecord.threshold;
  const rawNewQty = previousQty + delta;
  const newQty = Math.max(0, rawNewQty);

  const updatedStock = await tx.stock.updateMany({
    where: { id: stockRecord.id, businessId },
    data: { quantity: newQty },
  });
  if (updatedStock.count !== 1) throw new Error("Stock not found");

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
