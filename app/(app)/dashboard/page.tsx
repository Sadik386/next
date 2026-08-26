"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Download,
  Plus,
  RefreshCw,
  Clock,
  ChevronRight,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { MOCK_ORDERS, MOCK_PRODUCTS, MOCK_AI_RECOMMENDATIONS } from "@/data/mockData";

export default function DashboardPage() {
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "12M">("7D");

  const lowStockItems = MOCK_PRODUCTS.filter((p) => p.status === "Low Stock" || p.status === "Out of Stock");

  return (
    <div className="space-y-6">
      {/* Top Banner with AI Intelligence Highlight */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI Predictive Autonomous Engine</span>
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight">
            Downtown Flagship Performance is +18.4% ahead of schedule
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl">
            Neural forecasting suggests increasing reorder quantities for Arabica Roasts &amp; ANC Pro Headphones ahead of the weekend demand surge.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <Link
            href="/intelligence"
            className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            Review AI Alerts
          </Link>
          <Link
            href="/pos"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>Launch POS</span>
          </Link>
        </div>
      </div>

      {/* 4 Main Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
            $124,590.00
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2%</span>
            <span className="text-slate-400 font-normal">vs last week</span>
          </div>
        </div>

        {/* Net Profit Margin */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Profit</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
            $48,220.00
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">
              38.7% Margin
            </span>
            <span className="text-slate-400 font-normal">healthy</span>
          </div>
        </div>

        {/* Orders Invoiced */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
            1,482
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8.4%</span>
            <span className="text-slate-400 font-normal">99.2% fulfillment</span>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
            {lowStockItems.length} SKUs
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Attention needed</span>
            <Link href="/inventory" className="text-indigo-600 hover:underline ml-auto text-[11px]">
              Resolve →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Revenue &amp; Velocity Trends
              </h3>
              <p className="text-xs text-slate-500">
                Aggregated daily transactions across in-store POS, mobile, and wholesale channels.
              </p>
            </div>
            <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeframe("7D")}
                className={`px-3 py-1 rounded-md transition-all ${
                  timeframe === "7D" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500"
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("30D")}
                className={`px-3 py-1 rounded-md transition-all ${
                  timeframe === "30D" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500"
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("12M")}
                className={`px-3 py-1 rounded-md transition-all ${
                  timeframe === "12M" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500"
                }`}
              >
                12 Months
              </button>
            </div>
          </div>

          {/* Bar Chart Mock Representation */}
          <div className="h-64 flex items-end justify-between gap-2 pt-6 px-2">
            {[
              { day: "Mon", rev: 14200, height: "60%" },
              { day: "Tue", rev: 16800, height: "70%" },
              { day: "Wed", rev: 12400, height: "50%" },
              { day: "Thu", rev: 19500, height: "82%" },
              { day: "Fri", rev: 23400, height: "96%" },
              { day: "Sat", rev: 21200, height: "88%" },
              { day: "Sun", rev: 17090, height: "72%" },
            ].map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 rounded-xl relative overflow-hidden flex items-end h-48">
                  <div
                    style={{ height: bar.height }}
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-xl group-hover:from-indigo-700 group-hover:to-indigo-600 transition-all"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900">
                  {bar.day}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ${(bar.rev / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Share & Live Channel Mix */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900 mb-1">
              Category Performance
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Revenue distribution by department
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Consumer Electronics</span>
                  <span>48.2% ($60,050)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "48.2%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Groceries &amp; Beverage</span>
                  <span>28.4% ($35,380)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "28.4%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Accessories &amp; Peripherals</span>
                  <span>23.4% ($29,160)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: "23.4%" }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="font-semibold text-slate-900 mb-1">POS Peak Activity</div>
            <div className="text-slate-500">
              Highest throughput detected between <strong>12:00 PM – 14:30 PM</strong> daily.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              Recent Sales &amp; Invoices
            </h3>
            <p className="text-xs text-slate-500">
              Latest transactions processed across all registers
            </p>
          </div>
          <Link
            href="/orders"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View all orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Order / Invoice</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Channel</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_ORDERS.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                    {order.orderNumber}
                    <div className="text-[10px] text-slate-400 font-sans">{order.time}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {order.channel}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        order.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : order.paymentStatus === "Partially Paid"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-heading font-bold text-slate-900">
                    ${order.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
