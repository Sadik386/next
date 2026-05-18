import { prisma } from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/business";

const DEFAULT_LIMIT = 5;

interface SearchResult {
  products?: {
    id: number;
    productId: string;
    name: string;
    sku: string | null;
    category: string | null;
    status: string;
    salePrice: string;
    stockQuantity: number | null;
  }[];
  inventory?: {
    id: number;
    productId: string;
    name: string;
    sku: string | null;
    quantity: number;
    threshold: number;
    status: string;
  }[];
  orders?: {
    id: number;
    orderId: string;
    customerName: string | null;
    paymentStatus: string;
    status: string;
    totalAmount: string;
  }[];
  sales?: {
    id: number;
    saleId: string;
    orderId: string | null;
    customerName: string | null;
    productName: string | null;
    totalAmount: string;
  }[];
  customers?: {
    id: number;
    customerId: string;
    name: string;
    email: string | null;
    mobile: string;
  }[];
  suppliers?: {
    id: number;
    supplierId: string;
    companyName: string;
    contactName: string | null;
    email: string | null;
    mobile: string;
  }[];
  expenses?: {
    id: number;
    expenseId: string;
    category: string;
    vendor: string | null;
    amount: string;
    date: string;
  }[];
}

function buildSearchConditions(query: string) {
  const normalized = query.trim().toLowerCase();
  const codeNormalized = query.trim().toUpperCase().replace(/[\s\-_]/g, "");
  const originalCode = query.trim().toUpperCase();
  
  return { normalized, codeNormalized, originalCode };
}

