import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentBusinessId } from "@/lib/business";

function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return startOfDay(d);
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type AlertType = "critical" | "warning" | "info" | "success";

export interface IntelligenceAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  action?: { label: string; href: string };
  data: Record<string, unknown>;
}

export async function getIntelligenceAlerts(): Promise<IntelligenceAlert[]> {
  const businessId = getCurrentBusinessId();
  const alerts: IntelligenceAlert[] = [];
  const now = new Date();
  const thirtyDaysAgo = daysAgo(30);
  const sevenDaysAgo = daysAgo(7);

  const [products, recentSales, openOrders] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null, businessId },
      include: { stock: true, category: { select: { name: true } } },
    }),
    prisma.sale.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        businessId,
        deletedAt: null,
      },
      select: { productId: true, quantity: true, date: true, totalAmount: true },
    }),
    prisma.order.findMany({
      where: {
        deletedAt: null,
        businessId,
        status: { not: "cancelled" },
      },
      select: {
        id: true,
        orderId: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        createdAt: true,
        items: { select: { productId: true, quantity: true } },
      },
    }),
  ]);

  const salesByProduct = new Map<number, { qty: number; lastSale: Date | null }>();
  for (const s of recentSales) {
    if (!s.productId) continue;
    const entry = salesByProduct.get(s.productId) ?? { qty: 0, lastSale: null };
    entry.qty += s.quantity;
    if (!entry.lastSale || s.date > entry.lastSale) entry.lastSale = s.date;
    salesByProduct.set(s.productId, entry);
  }

  const pendingByProduct = new Map<number, number>();
  for (const o of openOrders) {
    if (o.status === "delivered") continue;
    for (const item of o.items) {
      pendingByProduct.set(item.productId, (pendingByProduct.get(item.productId) ?? 0) + item.quantity);
    }
  }

  // CRITICAL: stock = 0 with pending orders
  for (const p of products) {
    const qty = p.stock?.quantity ?? 0;
    const pending = pendingByProduct.get(p.id) ?? 0;
    if (qty === 0 && pending > 0) {
      alerts.push({
        id: `critical-stockout-pending-${p.id}`,
        type: "critical",
        title: `Stock out — ${p.name}`,
        description: `${pending} unit(s) committed to pending orders but stock is empty. Immediate restock required.`,
        action: { label: "Place PO now →", href: "/suppliers" },
        data: { productId: p.productId, pending, stock: qty },
      });
    }
  }

  // CRITICAL: stock-out 7+ days with recent sales history
  for (const p of products) {
    const qty = p.stock?.quantity ?? 0;
    const sales = salesByProduct.get(p.id);
    if (qty === 0 && sales && sales.qty > 0 && sales.lastSale) {
      const daysSinceLast = Math.floor((now.getTime() - sales.lastSale.getTime()) / 86400_000);
      if (daysSinceLast >= 7) {
        alerts.push({
          id: `critical-stockout-history-${p.id}`,
          type: "critical",
          title: `Lost sales — ${p.name}`,
          description: `Out of stock for ${daysSinceLast} days. Sold ${sales.qty} units in the prior period.`,
          action: { label: "Restock →", href: "/inventory" },
          data: { productId: p.productId, daysOut: daysSinceLast, prevSales: sales.qty },
        });
      }
    }
  }

  // CRITICAL: unpaid orders >30 days, high value
  for (const o of openOrders) {
    if (o.paymentStatus === "paid") continue;
    const ageDays = Math.floor((now.getTime() - o.createdAt.getTime()) / 86400_000);
    const total = toNumber(o.totalAmount);
    if (ageDays > 30 && total >= 1000) {
      alerts.push({
        id: `critical-unpaid-${o.id}`,
        type: "critical",
        title: `Unpaid ${ageDays} days — ${o.orderId}`,
        description: `Order total ${total.toLocaleString()} unpaid for ${ageDays} days. Follow up with customer.`,
        action: { label: "View order →", href: `/orders/${o.id}` },
        data: { orderId: o.orderId, ageDays, total },
      });
    }
  }

  // WARNING: stock below threshold AND selling 2+ units/week
  for (const p of products) {
    const qty = p.stock?.quantity ?? 0;
    const threshold = p.stock?.threshold ?? 10;
    if (qty <= 0 || qty > threshold) continue;
    const sales = salesByProduct.get(p.id);
    if (!sales) continue;
    const perWeek = sales.qty / (30 / 7);
    if (perWeek >= 2) {
      alerts.push({
        id: `warning-low-${p.id}`,
        type: "warning",
        title: `Low stock — ${p.name}`,
        description: `${qty} units left, selling ~${perWeek.toFixed(1)}/week. Threshold is ${threshold}.`,
        action: { label: "Restock →", href: "/inventory" },
        data: { productId: p.productId, stock: qty, threshold, perWeek: Number(perWeek.toFixed(2)) },
      });
    }
  }

  // WARNING: not restocked in 30 days but selling regularly
  const stockLogs = await prisma.stockLog.findMany({
    where: {
      businessId,
      type: "add",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { productId: true },
  });
  const restockedRecently = new Set(stockLogs.map((l) => l.productId));
  for (const p of products) {
    if (restockedRecently.has(p.id)) continue;
    const sales = salesByProduct.get(p.id);
    if (!sales || sales.qty < 5) continue;
    alerts.push({
      id: `warning-no-restock-${p.id}`,
      type: "warning",
      title: `No restock in 30d — ${p.name}`,
      description: `Sold ${sales.qty} units last 30 days but never restocked. Plan an order.`,
      action: { label: "Order today →", href: "/orders" },
      data: { productId: p.productId, sales30d: sales.qty },
    });
  }

  // WARNING: expense > revenue this month
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [monthlySales, monthlyExpenses] = await Promise.all([
    prisma.sale.aggregate({
      where: { businessId, date: { gte: monthStart }, deletedAt: null },
      _sum: { totalAmount: true },
    }),
    prisma.expense.aggregate({
      where: { businessId, date: { gte: monthStart }, deletedAt: null },
      _sum: { amount: true },
    }),
  ]);
  const mRevenue = toNumber(monthlySales._sum.totalAmount);
  const mExpense = toNumber(monthlyExpenses._sum.amount);
  if (mExpense > mRevenue && mExpense > 0) {
    alerts.push({
      id: `warning-burn-${monthKey(now)}`,
      type: "warning",
      title: "Expenses exceed revenue this month",
      description: `Spent ${mExpense.toLocaleString()} vs earned ${mRevenue.toLocaleString()}. Review costs.`,
      action: { label: "View expenses →", href: "/expenses" },
      data: { revenue: mRevenue, expense: mExpense },
    });
  }

  // INFO: customer milestones
  const customerCount = await prisma.customer.count({
    where: { businessId, deletedAt: null },
  });
  for (const milestone of [10, 50, 100, 250, 500, 1000]) {
    if (customerCount === milestone) {
      alerts.push({
        id: `info-customers-${milestone}`,
        type: "info",
        title: `${milestone} customers reached`,
        description: `You've onboarded your ${milestone}th customer.`,
        action: { label: "View customers →", href: "/customers" },
        data: { count: customerCount },
      });
      break;
    }
  }

  // INFO: products trending up (50%+ vs prior month)
  const sixtyDaysAgo = daysAgo(60);
  const priorPeriodSales = await prisma.sale.findMany({
    where: {
      businessId,
      deletedAt: null,
      date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
    select: { productId: true, quantity: true },
  });
  const priorByProduct = new Map<number, number>();
  for (const s of priorPeriodSales) {
    if (!s.productId) continue;
    priorByProduct.set(s.productId, (priorByProduct.get(s.productId) ?? 0) + s.quantity);
  }
  for (const [productId, current] of salesByProduct) {
    if (current.qty < 5) continue;
    const prior = priorByProduct.get(productId) ?? 0;
    if (prior === 0) continue;
    const growth = ((current.qty - prior) / prior) * 100;
    if (growth >= 50) {
      const product = products.find((p) => p.id === productId);
      if (!product) continue;
      alerts.push({
        id: `info-trending-${productId}`,
        type: "info",
        title: `Trending up — ${product.name}`,
        description: `Sales up ${growth.toFixed(0)}% vs previous period (${prior} → ${current.qty} units).`,
        data: { productId: product.productId, growth: Number(growth.toFixed(2)) },
      });
    }
  }

  // SUCCESS: best selling product this month
  const monthStartSales = await prisma.sale.findMany({
    where: { businessId, deletedAt: null, date: { gte: monthStart } },
    select: { productId: true, quantity: true, totalAmount: true },
  });
  const monthByProduct = new Map<number, { qty: number; revenue: number }>();
  for (const s of monthStartSales) {
    if (!s.productId) continue;
    const entry = monthByProduct.get(s.productId) ?? { qty: 0, revenue: 0 };
    entry.qty += s.quantity;
    entry.revenue += toNumber(s.totalAmount);
    monthByProduct.set(s.productId, entry);
  }
  if (monthByProduct.size > 0) {
    const top = [...monthByProduct.entries()].sort(([, a], [, b]) => b.revenue - a.revenue)[0];
    const product = products.find((p) => p.id === top[0]);
    if (product) {
      alerts.push({
        id: `success-best-${monthKey(now)}-${product.id}`,
        type: "success",
        title: `Best seller this month — ${product.name}`,
        description: `${top[1].qty} units sold for ${top[1].revenue.toLocaleString()} revenue.`,
        data: { productId: product.productId, quantity: top[1].qty, revenue: top[1].revenue },
      });
    }
  }

  // SUCCESS: revenue milestones
  const totalRevenueAgg = await prisma.sale.aggregate({
    where: { businessId, deletedAt: null },
    _sum: { totalAmount: true },
  });
  const totalRevenue = toNumber(totalRevenueAgg._sum.totalAmount);
  const revenueMilestones = [10000, 50000, 100000, 500000, 1000000, 5000000];
  for (let i = revenueMilestones.length - 1; i >= 0; i--) {
    const m = revenueMilestones[i];
    if (totalRevenue >= m) {
      alerts.push({
        id: `success-revenue-${m}`,
        type: "success",
        title: `Revenue milestone — ${m.toLocaleString()}`,
        description: `Lifetime revenue has crossed ${m.toLocaleString()}. Total: ${totalRevenue.toLocaleString()}.`,
        data: { milestone: m, total: totalRevenue },
      });
      break;
    }
  }

  // Sort: critical first, then warning, info, success — silently using sevenDaysAgo for completeness
  void sevenDaysAgo;
  const order: Record<AlertType, number> = { critical: 0, warning: 1, info: 2, success: 3 };
  alerts.sort((a, b) => order[a.type] - order[b.type]);
  return alerts;
}

export async function getIntelligenceSummary() {
  const alerts = await getIntelligenceAlerts();
  const criticalAlerts = alerts.filter((a) => a.type === "critical").length;
  const warnings = alerts.filter((a) => a.type === "warning").length;
  const infos = alerts.filter((a) => a.type === "info").length;
  const successes = alerts.filter((a) => a.type === "success").length;

  const businessId = getCurrentBusinessId();
  const monthStart = (() => {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  })();

  const [monthSales, allSales] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId, deletedAt: null, date: { gte: monthStart } },
      select: { productId: true, totalAmount: true, date: true },
    }),
    prisma.sale.findMany({
      where: { businessId, deletedAt: null },
      select: { date: true },
    }),
  ]);

  const monthRevenue = monthSales.reduce((sum, s) => sum + toNumber(s.totalAmount), 0);
  const productRevenue = new Map<number, number>();
  for (const s of monthSales) {
    if (!s.productId) continue;
    productRevenue.set(s.productId, (productRevenue.get(s.productId) ?? 0) + toNumber(s.totalAmount));
  }
  let topProductName: string | null = null;
  let topProductPercent = 0;
  if (productRevenue.size > 0 && monthRevenue > 0) {
    const [topId, topRev] = [...productRevenue.entries()].sort(([, a], [, b]) => b - a)[0];
    const product = await prisma.product.findUnique({ where: { id: topId }, select: { name: true } });
    topProductName = product?.name ?? null;
    topProductPercent = (topRev / monthRevenue) * 100;
  }

  // Peak hour
  const hourCounts = new Array(24).fill(0);
  for (const s of allSales) {
    hourCounts[s.date.getUTCHours()] += 1;
  }
  let peakHour = "—";
  let peakHourPercent = 0;
  const totalCount = allSales.length;
  if (totalCount > 0) {
    const max = Math.max(...hourCounts);
    const peakIdx = hourCounts.indexOf(max);
    peakHour = formatHourRange(peakIdx);
    peakHourPercent = (max / totalCount) * 100;
  }

  return {
    criticalAlerts,
    warnings,
    infos,
    successes,
    totalAlerts: alerts.length,
    topProductName,
    topProductPercent: Number(topProductPercent.toFixed(2)),
    peakHour,
    peakHourPercent: Number(peakHourPercent.toFixed(2)),
    lastUpdated: new Date().toISOString(),
  };
}

