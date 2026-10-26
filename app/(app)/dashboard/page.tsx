"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Tag,
  Receipt,
  CreditCard,
  Building2,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Package,
  ArrowRight,
} from "lucide-react";
import { MOCK_ORDERS, MOCK_PRODUCTS } from "@/data/mockData";

interface MonthData {
  month: string;
  target: number;
  sales: number;
  purchases: number;
}

const MONTH_DATA: MonthData[] = [
  { month: "Feb", target: 6200, sales: 4100, purchases: 3000 },
  { month: "Mar", target: 5500, sales: 5000, purchases: 2800 },
  { month: "Apr", target: 3400, sales: 2200, purchases: 1200 },
  { month: "May", target: 5100, sales: 4100, purchases: 2000 },
  { month: "Jun", target: 4600, sales: 1800, purchases: 2400 },
  { month: "Jul", target: 4200, sales: 3600, purchases: 3900 },
];

export default function DashboardPage() {
  const [selectedRange, setSelectedRange] = useState("6 Months");
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);
  const [selectedInvoiceFilter, setSelectedInvoiceFilter] = useState("Sales Invoice");
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);

  // SVG Chart Dimensions
  const chartHeight = 220;
  const maxVal = 7000;

  const getY = (val: number) => {
    return chartHeight - (val / maxVal) * chartHeight;
  };

  const getBarHeight = (val: number) => {
    return (val / maxVal) * chartHeight;
  };

  return (
    <div className="space-y-6 pb-12 pt-1">
      {/* Top Header - NextGen Cloud POS */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#1E1E2D] tracking-tight">
          Dashboard Overview
        </h1>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Sales */}
        <div className="bg-white rounded-[26px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-[#9D7BFA] to-[#B692FE] flex items-center justify-center text-white shadow-xs">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div className="text-[13px] font-medium text-[#7D7D93] mt-4">
            Total Sales
          </div>
          <div className="text-2xl md:text-[28px] font-extrabold text-[#191926] tracking-tight mt-1 font-heading">
            $12,345
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#00BCD4]">
            <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>20% Than Last Month</span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-[26px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-[#519BFB] to-[#71ADFD] flex items-center justify-center text-white shadow-xs">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div className="text-[13px] font-medium text-[#7D7D93] mt-4">
            Total Expense
          </div>
          <div className="text-2xl md:text-[28px] font-extrabold text-[#191926] tracking-tight mt-1 font-heading">
            $3,213
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#00BCD4]">
            <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>8% Than Last Month</span>
          </div>
        </div>

        {/* Payment Sent */}
        <div className="bg-white rounded-[26px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-[#1EBAF7] to-[#47CCFD] flex items-center justify-center text-white shadow-xs">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="text-[13px] font-medium text-[#7D7D93] mt-4">
            Payment Sent
          </div>
          <div className="text-2xl md:text-[28px] font-extrabold text-[#191926] tracking-tight mt-1 font-heading">
            $65,920
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#00BCD4]">
            <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>32% Than Last Month</span>
          </div>
        </div>

        {/* Payment Received */}
        <div className="bg-white rounded-[26px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-[#86CE15] to-[#A2DC35] flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-[13px] font-medium text-[#7D7D93] mt-4">
            Payment Received
          </div>
          <div className="text-2xl md:text-[28px] font-extrabold text-[#191926] tracking-tight mt-1 font-heading">
            $72,450
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#FF5A5F]">
            <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>3% Than Last Month</span>
          </div>
        </div>
      </div>

      {/* Row 2: Sales & Purchases + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Sales & Purchases Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-[26px] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-6">
              <h2 className="font-heading font-bold text-lg md:text-[19px] text-[#191926]">
                Sales &amp; Purchases
              </h2>

              {/* Time Range Filter Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                  className="px-4 py-1.5 bg-[#F4F5F9] hover:bg-[#EBECEF] text-[#55556E] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{selectedRange}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7E7E94]" />
                </button>

                {showRangeDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-zinc-100 py-1.5 z-20">
                    {["30 Days", "6 Months", "1 Year"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSelectedRange(opt);
                          setShowRangeDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs font-medium hover:bg-zinc-50 ${
                          selectedRange === opt ? "text-purple-600 font-semibold" : "text-zinc-600"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SVG Visual Chart */}
            <div className="relative w-full overflow-hidden select-none">
              {hoveredMonth && (
                <div className="absolute top-1 right-4 bg-[#191926] text-white text-xs rounded-xl px-3 py-2 shadow-lg z-10 flex items-center gap-3">
                  <span className="font-bold">{hoveredMonth.month}</span>
                  <span className="text-[#FF7F73]">Sales: ${hoveredMonth.sales}</span>
                  <span className="text-[#A78BFA]">Purchases: ${hoveredMonth.purchases}</span>
                  <span className="text-zinc-300">Target: ${hoveredMonth.target}</span>
                </div>
              )}

              <svg
                viewBox="0 0 680 270"
                className="w-full h-[270px] overflow-visible"
              >
                <defs>
                  {/* Sales Gradient - Coral Red */}
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B6B" />
                    <stop offset="100%" stopColor="#FF8E8E" />
                  </linearGradient>

                  {/* Purchases Gradient - Violet/Purple */}
                  <linearGradient id="purchasesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#A78BFA" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Labels and Horizontal Grid Lines */}
                {[7, 6, 5, 4, 3, 2, 1].map((k) => {
                  const y = getY(k * 1000);
                  return (
                    <g key={k}>
                      <text
                        x="20"
                        y={y + 4}
                        fill="#A5A5BA"
                        fontSize="11"
                        fontFamily="inherit"
                        textAnchor="end"
                      >
                        {k}k
                      </text>
                      <line
                        x1="35"
                        y1={y}
                        x2="670"
                        y2={y}
                        stroke="#F0F1F7"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}

                {/* Month Column Bars */}
                {MONTH_DATA.map((d, index) => {
                  const colSpacing = 100;
                  const startX = 85;
                  const colCenter = startX + index * colSpacing;

                  // Target ghost bar behind
                  const targetH = getBarHeight(d.target);
                  const targetY = getY(d.target);

                  // Sales front bar inside target bar
                  const salesH = getBarHeight(d.sales);
                  const salesY = getY(d.sales);

                  // Purchases front bar beside target bar
                  const purchasesH = getBarHeight(d.purchases);
                  const purchasesY = getY(d.purchases);

                  return (
                    <g
                      key={d.month}
                      onMouseEnter={() => setHoveredMonth(d)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      className="cursor-pointer group"
                    >
                      {/* Invisible hover trigger area */}
                      <rect
                        x={colCenter - 30}
                        y="0"
                        width="70"
                        height={chartHeight + 20}
                        fill="transparent"
                      />

                      {/* 1. Target Ghost Bar Backdrop */}
                      <rect
                        x={colCenter - 26}
                        y={targetY}
                        width="22"
                        height={targetH}
                        rx="11"
                        ry="11"
                        fill="#EAEBF4"
                        className="transition-opacity group-hover:opacity-80"
                      />

                      {/* 2. Sales Bar Filling Up The Target Capsule */}
                      <rect
                        x={colCenter - 26}
                        y={salesY}
                        width="22"
                        height={salesH}
                        rx="11"
                        ry="11"
                        fill="url(#salesGrad)"
                        className="transition-transform duration-200 group-hover:scale-y-[1.02] origin-bottom"
                      />

                      {/* 3. Purchases Bar (Violet/Purple Gradient Capsule) */}
                      <rect
                        x={colCenter + 4}
                        y={purchasesY}
                        width="22"
                        height={purchasesH}
                        rx="11"
                        ry="11"
                        fill="url(#purchasesGrad)"
                        className="transition-transform duration-200 group-hover:scale-y-[1.02] origin-bottom"
                      />

                      {/* X-Axis Month Label */}
                      <text
                        x={colCenter}
                        y={chartHeight + 25}
                        fill="#7D7D93"
                        fontSize="12"
                        fontWeight="500"
                        fontFamily="inherit"
                        textAnchor="middle"
                      >
                        {d.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Bottom Chart Legend */}
          <div className="flex items-center justify-center gap-7 pt-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-2.5 rounded-full bg-[#EAEBF4]"></span>
              <span className="text-xs font-medium text-[#7D7D93]">Sales Target</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-2.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E]"></span>
              <span className="text-xs font-medium text-[#7D7D93]">Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]"></span>
              <span className="text-xs font-medium text-[#7D7D93]">Purchases</span>
            </div>
          </div>
        </div>

        {/* Right: Devices Donut/Pie Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-[26px] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg md:text-[19px] text-[#191926] pb-2">
              Devices
            </h2>

            {/* Circular Pie Chart */}
            <div className="flex items-center justify-center py-4 select-none">
              <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-xs">
                {/* 40% Lime Green slice (Start -90deg to 54deg) */}
                <path
                  d="M 100 100 L 100 15 A 85 85 0 0 1 180 126 Z"
                  fill="#84CC16"
                  className="transition-transform duration-200 hover:scale-105 origin-center cursor-pointer"
                />

                {/* 30% Coral Red slice (54deg to 162deg) */}
                <path
                  d="M 100 100 L 180 126 A 85 85 0 0 1 49 168 Z"
                  fill="#FF5A5F"
                  className="transition-transform duration-200 hover:scale-105 origin-center cursor-pointer"
                />

                {/* 20% Purple slice (162deg to 234deg) */}
                <path
                  d="M 100 100 L 49 168 A 85 85 0 0 1 20 85 Z"
                  fill="#9333EA"
                  className="transition-transform duration-200 hover:scale-105 origin-center cursor-pointer"
                />

                {/* 10% Cyan slice (234deg to 270deg) */}
                <path
                  d="M 100 100 L 20 85 A 85 85 0 0 1 100 15 Z"
                  fill="#00BCD4"
                  className="transition-transform duration-200 hover:scale-105 origin-center cursor-pointer"
                />

                {/* "40%" Text inside Green Segment */}
                <text
                  x="126"
                  y="72"
                  fill="#FFFFFF"
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="inherit"
                  textAnchor="middle"
                >
                  40%
                </text>
              </svg>
            </div>
          </div>

          {/* Bottom Device Legend */}
          <div className="flex items-center justify-center gap-5 pt-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-2 rounded-full bg-[#FF5A5F]"></span>
              <span className="text-xs font-medium text-[#7D7D93]">iOS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-2 rounded-full bg-[#9333EA]"></span>
              <span className="text-xs font-medium text-[#7D7D93]">Mac</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-2 rounded-full bg-[#00BCD4]"></span>
              <span className="text-xs font-medium text-[#7D7D93]">Tesla Model</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Invoice + Stock History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Recent Invoice (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-[26px] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-2">
            <h2 className="font-heading font-bold text-lg md:text-[19px] text-[#191926]">
              Recent Invoice
            </h2>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowInvoiceDropdown(!showInvoiceDropdown)}
                className="px-4 py-1.5 bg-[#F4F5F9] hover:bg-[#EBECEF] text-[#55556E] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{selectedInvoiceFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#7E7E94]" />
              </button>

              {showInvoiceDropdown && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-zinc-100 py-1.5 z-20">
                  {["Sales Invoice", "All Invoices", "Pending"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSelectedInvoiceFilter(opt);
                        setShowInvoiceDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs font-medium hover:bg-zinc-50 text-zinc-600"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Invoices List / Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F1F7] text-[#8E8EA8] text-xs">
                  <th className="pb-3 font-semibold">Invoice No</th>
                  <th className="pb-3 px-3 font-semibold">Customer</th>
                  <th className="pb-3 px-3 font-semibold">Date</th>
                  <th className="pb-3 px-3 font-semibold">Method</th>
                  <th className="pb-3 px-3 font-semibold text-right">Amount</th>
                  <th className="pb-3 pl-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F5F9]">
                {MOCK_ORDERS.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 font-bold text-[#191926]">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {order.customerName.charAt(0)}
                        </div>
                        <span className="font-medium text-[#2B2B3D] truncate max-w-[130px]">
                          {order.customerName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-[#7D7D93]">
                      {order.date}
                    </td>
                    <td className="py-3.5 px-3 text-[#7D7D93]">
                      {order.paymentMethod}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#191926]">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Stock History (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-[26px] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-2">
            <h2 className="font-heading font-bold text-lg md:text-[19px] text-[#191926]">
              Stock History
            </h2>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
            >
              <span>See All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {MOCK_PRODUCTS.slice(0, 5).map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FC] hover:bg-[#F2F4F9] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-xs text-[#191926] truncate">
                      {prod.name}
                    </div>
                    <div className="text-[11px] text-[#8E8EA8] mt-0.5">
                      SKU: {prod.sku}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[#191926]">
                    {prod.stock} {prod.unit}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-600">
                    In Stock
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
