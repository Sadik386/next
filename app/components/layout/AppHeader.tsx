"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Receipt,
  Wifi,
  ChevronRight,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

const TITLE_MAP: Record<string, { title: string; category: string }> = {
  "/pos": {
    title: "Point of Sale Register",
    category: "Checkout",
  },
  "/dashboard": {
    title: "Store Overview",
    category: "Operations",
  },
  "/inventory": {
    title: "Warehouse and Stock",
    category: "Inventory",
  },
  "/products": {
    title: "Product Catalog",
    category: "Items",
  },
  "/orders": {
    title: "Orders and Invoices",
    category: "Sales",
  },
  "/customers": {
    title: "Customers and Vendors",
    category: "Accounts",
  },
  "/reports": {
    title: "Profit and Loss Statement",
    category: "Accounting",
  },
  "/intelligence": {
    title: "Demand Forecasts and Restock",
    category: "Planning",
  },
  "/platform-admin": {
    title: "Tenant Organizations",
    category: "Directory",
  },
};

export function AppHeader() {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  // When on dashboard, the page itself renders the exact clean header as shown in the design mockup
  if (pathname === "/dashboard") {
    return null;
  }

  const currentMeta = TITLE_MAP[pathname] || {
    title: "Store Workspace",
    category: "Terminal",
  };

  return (
    <header className="h-16 bg-[#F4F6FA]/90 backdrop-blur-md px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 border-b border-zinc-200/40">
      {/* Title & Section Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
            <span>NextGen Cloud POS</span>
            <ChevronRight className="w-3 h-3 text-zinc-300" />
            <span className="text-zinc-600 font-medium">{currentMeta.category}</span>
          </div>
          <h1 className="font-heading text-base font-bold text-zinc-900 tracking-tight leading-tight truncate">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Global Command & Search Input */}
      <div className="hidden md:flex items-center relative max-w-sm w-full mx-6">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3" />
        <input
          type="text"
          placeholder="Search products, barcodes, orders (⌘K)..."
          className="w-full bg-zinc-50 border border-zinc-200 rounded-md pl-8 pr-12 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
        />
        <kbd className="absolute right-2 text-[10px] bg-white border border-zinc-200 text-zinc-500 px-1 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right Telemetry & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Offline / Cloud Sync Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <Wifi className="w-3 h-3 text-emerald-700" />
          <span>Synced</span>
        </div>

        {/* Quick Launch POS Terminal if outside POS */}
        {pathname !== "/pos" && (
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors tactile-btn"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Open register</span>
          </Link>
        )}

        {/* System Notifications Drawer Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors tactile-btn"
            title="System notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-lg shadow-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="font-heading font-bold text-xs text-zinc-950">
                  Store alerts
                </span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-mono text-blue-700 hover:underline"
                >
                  Dismiss
                </button>
              </div>
              <div className="mt-2.5 space-y-2 text-xs">
                <div className="p-2 bg-amber-50 rounded border border-amber-200 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-amber-950">Low stock notice</div>
                    <div className="text-amber-800 text-[11px] font-mono mt-0.5">
                      SKU-10294 (Arabica Coffee) inventory is down to 5 bags.
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200 flex gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-950">Daily settlement ready</div>
                    <div className="text-blue-800 text-[11px] font-mono mt-0.5">
                      Receipt batch totaled and ready for reconciliation.
                    </div>
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