function formatHourRange(hour: number): string {
  const start = hour;
  const end = (hour + 2) % 24;
  return `${formatHour(start)}-${formatHour(end)}`;
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export type TopProductMetric = "revenue" | "quantity";

export async function getTopProducts(opts: {
  from: Date;
  to: Date;
  limit?: number;
  metric?: TopProductMetric;
}) {
  const businessId = getCurrentBusinessId();
  const limit = opts.limit ?? 10;
  const metric = opts.metric ?? "revenue";
  const fromDate = startOfDay(opts.from);
  const toDate = endOfDay(opts.to);

  const periodMs = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - periodMs);

  const [currentSales, prevSales] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId, deletedAt: null, date: { gte: fromDate, lte: toDate } },
      include: {
        product: { select: { id: true, productId: true, name: true, category: { select: { name: true } } } },
      },
    }),
    prisma.sale.findMany({
      where: { businessId, deletedAt: null, date: { gte: prevFrom, lte: prevTo } },
      select: { productId: true, quantity: true, totalAmount: true },
    }),
  ]);

  type Stat = {
    productId: string;
    name: string;
    category: string | null;
    totalQuantity: number;
    totalRevenue: number;
    orderIds: Set<number>;
  };
  const map = new Map<number, Stat>();
  for (const s of currentSales) {
    if (!s.product) continue;
    const entry = map.get(s.product.id) ?? {
      productId: s.product.productId,
      name: s.product.name,
      category: s.product.category?.name ?? null,
      totalQuantity: 0,
      totalRevenue: 0,
      orderIds: new Set<number>(),
    };
    entry.totalQuantity += s.quantity;
    entry.totalRevenue += toNumber(s.totalAmount);
    if (s.orderId) entry.orderIds.add(s.orderId);
    map.set(s.product.id, entry);
  }

  const prevMap = new Map<number, { qty: number; rev: number }>();
  for (const s of prevSales) {
    if (!s.productId) continue;
    const entry = prevMap.get(s.productId) ?? { qty: 0, rev: 0 };
    entry.qty += s.quantity;
    entry.rev += toNumber(s.totalAmount);
    prevMap.set(s.productId, entry);
  }

  const arr = [...map.entries()].map(([id, stat]) => {
    const prev = prevMap.get(id) ?? { qty: 0, rev: 0 };
    const currentVal = metric === "revenue" ? stat.totalRevenue : stat.totalQuantity;
    const prevVal = metric === "revenue" ? prev.rev : prev.qty;
    let trend: "up" | "down" | "stable" = "stable";
    let trendPercent = 0;
    if (prevVal > 0) {
      const pct = ((currentVal - prevVal) / prevVal) * 100;
      trendPercent = Number(pct.toFixed(2));
      if (pct >= 5) trend = "up";
      else if (pct <= -5) trend = "down";
    } else if (currentVal > 0) {
      trend = "up";
      trendPercent = 100;
    }
    const orderCount = stat.orderIds.size;
    return {
      productId: stat.productId,
      name: stat.name,
      category: stat.category,
      totalQuantity: stat.totalQuantity,
      totalRevenue: Number(stat.totalRevenue.toFixed(2)),
      avgUnitPrice:
        stat.totalQuantity > 0 ? Number((stat.totalRevenue / stat.totalQuantity).toFixed(2)) : 0,
      orderCount,
      trend,
      trendPercent,
    };
  });

  arr.sort((a, b) =>
    metric === "revenue" ? b.totalRevenue - a.totalRevenue : b.totalQuantity - a.totalQuantity
  );
  return arr.slice(0, limit);
}

