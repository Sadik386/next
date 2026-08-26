"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Sparkles,
  Receipt,
  Wifi,
  ChevronRight,
  Plus,
} from "lucide-react";

const TITLE_MAP: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Executive Commerce Dashboard",
    subtitle: "Real-time overview of revenue, operations, and inventory velocity",
  },
  "/pos": {
    title: "POS Register & Terminal",
    subtitle: "Fast in-store checkout, barcode scanning, and multi-tender payments",
  },
  "/inventory": {
    title: "Inventory & Stock Control",
    subtitle: "Multi-warehouse tracking, stock reorder levels, and movements",
  },
  "/products": {
    title: "Product Catalog & Barcodes",
    subtitle: "SKU management, category hierarchy, and price margin calculator",
  },
  "/orders": {
    title: "Order Management & Invoices",
    subtitle: "Sales orders, fulfillment pipelines, and tax invoice generation",
  },
  "/customers": {
    title: "Customer CRM & Supplier Ledger",
    subtitle: "VIP customer accounts, credit limits, and vendor payables",
  },
  "/reports": {
    title: "Financial Analytics & P&L",
    subtitle: "Profit margins, tax deductions, sales forecasting, and exports",
  },
  "/intelligence": {
    title: "AI Intelligence & Settings",
    subtitle: "Predictive restock alerts, elasticity pricing, and store profiles",
  },
  "/platform-admin": {
    title: "Super-Admin Platform",
    subtitle: "Multi-tenant orchestration, API metrics, and system audit logs",
  },
};

export function AppHeader() {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  const currentMeta = TITLE_MAP[pathname] || {
    title: "DokanDar Commerce OS",
    subtitle: "High performance commerce & inventory suite",
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>DokanDar</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-semibold">{currentMeta.title}</span>
          </div>
          <h1 className="font-heading text-base font-bold text-slate-900 tracking-tight leading-tight">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center relative max-w-md w-full mx-6">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
        <input
          type="text"
          placeholder="Search products, SKU, orders, customers (Press ⌘K)..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-12 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        <kbd className="absolute right-3 text-[10px] bg-white border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {/* System Health / Sync Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <Wifi className="w-3 h-3" />
          <span>Synced</span>
        </div>

        {/* Fast Action CTA (POS Button if not on POS) */}
        {pathname !== "/pos" && (
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Open Register</span>
          </Link>
        )}

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-heading font-bold text-xs text-slate-900">Notifications</span>
                <span className="text-[10px] text-indigo-600 font-semibold cursor-pointer">Mark read</span>
              </div>
              <div className="mt-2 space-y-2 text-xs">
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                  <span className="text-amber-600 font-bold">⚠️</span>
                  <div>
                    <div className="font-semibold text-amber-900">Low Stock Alert</div>
                    <div className="text-amber-700 text-[11px]">Organic Arabica Coffee is at 5 units.</div>
                  </div>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 flex gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-indigo-900">AI Price Recommendation</div>
                    <div className="text-indigo-700 text-[11px]">Potential +$420 weekly profit detected.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
