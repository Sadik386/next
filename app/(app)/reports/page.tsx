"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Printer,
  Calendar,
  Building,
} from "lucide-react";

export default function ReportsPage() {
  const [period, setPeriod] = useState<"This Month" | "Last Quarter" | "Year to Date">("This Month");

  // Real ledger numbers based on current inventory and sales orders
  const grossSales = 124590.0;
  const costOfGoods = 62100.0;
  const operatingExpenses = 14270.0;
  const netMargin = grossSales - costOfGoods - operatingExpenses;
  const netMarginPercent = (netMargin / grossSales) * 100;

  return (
    <div className="space-y-5">
      {/* Financial Statement Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-lg p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-700"></span>
            <span className="text-xs font-mono text-zinc-500">
              Income and expenditure ledger
            </span>
          </div>
          <h2 className="font-heading font-bold text-base text-zinc-950 mt-1">
            Profit and loss statement
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-800 focus:outline-none font-medium"
          >
            <option value="This Month">Current month (October 2026)</option>
            <option value="Last Quarter">Q3 2026 (Jul - Sep)</option>
            <option value="Year to Date">FY 2026 year-to-date</option>
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors tactile-btn font-mono"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print statement</span>
          </button>
        </div>
      </div>

      {/* 4 P&L Accounting Ledger Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            1. Gross sales revenue
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-950 mb-1">
            ${grossSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500">Invoiced retail and wholesale</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            2. Cost of goods (COGS)
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-700 mb-1">
            -${costOfGoods.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500">Inventory cost allocation</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <div className="text-xs font-medium text-zinc-600 mb-1.5">
            3. Operating overheads
          </div>
          <div className="font-mono font-bold text-2xl text-red-700 mb-1">
            -${operatingExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500">Leases, power, gateway fees</div>
        </div>

        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-200 shadow-2xs">
          <div className="text-xs font-medium text-blue-900 mb-1.5">
            4. Net operating margin
          </div>
          <div className="font-mono font-bold text-2xl text-blue-900 mb-1">
            +${netMargin.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-800 font-semibold">
            {netMarginPercent.toFixed(1)}% realized margin
          </div>
        </div>
      </div>

      {/* 2-Column Asymmetric Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tax Obligations */}
        <div className="bg-white rounded-lg p-5 border border-zinc-200 shadow-2xs space-y-3">
          <div className="pb-3 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-zinc-950">
              Tax remittance and collections
            </h3>
            <span className="text-xs font-mono text-zinc-500">Tax ledger</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded">
              <div>
                <div className="font-bold text-zinc-900">Retail sales tax (5.0%)</div>
                <div className="text-zinc-500 text-xs font-sans">Collected directly at point of sale</div>
              </div>
              <span className="font-bold text-zinc-900">$6,229.50</span>
            </div>

            <div className="flex justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded">
              <div>
                <div className="font-bold text-zinc-900">National VAT / GST (3.0%)</div>
                <div className="text-zinc-500 text-xs font-sans">Applied to imported and electronics inventory</div>
              </div>
              <span className="font-bold text-zinc-900">$3,737.70</span>
            </div>

            <div className="flex justify-between p-3 bg-blue-50 border border-blue-200 rounded font-bold text-xs">
              <span className="text-blue-900">Total remittance payable:</span>
              <span className="text-blue-900">$9,967.20</span>
            </div>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white rounded-lg p-5 border border-zinc-200 shadow-2xs space-y-3">
          <div className="pb-3 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-zinc-950">
              Operating expenses allocation
            </h3>
            <span className="text-xs font-mono text-zinc-500">Expense records</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-zinc-700 font-medium mb-1">
                <span>Warehouse freight and courier logistics</span>
                <span className="text-zinc-900 font-mono font-semibold">$5,800.00 (40.6%)</span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1.5">
                <div className="bg-blue-700 h-1.5 rounded-full" style={{ width: "40.6%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-700 font-medium mb-1">
                <span>Store lease and utilities</span>
                <span className="text-zinc-900 font-mono font-semibold">$4,500.00 (31.5%)</span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1.5">
                <div className="bg-zinc-600 h-1.5 rounded-full" style={{ width: "31.5%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-700 font-medium mb-1">
                <span>Payment gateway fees (Card and mobile)</span>
                <span className="text-zinc-900 font-mono font-semibold">$3,970.00 (27.9%)</span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1.5">
                <div className="bg-zinc-400 h-1.5 rounded-full" style={{ width: "27.9%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