export async function getTimePatterns(opts: { from: Date; to: Date }) {
  const businessId = getCurrentBusinessId();
  const fromDate = startOfDay(opts.from);
  const toDate = endOfDay(opts.to);

  const sales = await prisma.sale.findMany({
    where: { businessId, deletedAt: null, date: { gte: fromDate, lte: toDate } },
    select: { date: true, totalAmount: true },
  });

  const hourly = new Array(24).fill(0).map((_, i) => ({ hour: i, orders: 0, revenue: 0 }));
  const weekly = DAYS_OF_WEEK.map((day) => ({ day, orders: 0, revenue: 0 }));
  const monthlyMap = new Map<string, { orders: number; revenue: number }>();

  for (const s of sales) {
    const amount = toNumber(s.totalAmount);
    const h = s.date.getUTCHours();
    hourly[h].orders += 1;
    hourly[h].revenue += amount;
    const dow = s.date.getUTCDay();
    weekly[dow].orders += 1;
    weekly[dow].revenue += amount;
    const mk = monthKey(s.date);
    const me = monthlyMap.get(mk) ?? { orders: 0, revenue: 0 };
    me.orders += 1;
    me.revenue += amount;
    monthlyMap.set(mk, me);
  }

  hourly.forEach((h) => (h.revenue = Number(h.revenue.toFixed(2))));
  weekly.forEach((w) => (w.revenue = Number(w.revenue.toFixed(2))));

  const total = sales.length;
  let peakHour = "—";
  let peakHourPercent = 0;
  if (total > 0) {
    const max = Math.max(...hourly.map((h) => h.orders));
    const idx = hourly.findIndex((h) => h.orders === max);
    peakHour = formatHourRange(idx);
    peakHourPercent = (max / total) * 100;
  }

  let peakDay = "—";
  if (total > 0) {
    const max = Math.max(...weekly.map((w) => w.orders));
    peakDay = weekly.find((w) => w.orders === max)?.day ?? "—";
  }

  let peakMonth = "—";
  let peakMonthRevenue = 0;
  for (const [k, v] of monthlyMap) {
    if (v.revenue > peakMonthRevenue) {
      peakMonthRevenue = v.revenue;
      const [y, m] = k.split("-").map((x) => Number(x));
      peakMonth = `${MONTHS[m - 1]} ${y}`;
    }
  }

  const monthlyData = [...monthlyMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, v]) => ({
      month,
      orders: v.orders,
      revenue: Number(v.revenue.toFixed(2)),
    }));

  return {
    peakHour,
    peakHourPercent: Number(peakHourPercent.toFixed(2)),
    peakDay,
    peakMonth,
    hourlyData: hourly,
    weeklyData: weekly,
    monthlyData,
  };
}

