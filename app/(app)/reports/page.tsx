"use client";

import React, { useState } from "react";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  FileSpreadsheet,
  Printer,
  PieChart,
  ArrowUpRight,
} from "lucide-react";

export default function ReportsPage() {
  const [period, setPeriod] = useState<"This Month" | "Last Quarter" | "Year to Date">("This Month");

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-slate-900">
            Financial Statements &amp; Profit Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Automated Profit &amp; Loss (P&amp;L), COGS calculations, tax deduction ledger, and expense allocation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs focus:outline-none"
          >
            <option value="This Month">Current Month (August 2026)</option>
            <option value="Last Quarter">Q2 2026 (Apr - Jun)</option>
            <option value="Year to Date">FY 2026 Year-to-Date</option>
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* P&L Main Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            1. Total Gross Sales
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
            $124,590.00
          </div>
          <div className="text-xs text-emerald-600 font-semibold">+14.2% Growth</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            2. Cost of Goods (COGS)
          </div>
          <div className="font-heading font-extrabold text-2xl text-slate-700 mb-1">
            -$62,100.00
          </div>
          <div className="text-xs text-slate-500">49.8% Cost Ratio</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            3. Operating Overheads
          </div>
          <div className="font-heading font-extrabold text-2xl text-rose-600 mb-1">
            -$14,270.00
          </div>
          <div className="text-xs text-slate-500">Rent, Utilities, Gateway Fees</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md">
          <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
            4. Net Profit Realized
          </div>
          <div className="font-heading font-extrabold text-2xl text-white mb-1">
            +$48,220.00
          </div>
          <div className="text-xs text-emerald-400 font-semibold">38.7% Net Margin</div>
        </div>
      </div>

      {/* Financial Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Obligations Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            Tax Ledger &amp; Collections
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="font-bold text-slate-900">State / Provincial Sales Tax (5.0%)</div>
                <div className="text-slate-500 text-[11px]">Direct in-store retail checkout collections</div>
              </div>
              <span className="font-mono font-bold text-slate-900">$6,229.50</span>
            </div>

            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="font-bold text-slate-900">National VAT / GST (3.0%)</div>
                <div className="text-slate-500 text-[11px]">Applied to luxury &amp; tech categories</div>
              </div>
              <span className="font-mono font-bold text-slate-900">$3,737.70</span>
            </div>

            <div className="flex justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl font-semibold">
              <span className="text-indigo-900">Total Tax Remittance Due:</span>
              <span className="font-mono font-bold text-indigo-700">$9,967.20</span>
            </div>
          </div>
        </div>

        {/* Operating Expense Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            Operating Expenses Breakdown
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-700 font-semibold mb-1">
                <span>Warehouse Freight &amp; Logistics</span>
                <span>$5,800.00 (40.6%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "40.6%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-semibold mb-1">
                <span>Retail Property Leases &amp; Power</span>
                <span>$4,500.00 (31.5%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: "31.5%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-semibold mb-1">
                <span>Payment Gateway Processing (Stripe/Card)</span>
                <span>$3,970.00 (27.9%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: "27.9%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
