import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { getStockStatus } from "@/services/inventory.service";
import { generateOrderId } from "@/services/order.service";

const SHORT_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateShortId(): string {
  let result = "MOB-";
  for (let i = 0; i < 6; i++) {
    result += SHORT_ID_CHARS.charAt(Math.floor(Math.random() * SHORT_ID_CHARS.length));
  }
  return result;
}

export async function createPosSession(userId: number) {
  let id = generateShortId();
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await prisma.posSession.findUnique({ where: { id } });
    if (!exists) break;
    id = generateShortId();
  }

  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const session = await prisma.posSession.create({
    data: {
      id,
      createdBy: userId,
      status: "active",
      scans: "[]",
      expiresAt,
    },
  });
  return session;
}

export async function getPosSession(id: string) {
  const session = await prisma.posSession.findUnique({ where: { id } });
  if (!session) return null;
  if (session.status === "active" && session.expiresAt < new Date()) {
    await prisma.posSession.update({
      where: { id },
      data: { status: "expired" },
    });
    return { ...session, status: "expired" };
  }
  return session;
}

export async function endPosSession(id: string) {
  const session = await prisma.posSession.findUnique({ where: { id } });
  if (!session) return null;
  return prisma.posSession.update({
    where: { id },
    data: { status: "expired" },
  });
}

export async function appendScan(id: string, barcode: string) {
  const session = await prisma.posSession.findUnique({ where: { id } });
  if (!session) return { error: "Session not found" as const };
  if (session.status !== "active") return { error: "Session is not active" as const };
  if (session.expiresAt < new Date()) {
    await prisma.posSession.update({ where: { id }, data: { status: "expired" } });
    return { error: "Session expired" as const };
  }

  const trimmed = barcode.trim();
  if (!trimmed) return { error: "Barcode is required" as const };

  const product = await prisma.product.findFirst({
    where: {
      deletedAt: null,
      OR: [{ sku: trimmed }, { productId: trimmed }],
    },
    select: { id: true, productId: true, name: true, sku: true, salePrice: true, unit: true },
  });

  let scans: Array<{ barcode: string; productId?: number; name?: string; at: string }> = [];
  try {
    scans = JSON.parse(session.scans ?? "[]");
    if (!Array.isArray(scans)) scans = [];
  } catch {
    scans = [];
  }

  const entry = {
    barcode: trimmed,
    productId: product?.id,
    name: product?.name,
    at: new Date().toISOString(),
  };
  scans.push(entry);

  await prisma.posSession.update({
    where: { id },
    data: { scans: JSON.stringify(scans) },
  });

  if (!product) {
    return { success: true, productName: null, message: "Scan recorded but product not found" };
  }
  return { success: true, productName: product.name, productId: product.id };
}

export interface PosCheckoutItem {
  productId: number;
  quantity: number;
  unitPrice: number | string;
}

export interface PosCheckoutInput {
  customerId?: number | null;
  items: PosCheckoutItem[];
  discountAmount?: number | string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  paidAmount?: number | string;
  notes?: string | null;
}

function toDecimal(v: number | string | undefined | null, fallback = 0): Prisma.Decimal {
  if (v === undefined || v === null || v === "") return new Prisma.Decimal(fallback);
  return new Prisma.Decimal(v);
}