export async function getInventoryInsights() {
  const businessId = getCurrentBusinessId();
  const thirtyDaysAgo = daysAgo(30);

  const [products, recentSales] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null, businessId },
      include: { stock: true, category: { select: { name: true } } },
    }),
    prisma.sale.findMany({
      where: { businessId, deletedAt: null, date: { gte: thirtyDaysAgo } },
      select: { productId: true, quantity: true, date: true },
    }),
  ]);

  const salesByProduct = new Map<number, { qty: number; lastSale: Date | null }>();
  for (const s of recentSales) {
    if (!s.productId) continue;
    const e = salesByProduct.get(s.productId) ?? { qty: 0, lastSale: null };
    e.qty += s.quantity;
    if (!e.lastSale || s.date > e.lastSale) e.lastSale = s.date;
    salesByProduct.set(s.productId, e);
  }

  const decorate = (p: (typeof products)[number]) => ({
    productId: p.productId,
    name: p.name,
    category: p.category?.name ?? null,
    stock: p.stock?.quantity ?? 0,
    threshold: p.stock?.threshold ?? 10,
    sold30d: salesByProduct.get(p.id)?.qty ?? 0,
    lastSold: salesByProduct.get(p.id)?.lastSale?.toISOString() ?? null,
  });

  const slowMoving = products
    .filter((p) => {
      const qty = p.stock?.quantity ?? 0;
      const sold = salesByProduct.get(p.id)?.qty ?? 0;
      return qty > 10 && sold < 2;
    })
    .map(decorate)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 50);

  const fastMoving = products
    .filter((p) => (salesByProduct.get(p.id)?.qty ?? 0) > 10)
    .map(decorate)
    .sort((a, b) => b.sold30d - a.sold30d)
    .slice(0, 50);

  const overstocked = products
    .filter((p) => {
      const qty = p.stock?.quantity ?? 0;
      const sold = salesByProduct.get(p.id)?.qty ?? 0;
      if (sold === 0) return qty > 30;
      return qty > sold * 3;
    })
    .map(decorate)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 50);

  const understocked = products
    .filter((p) => {
      const qty = p.stock?.quantity ?? 0;
      const sold = salesByProduct.get(p.id)?.qty ?? 0;
      if (sold === 0) return false;
      const dailyRate = sold / 30;
      const daysLeft = dailyRate > 0 ? qty / dailyRate : Infinity;
      return daysLeft < 7;
    })
    .map(decorate)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 50);

  type ReorderSuggestion = {
    productId: string;
    name: string;
    category: string | null;
    currentStock: number;
    dailySalesRate: number;
    daysLeft: number;
    suggestedOrderQty: number;
  };
  const reorderSuggestions: ReorderSuggestion[] = [];
  for (const p of products) {
    const qty = p.stock?.quantity ?? 0;
    const sold = salesByProduct.get(p.id)?.qty ?? 0;
    if (sold === 0) continue;
    const dailyRate = sold / 30;
    if (dailyRate <= 0) continue;
    const daysLeft = qty / dailyRate;
    if (daysLeft >= 21) continue;
    const target = Math.ceil(dailyRate * 30);
    const suggestedOrderQty = Math.max(target - qty, Math.ceil(dailyRate * 14));
    reorderSuggestions.push({
      productId: p.productId,
      name: p.name,
      category: p.category?.name ?? null,
      currentStock: qty,
      dailySalesRate: Number(dailyRate.toFixed(2)),
      daysLeft: Number(daysLeft.toFixed(1)),
      suggestedOrderQty,
    });
  }
  reorderSuggestions.sort((a, b) => a.daysLeft - b.daysLeft);
  reorderSuggestions.splice(50);

  return { slowMoving, fastMoving, overstocked, understocked, reorderSuggestions };
}

