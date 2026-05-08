import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentBusinessId } from "@/lib/business";

function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function endOfDay(d: Date): Date {
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function startOfDay(d: Date): Date {
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export async function getSalesReport(from: Date, to: Date) {
  const fromDate = startOfDay(from);
  const toDate = endOfDay(to);

  const sales = await prisma.sale.findMany({
    where: { date: { gte: fromDate, lte: toDate }, businessId: getCurrentBusinessId() },
    include: {
      customer: { select: { id: true, customerId: true, name: true } },
      product: { select: { id: true, productId: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  let totalRevenue = 0;
  let taxCollected = 0;
  let totalDiscounts = 0;
  const trendMap = new Map<string, { revenue: number; count: number }>();
  const methodMap = new Map<string, { amount: number; count: number }>();
  const statusMap = new Map<string, { amount: number; count: number }>();
  const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();
  const customerMap = new Map<string, { name: string; revenue: number; orders: number }>();

  for (const s of sales) {
    const total = toNumber(s.totalAmount);
    const tax = toNumber(s.taxAmount);
    const disc = toNumber(s.discountAmount);
    totalRevenue += total;
    taxCollected += tax;
    totalDiscounts += disc;

    const dk = dateKey(s.date);
    const tEntry = trendMap.get(dk) ?? { revenue: 0, count: 0 };
    tEntry.revenue += total;
    tEntry.count += 1;
    trendMap.set(dk, tEntry);

    const method = s.paymentMethod ?? "Unspecified";
    const mEntry = methodMap.get(method) ?? { amount: 0, count: 0 };
    mEntry.amount += total;
    mEntry.count += 1;
    methodMap.set(method, mEntry);

    const status = s.paymentStatus ?? "unknown";
    const stEntry = statusMap.get(status) ?? { amount: 0, count: 0 };
    stEntry.amount += total;
    stEntry.count += 1;
    statusMap.set(status, stEntry);

    if (s.product) {
      const key = String(s.product.id);
      const pEntry = productMap.get(key) ?? { name: s.product.name, revenue: 0, quantity: 0 };
      pEntry.revenue += total;
      pEntry.quantity += s.quantity;
      productMap.set(key, pEntry);
    } else if (s.productName) {
      const pEntry = productMap.get(s.productName) ?? {
        name: s.productName,
        revenue: 0,
        quantity: 0,
      };
      pEntry.revenue += total;
      pEntry.quantity += s.quantity;
      productMap.set(s.productName, pEntry);
    }

    if (s.customer) {
      const key = String(s.customer.id);
      const cEntry = customerMap.get(key) ?? {
        name: s.customer.name,
        revenue: 0,
        orders: 0,
      };
      cEntry.revenue += total;
      cEntry.orders += 1;
      customerMap.set(key, cEntry);
    }
  }

  const totalSales = sales.length;
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  const trend = Array.from(trendMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, v]) => ({ date, revenue: Number(v.revenue.toFixed(2)), count: v.count }));

  const byPaymentMethod = Array.from(methodMap.entries())
    .map(([method, v]) => ({ method, amount: Number(v.amount.toFixed(2)), count: v.count }))
    .sort((a, b) => b.amount - a.amount);

  const byPaymentStatus = Array.from(statusMap.entries())
    .map(([status, v]) => ({ status, amount: Number(v.amount.toFixed(2)), count: v.count }))
    .sort((a, b) => b.amount - a.amount);

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({ name: p.name, revenue: Number(p.revenue.toFixed(2)), quantity: p.quantity }));

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((c) => ({ name: c.name, revenue: Number(c.revenue.toFixed(2)), orders: c.orders }));

  const records = sales.map((s) => ({
    saleId: s.saleId,
    date: dateKey(s.date),
    customer: s.customer?.name ?? "",
    customerId: s.customer?.customerId ?? "",
    product: s.product?.name ?? s.productName ?? "",
    quantity: s.quantity,
    unitPrice: toNumber(s.unitPrice),
    totalAmount: toNumber(s.totalAmount),
    taxAmount: toNumber(s.taxAmount),
    discountAmount: toNumber(s.discountAmount),
    paymentStatus: s.paymentStatus,
    paymentMethod: s.paymentMethod ?? "",
    returnStatus: s.returnStatus,
  }));

  return {
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      avgOrderValue: Number(avgOrderValue.toFixed(2)),
      taxCollected: Number(taxCollected.toFixed(2)),
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      totalSales,
    },
    chartData: { trend, byPaymentMethod, byPaymentStatus, topProducts, topCustomers },
    records,
  };
}

export async function getExpenseReport(from: Date, to: Date) {
  const fromDate = startOfDay(from);
  const toDate = endOfDay(to);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: fromDate, lte: toDate }, businessId: getCurrentBusinessId() },
    orderBy: { date: "asc" },
  });

  let totalExpenses = 0;
  let totalTax = 0;
  const categoryMap = new Map<string, { amount: number; count: number }>();
  const trendMap = new Map<string, { amount: number; count: number }>();
  const methodMap = new Map<string, { amount: number }>();

  for (const e of expenses) {
    const amount = toNumber(e.amount);
    const tax = toNumber(e.taxAmount);
    totalExpenses += amount;
    totalTax += tax;

    const cEntry = categoryMap.get(e.category) ?? { amount: 0, count: 0 };
    cEntry.amount += amount;
    cEntry.count += 1;
    categoryMap.set(e.category, cEntry);

    const dk = dateKey(e.date);
    const tEntry = trendMap.get(dk) ?? { amount: 0, count: 0 };
    tEntry.amount += amount;
    tEntry.count += 1;
    trendMap.set(dk, tEntry);

    const mEntry = methodMap.get(e.paymentMethod) ?? { amount: 0 };
    mEntry.amount += amount;
    methodMap.set(e.paymentMethod, mEntry);
  }

  const totalTransactions = expenses.length;
  const avgExpense = totalTransactions > 0 ? totalExpenses / totalTransactions : 0;

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, v]) => ({ category, amount: Number(v.amount.toFixed(2)), count: v.count }))
    .sort((a, b) => b.amount - a.amount);

  const trend = Array.from(trendMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, v]) => ({ date, amount: Number(v.amount.toFixed(2)), count: v.count }));

  const byPaymentMethod = Array.from(methodMap.entries())
    .map(([method, v]) => ({ method, amount: Number(v.amount.toFixed(2)) }))
    .sort((a, b) => b.amount - a.amount);

  const records = expenses.map((e) => ({
    expenseId: e.expenseId,
    date: dateKey(e.date),
    category: e.category,
    vendor: e.vendor,
    amount: toNumber(e.amount),
    taxAmount: toNumber(e.taxAmount),
    taxPercent: toNumber(e.taxPercent),
    paymentMethod: e.paymentMethod,
    referenceNo: e.referenceNo ?? "",
    receiptId: e.receiptId ?? "",
    description: e.description ?? "",
  }));

  return {
    summary: {
      totalExpenses: Number(totalExpenses.toFixed(2)),
      avgExpense: Number(avgExpense.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalTransactions,
    },
    chartData: { byCategory, trend, byPaymentMethod },
    records,
  };
}

