import { Prisma } from "@prisma/client";
import { getStockStatus, StockStatus } from "@/services/inventory.service";
import { createNotification } from "@/services/notification.service";
import { getCurrentBusinessId } from "@/lib/business";

export interface ApplyStockDeltaResult {
  previousQty: number;
  newQty: number;
  status: StockStatus;
  previousStatus: StockStatus;
}

export async function applyStockDelta(
  tx: Prisma.TransactionClient,
  productId: number,
  delta: number,
  reason: string,
  userId: number
): Promise<ApplyStockDeltaResult> {
  const businessId = getCurrentBusinessId();
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error(`Product ${productId} not found`);

  const existingStock = await tx.stock.findUnique({ where: { productId } });
  const stockRecord =
    existingStock ??
    (await tx.stock.create({ data: { businessId, productId, quantity: 0, threshold: 10 } }));

  const previousQty = stockRecord.quantity;
  const threshold = stockRecord.threshold;
  const rawNewQty = previousQty + delta;
  const newQty = Math.max(0, rawNewQty);

  await tx.stock.update({
    where: { id: stockRecord.id },
    data: { quantity: newQty },
  });

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
    await tx.product.update({
      where: { id: productId },
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