export async function getRevenueTrend(opts: { from: Date; to: Date }) {
  const businessId = getCurrentBusinessId();
  const fromDate = startOfDay(opts.from);
  const toDate = endOfDay(opts.to);
  const periodMs = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - periodMs);

  const [currentSales, prevSales] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId, deletedAt: null, date: { gte: fromDate, lte: toDate } },
      select: { date: true, totalAmount: true },
    }),
    prisma.sale.findMany({
      where: { businessId, deletedAt: null, date: { gte: prevFrom, lte: prevTo } },
      select: { totalAmount: true },
    }),
  ]);

  const currentRevenue = currentSales.reduce((sum, s) => sum + toNumber(s.totalAmount), 0);
  const prevRevenue = prevSales.reduce((sum, s) => sum + toNumber(s.totalAmount), 0);
  const currentOrders = currentSales.length;
  const prevOrders = prevSales.length;
  const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0;
  const prevAOV = prevOrders > 0 ? prevRevenue / prevOrders : 0;

  const trendMap = new Map<string, { revenue: number; orders: number }>();
  for (const s of currentSales) {
    const k = dateKey(s.date);
    const e = trendMap.get(k) ?? { revenue: 0, orders: 0 };
    e.revenue += toNumber(s.totalAmount);
    e.orders += 1;
    trendMap.set(k, e);
  }

  const trend = [...trendMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, revenue: Number(v.revenue.toFixed(2)), orders: v.orders }));

  return {
    current: {
      revenue: Number(currentRevenue.toFixed(2)),
      orders: currentOrders,
      avgOrderValue: Number(currentAOV.toFixed(2)),
    },
    previous: {
      revenue: Number(prevRevenue.toFixed(2)),
      orders: prevOrders,
      avgOrderValue: Number(prevAOV.toFixed(2)),
    },
    growth: {
      revenuePercent:
        prevRevenue > 0 ? Number((((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(2)) : 0,
      ordersPercent:
        prevOrders > 0 ? Number((((currentOrders - prevOrders) / prevOrders) * 100).toFixed(2)) : 0,
    },
    trend,
  };
}

export async function getMonthlyTrend() {
  const businessId = getCurrentBusinessId();
  const start = new Date();
  start.setUTCMonth(start.getUTCMonth() - 11);
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  const sales = await prisma.sale.findMany({
    where: { businessId, deletedAt: null, date: { gte: start } },
    select: { date: true, totalAmount: true },
  });

  const map = new Map<string, { orders: number; revenue: number }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setUTCMonth(start.getUTCMonth() + i);
    map.set(monthKey(d), { orders: 0, revenue: 0 });
  }
  for (const s of sales) {
    const k = monthKey(s.date);
    const e = map.get(k);
    if (!e) continue;
    e.orders += 1;
    e.revenue += toNumber(s.totalAmount);
  }

  const months = [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, v]) => {
      const [y, m] = month.split("-").map((x) => Number(x));
      return {
        month,
        label: `${MONTHS[m - 1].slice(0, 3)} ${String(y).slice(2)}`,
        orders: v.orders,
        revenue: Number(v.revenue.toFixed(2)),
        avgOrderValue: v.orders > 0 ? Number((v.revenue / v.orders).toFixed(2)) : 0,
      };
    });

  const withGrowth = months.map((m, i) => {
    if (i === 0) return { ...m, growthPercent: 0 };
    const prev = months[i - 1];
    const growth = prev.revenue > 0 ? ((m.revenue - prev.revenue) / prev.revenue) * 100 : 0;
    return { ...m, growthPercent: Number(growth.toFixed(2)) };
  });

  return { months: withGrowth };
}

export async function getTopCustomers(opts: { from: Date; to: Date; limit?: number }) {
  const businessId = getCurrentBusinessId();
  const limit = opts.limit ?? 10;
  const fromDate = startOfDay(opts.from);
  const toDate = endOfDay(opts.to);

  const sales = await prisma.sale.findMany({
    where: { businessId, deletedAt: null, date: { gte: fromDate, lte: toDate } },
    include: { customer: { select: { id: true, customerId: true, name: true, mobile: true } } },
  });

  const map = new Map<
    number,
    { customerId: string; name: string; mobile: string; revenue: number; orders: number }
  >();
  for (const s of sales) {
    if (!s.customer) continue;
    const entry =
      map.get(s.customer.id) ?? {
        customerId: s.customer.customerId,
        name: s.customer.name,
        mobile: s.customer.mobile,
        revenue: 0,
        orders: 0,
      };
    entry.revenue += toNumber(s.totalAmount);
    entry.orders += 1;
    map.set(s.customer.id, entry);
  }

  return [...map.values()]
    .map((c) => ({ ...c, revenue: Number(c.revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