export async function getProfitReport(from: Date, to: Date) {
  const fromDate = startOfDay(from);
  const toDate = endOfDay(to);

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { date: { gte: fromDate, lte: toDate }, businessId: getCurrentBusinessId() },
      select: { date: true, totalAmount: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: fromDate, lte: toDate }, businessId: getCurrentBusinessId() },
      select: { date: true, amount: true },
    }),
  ]);

  let totalRevenue = 0;
  let totalExpenses = 0;
  const monthMap = new Map<string, { revenue: number; expenses: number }>();
  const trendMap = new Map<string, { revenue: number; expenses: number }>();

  for (const s of sales) {
    const amount = toNumber(s.totalAmount);
    totalRevenue += amount;

    const mk = monthKey(s.date);
    const mEntry = monthMap.get(mk) ?? { revenue: 0, expenses: 0 };
    mEntry.revenue += amount;
    monthMap.set(mk, mEntry);

    const dk = dateKey(s.date);
    const dEntry = trendMap.get(dk) ?? { revenue: 0, expenses: 0 };
    dEntry.revenue += amount;
    trendMap.set(dk, dEntry);
  }

  for (const e of expenses) {
    const amount = toNumber(e.amount);
    totalExpenses += amount;

    const mk = monthKey(e.date);
    const mEntry = monthMap.get(mk) ?? { revenue: 0, expenses: 0 };
    mEntry.expenses += amount;
    monthMap.set(mk, mEntry);

    const dk = dateKey(e.date);
    const dEntry = trendMap.get(dk) ?? { revenue: 0, expenses: 0 };
    dEntry.expenses += amount;
    trendMap.set(dk, dEntry);
  }

  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const monthly = Array.from(monthMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, v]) => ({
      month,
      revenue: Number(v.revenue.toFixed(2)),
      expenses: Number(v.expenses.toFixed(2)),
      profit: Number((v.revenue - v.expenses).toFixed(2)),
    }));

  const trend = Array.from(trendMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, v]) => ({
      date,
      profit: Number((v.revenue - v.expenses).toFixed(2)),
    }));

  return {
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      profitMargin: Number(profitMargin.toFixed(2)),
    },
    chartData: { monthly, trend },
  };
}