export async function globalSearch(query: string): Promise<SearchResult> {
  const businessId = getCurrentBusinessId();
  const { normalized, codeNormalized, originalCode } = buildSearchConditions(query);

  if (!normalized && !codeNormalized) {
    return {};
  }

  const results: SearchResult = {};
  const limit = DEFAULT_LIMIT;

  // Products - search by name, productId (both normalized and original), and SKU
  const products = await prisma.product.findMany({
    where: {
      businessId,
      deletedAt: null,
      OR: normalized
        ? [
            { name: { contains: normalized } },
            { productId: { contains: codeNormalized } },
            { productId: { contains: originalCode } },
            { sku: { contains: codeNormalized } },
          ]
        : [
            { productId: { contains: codeNormalized } },
            { productId: { contains: originalCode } },
            { sku: { contains: codeNormalized } },
          ],
    },
    include: { category: true, stock: true },
    take: limit,
  });

  if (products.length > 0) {
    results.products = products.map((p) => ({
      id: p.id,
      productId: p.productId,
      name: p.name,
      sku: p.sku,
      category: (p as any).category?.name ?? null,
      status: p.status,
      salePrice: p.salePrice.toString(),
      stockQuantity: (p as any).stock?.quantity ?? null,
    }));
  }

  // Inventory - search by product name, productId, SKU
  const inventory = await prisma.stock.findMany({
    where: {
      product: {
        businessId,
        deletedAt: null,
      },
      OR: normalized
        ? [
            { product: { name: { contains: normalized } } },
            { product: { productId: { contains: codeNormalized } } },
            { product: { productId: { contains: originalCode } } },
            { product: { sku: { contains: codeNormalized } } },
          ]
        : [
            { product: { productId: { contains: codeNormalized } } },
            { product: { productId: { contains: originalCode } } },
            { product: { sku: { contains: codeNormalized } } },
          ],
    },
    include: {
      product: {
        select: { productId: true, name: true, sku: true },
      },
    },
    take: limit,
  });

  if (inventory.length > 0) {
    results.inventory = inventory.map((s) => ({
      id: s.id,
      productId: (s as any).product?.productId ?? "",
      name: (s as any).product?.name ?? "",
      sku: (s as any).product?.sku ?? null,
      quantity: s.quantity,
      threshold: s.threshold,
      status: s.quantity <= 0 ? "out_of_stock" : s.quantity <= s.threshold ? "low_stock" : "in_stock",
    }));
  }

  // Orders - search by orderId and customer name
  const orders = await prisma.order.findMany({
    where: {
      businessId,
      OR: normalized
        ? [
            { orderId: { contains: codeNormalized } },
            { orderId: { contains: originalCode } },
            { customer: { name: { contains: normalized } } },
          ]
        : [
            { orderId: { contains: codeNormalized } },
            { orderId: { contains: originalCode } },
          ],
    },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (orders.length > 0) {
    results.orders = orders.map((o) => ({
      id: o.id,
      orderId: o.orderId,
      customerName: (o as any).customer?.name ?? null,
      paymentStatus: o.paymentStatus,
      status: o.status,
      totalAmount: o.totalAmount.toString(),
    }));
  }

  // Sales - search by saleId, productName, customer name
  const sales = await prisma.sale.findMany({
    where: {
      businessId,
      OR: normalized
        ? [
            { saleId: { contains: codeNormalized } },
            { saleId: { contains: originalCode } },
            { productName: { contains: normalized } },
            { customer: { name: { contains: normalized } } },
          ]
        : [
            { saleId: { contains: codeNormalized } },
            { saleId: { contains: originalCode } },
          ],
    },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (sales.length > 0) {
    results.sales = sales.map((s) => ({
      id: s.id,
      saleId: s.saleId,
      orderId: s.orderId != null ? String(s.orderId) : null,
      customerName: (s as any).customer?.name ?? null,
      productName: s.productName,
      totalAmount: s.totalAmount.toString(),
    }));
  }

  // Customers - search by name, customerId, email, mobile
  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      deletedAt: null,
      OR: normalized
        ? [
            { name: { contains: normalized } },
            { customerId: { contains: codeNormalized } },
            { customerId: { contains: originalCode } },
            { email: { contains: normalized } },
            { mobile: { contains: normalized } },
          ]
        : [
            { customerId: { contains: codeNormalized } },
            { customerId: { contains: originalCode } },
            { mobile: { contains: normalized } },
          ],
    },
    take: limit,
  });

  if (customers.length > 0) {
    results.customers = customers.map((c) => ({
      id: c.id,
      customerId: c.customerId,
      name: c.name,
      email: c.email,
      mobile: c.mobile,
    }));
  }

  // Suppliers - search by companyName, supplierId, contactName, email, mobile
  const suppliers = await prisma.supplier.findMany({
    where: {
      businessId,
      deletedAt: null,
      OR: normalized
        ? [
            { companyName: { contains: normalized } },
            { supplierId: { contains: codeNormalized } },
            { supplierId: { contains: originalCode } },
            { contactName: { contains: normalized } },
            { email: { contains: normalized } },
            { mobile: { contains: normalized } },
          ]
        : [
            { supplierId: { contains: codeNormalized } },
            { supplierId: { contains: originalCode } },
            { mobile: { contains: normalized } },
          ],
    },
    take: limit,
  });

  if (suppliers.length > 0) {
    results.suppliers = suppliers.map((s) => ({
      id: s.id,
      supplierId: s.supplierId,
      companyName: s.companyName,
      contactName: s.contactName ?? null,
      email: s.email,
      mobile: s.mobile ?? "",
    }));
  }

  // Expenses - search by expenseId, category, vendor, referenceNo
  const expenses = await prisma.expense.findMany({
    where: {
      businessId,
      deletedAt: null,
      OR: normalized
        ? [
            { expenseId: { contains: codeNormalized } },
            { expenseId: { contains: originalCode } },
            { category: { contains: normalized } },
            { vendor: { contains: normalized } },
            { referenceNo: { contains: codeNormalized } },
          ]
        : [
            { expenseId: { contains: codeNormalized } },
            { expenseId: { contains: originalCode } },
            { referenceNo: { contains: codeNormalized } },
          ],
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  if (expenses.length > 0) {
    results.expenses = expenses.map((e) => ({
      id: e.id,
      expenseId: e.expenseId,
      category: e.category,
      vendor: e.vendor,
      amount: e.amount.toString(),
      date: e.date.toISOString(),
    }));
  }

  return results;
}