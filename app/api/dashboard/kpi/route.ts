import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

function getPresetRange(preset: string) {
  const now = new Date();
  let from: Date, to: Date = now;
  
  switch (preset) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "yesterday":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      break;
    case "week":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case "lifetime":
    default:
      from = new Date(0);
      break;
  }
  
  return { from, to };
}

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

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const preset = sp.get("preset") || "month";
  const fromParam = sp.get("from");
  const toParam = sp.get("to");

  let from: Date, to: Date;

  if (fromParam && toParam) {
    from = new Date(fromParam);
    to = new Date(toParam);
  } else {
    const range = getPresetRange(preset);
    from = range.from;
    to = range.to;
  }

  const prevRange = getPreviousRange(from, to);

  const [currentSales, prevSales, currentOrders, prevOrders, currentProfit, prevProfit, currentCustomers, prevCustomers] = await Promise.all([
    prisma.sale.aggregate({
      where: { businessId: 1, createdAt: { gte: from, lte: to } },
      _sum: { totalAmount: true },
    }),
    prisma.sale.aggregate({
      where: { businessId: 1, createdAt: { gte: prevRange.from, lte: prevRange.to } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: { businessId: 1, createdAt: { gte: from, lte: to } },
    }),
    prisma.order.count({
      where: { businessId: 1, createdAt: { gte: prevRange.from, lte: prevRange.to } },
    }),
    prisma.sale.aggregate({
      where: { businessId: 1, createdAt: { gte: from, lte: to } },
      _sum: { salesCommission: true },
    }),
    prisma.sale.aggregate({
      where: { businessId: 1, createdAt: { gte: prevRange.from, lte: prevRange.to } },
      _sum: { salesCommission: true },
    }),
    prisma.customer.count({
      where: { businessId: 1, createdAt: { gte: from, lte: to }, deletedAt: null },
    }),
    prisma.customer.count({
      where: { businessId: 1, createdAt: { gte: prevRange.from, lte: prevRange.to }, deletedAt: null },
    }),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [activeUsersToday, recentLogins24h] = user.role === "super_admin" ? await Promise.all([
    prisma.activityLog.groupBy({
      by: ["userId"],
      where: { businessId: 1, action: "login", createdAt: { gte: todayStart } },
    }),
    prisma.activityLog.count({
      where: { businessId: 1, action: "login", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]) : [null, 0];

  const totalSales = Number(currentSales._sum.totalAmount || 0) / 100;
  const prevTotalSales = Number(prevSales._sum.totalAmount || 0) / 100;
  const totalProfit = Number(currentProfit._sum.salesCommission || 0) / 100;
  const prevTotalProfit = Number(prevProfit._sum.salesCommission || 0) / 100;

  const result: any = {
    totalSales: {
      value: totalSales,
      percentChange: calcChange(totalSales, prevTotalSales),
      trend: totalSales > prevTotalSales ? "up" : totalSales < prevTotalSales ? "down" : "stable",
    },
    totalProfit: {
      value: totalProfit,
      percentChange: calcChange(totalProfit, prevTotalProfit),
      trend: totalProfit > prevTotalProfit ? "up" : totalProfit < prevTotalProfit ? "down" : "stable",
    },
    totalOrders: {
      value: currentOrders,
      percentChange: calcChange(currentOrders, prevOrders),
      trend: currentOrders > prevOrders ? "up" : currentOrders < prevOrders ? "down" : "stable",
    },
    totalCustomers: {
      value: currentCustomers,
      percentChange: calcChange(currentCustomers, prevCustomers),
      trend: currentCustomers > prevCustomers ? "up" : currentCustomers < prevCustomers ? "down" : "stable",
    },
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
      label: preset,
    },
  };

  if (user.role === "super_admin") {
    result.superAdmin = {
      activeUsersToday: activeUsersToday?.length || 0,
      recentLogins24h,
    };
  }

  return NextResponse.json(result);
}