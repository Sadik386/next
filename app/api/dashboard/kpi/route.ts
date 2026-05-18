import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { runWithBusinessContext } from "@/lib/business-context";
import { endOfDay, parseDateRangeFromSearchParams } from "@/lib/date-filter";

function getPreviousRange(from: Date, to: Date) {
  const diff = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - diff);
  return { from: prevFrom, to: prevTo };
}

function calcChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function trend(current: number, previous: number) {
  return current > previous ? "up" : current < previous ? "down" : "stable";
}

function metric(current: number, previous: number) {
  return {
    value: current,
    percentChange: calcChange(current, previous),
    trend: trend(current, previous),
  };
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && "toString" in value) return Number(value.toString()) || 0;
  return 0;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const range = parseDateRangeFromSearchParams(sp, { defaultPreset: "this_month" });
  const from = range.startDate ?? new Date(0);
  const to = range.endDate ?? endOfDay(new Date());

  return runWithBusinessContext(user, async () => {
    const businessId = user.businessId;
    const prevRange = getPreviousRange(from, to);
    const currentDate = { gte: from, lte: to };
    const previousDate = { gte: prevRange.from, lte: prevRange.to };

    const [
      currentSales,
      previousSales,
      currentExpenses,
      previousExpenses,
      currentOrders,
      previousOrders,
      currentCustomers,
      previousCustomers,
      currentUnpaidOrders,
      previousUnpaidOrders,
      stockRows,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { businessId, deletedAt: null, date: currentDate },
        _sum: { totalAmount: true },
      }),
      prisma.sale.aggregate({
        where: { businessId, deletedAt: null, date: previousDate },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { businessId, deletedAt: null, date: currentDate },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { businessId, deletedAt: null, date: previousDate },
        _sum: { amount: true },
      }),
      prisma.order.count({
        where: { businessId, deletedAt: null, createdAt: currentDate },
      }),
      prisma.order.count({
        where: { businessId, deletedAt: null, createdAt: previousDate },
      }),
      prisma.customer.count({
        where: { businessId, deletedAt: null, createdAt: currentDate },
      }),
      prisma.customer.count({
        where: { businessId, deletedAt: null, createdAt: previousDate },
      }),
      prisma.order.count({
        where: { businessId, deletedAt: null, paymentStatus: { not: "paid" }, createdAt: currentDate },
      }),
      prisma.order.count({
        where: { businessId, deletedAt: null, paymentStatus: { not: "paid" }, createdAt: previousDate },
      }),
      prisma.stock.findMany({
        where: { businessId, product: { deletedAt: null } },
        select: { quantity: true, threshold: true },
      }),
    ]);

    const totalRevenue = toNumber(currentSales._sum.totalAmount);
    const previousRevenue = toNumber(previousSales._sum.totalAmount);
    const totalExpenses = toNumber(currentExpenses._sum.amount);
    const previousTotalExpenses = toNumber(previousExpenses._sum.amount);
    const netProfit = totalRevenue - totalExpenses;
    const previousNetProfit = previousRevenue - previousTotalExpenses;
    const lowStock = stockRows.filter((stock) => stock.quantity <= stock.threshold).length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [activeUsersToday, recentLogins24h] =
      user.role === "super_admin"
        ? await Promise.all([
            prisma.activityLog.groupBy({
              by: ["userId"],
              where: { businessId, action: "login", createdAt: { gte: todayStart } },
            }),
            prisma.activityLog.count({
              where: {
                businessId,
                action: "login",
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              },
            }),
          ])
        : [null, 0];

    const result: any = {
      totalSales: metric(totalRevenue, previousRevenue),
      totalRevenue: metric(totalRevenue, previousRevenue),
      totalExpenses: metric(totalExpenses, previousTotalExpenses),
      netProfit: metric(netProfit, previousNetProfit),
      totalProfit: metric(netProfit, previousNetProfit),
      totalOrders: metric(currentOrders, previousOrders),
      totalCustomers: metric(currentCustomers, previousCustomers),
      lowStock: {
        value: lowStock,
        percentChange: 0,
        trend: "stable",
      },
      unpaidOrders: metric(currentUnpaidOrders, previousUnpaidOrders),
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
        label: range.preset,
      },
    };

    if (user.role === "super_admin") {
      result.superAdmin = {
        activeUsersToday: activeUsersToday?.length || 0,
        recentLogins24h,
      };
    }

    return NextResponse.json(result);
  });
}