export async function checkoutPos(data: PosCheckoutInput, userId: number) {
  if (!data.items || data.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let customer = null;
  if (data.customerId) {
    customer = await prisma.customer.findFirst({
      where: { id: data.customerId, deletedAt: null },
    });
    if (!customer) throw new Error("Customer not found");
  } else {
    customer = await prisma.customer.findFirst({
      where: { customerId: "WALK-IN", deletedAt: null },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          customerId: "WALK-IN",
          name: "Walk-in customer",
          mobile: "—",
          status: "active",
        },
      });
    }
  }

  const itemRows = data.items.map((it) => {
    const product = productMap.get(it.productId);
    if (!product) throw new Error(`Product ${it.productId} not found`);
    const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
    const unitPrice = toDecimal(it.unitPrice ?? product.salePrice);
    const totalPrice = unitPrice.mul(qty);
    return { product, qty, unitPrice, totalPrice };
  });

  const subtotal = itemRows.reduce(
    (acc, r) => acc.add(r.totalPrice),
    new Prisma.Decimal(0)
  );
  const taxAmount = itemRows.reduce((acc, r) => {
    const rate = new Prisma.Decimal(r.product.taxRate ?? 0);
    return acc.add(r.totalPrice.mul(rate).div(100));
  }, new Prisma.Decimal(0));
  const discountAmount = toDecimal(data.discountAmount ?? 0);
  const totalAmount = subtotal.add(taxAmount).sub(discountAmount);
  const paidAmount =
    data.paidAmount !== undefined && data.paidAmount !== null && data.paidAmount !== ""
      ? toDecimal(data.paidAmount)
      : totalAmount;

  let paymentStatus = data.paymentStatus ?? "paid";
  if (!["paid", "partial", "unpaid"].includes(paymentStatus)) paymentStatus = "paid";

  const orderId = await generateOrderId();

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderId,
        customerId: customer.id,
        status: "delivered",
        paymentStatus,
        paymentMethod: data.paymentMethod ?? null,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paidAmount,
        notes: data.notes ?? null,
        createdBy: userId,
        items: {
          create: itemRows.map((r) => ({
            productId: r.product.id,
            productName: r.product.name,
            quantity: r.qty,
            unitPrice: r.unitPrice,
            totalPrice: r.totalPrice,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    const sales: Array<{ id: number; saleId: string }> = [];
    for (const row of itemRows) {
      const stock = await tx.stock.findUnique({ where: { productId: row.product.id } });
      const previousQty = stock?.quantity ?? 0;
      const threshold = stock?.threshold ?? 10;
      const newQty = Math.max(0, previousQty - row.qty);

      const stockRecord =
        stock ??
        (await tx.stock.create({
          data: { productId: row.product.id, quantity: 0, threshold: 10 },
        }));

      await tx.stock.update({
        where: { id: stockRecord.id },
        data: { quantity: newQty },
      });

      await tx.stockLog.create({
        data: {
          stockId: stockRecord.id,
          productId: row.product.id,
          type: "subtract",
          quantity: row.qty,
          reason: `POS ${orderId}`,
          previousQty,
          newQty,
          createdBy: userId,
        },
      });

      const status = getStockStatus(newQty, threshold);
      const targetStatus =
        status === "out_of_stock"
          ? "inactive"
          : status === "in_stock"
          ? "active"
          : row.product.status;
      if (targetStatus !== row.product.status) {
        await tx.product.update({
          where: { id: row.product.id },
          data: { status: targetStatus },
        });
      }

      const saleId = `SL-${String((await tx.sale.count()) + 1).padStart(3, "0")}`;
      const sale = await tx.sale.create({
        data: {
          saleId,
          orderId: order.id,
          customerId: customer.id,
          productId: row.product.id,
          productName: row.product.name,
          quantity: row.qty,
          unitPrice: row.unitPrice,
          totalAmount: row.totalPrice,
          taxAmount: row.totalPrice.mul(new Prisma.Decimal(row.product.taxRate ?? 0)).div(100),
          discountAmount: new Prisma.Decimal(0),
          paymentStatus,
          paymentMethod: data.paymentMethod ?? null,
          notes: data.notes ?? null,
          createdBy: userId,
        },
      });
      sales.push({ id: sale.id, saleId: sale.saleId });
    }

    return { order, sales };
  });

  await createLog({
    userId,
    action: "create",
    module: "pos",
    entityId: String(result.order.id),
    entityName: result.order.orderId,
    description: `POS checkout ${result.order.orderId} (${itemRows.length} items)`,
    metadata: {
      orderId: result.order.orderId,
      totalAmount: totalAmount.toString(),
      itemCount: itemRows.length,
    },
  });

  return result.order;
}

export interface HeldOrderInput {
  items: unknown;
  customerData?: unknown;
  discount?: number;
  notes?: string | null;
}

export async function listHeldOrders(userId: number) {
  return prisma.heldOrder.findMany({
    where: { createdBy: userId },
    orderBy: { id: "desc" },
  });
}

export async function holdOrder(input: HeldOrderInput, userId: number) {
  return prisma.heldOrder.create({
    data: {
      createdBy: userId,
      items: JSON.stringify(input.items ?? []),
      customerData: input.customerData ? JSON.stringify(input.customerData) : null,
      discount: Number(input.discount ?? 0),
      notes: input.notes ?? null,
    },
  });
}

export async function deleteHeldOrder(id: number, userId: number) {
  const held = await prisma.heldOrder.findUnique({ where: { id } });
  if (!held || held.createdBy !== userId) return null;
  return prisma.heldOrder.delete({ where: { id } });
}
