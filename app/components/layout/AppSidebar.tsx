"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Boxes,
  Package,
  FileText,
  Users,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronDown,
  Layers,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Executive Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "POS Register",
    href: "/pos",
    icon: Receipt,
    badge: "LIVE",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Inventory & Stock",
    href: "/inventory",
    icon: Boxes,
    badge: "2 Low",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    label: "Product Catalog",
    href: "/products",
    icon: Package,
  },
  {
    label: "Orders & Invoices",
    href: "/orders",
    icon: FileText,
  },
  {
    label: "Customers & CRM",
    href: "/customers",
    icon: Users,
  },
  {
    label: "Financial Analytics",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "AI Intelligence",
    href: "/intelligence",
    icon: Sparkles,
    badge: "AI",
    badgeColor: "bg-indigo-100 text-indigo-700 font-bold",
  },
  {
    label: "Super-Admin Platform",
    href: "/platform-admin",
    icon: ShieldCheck,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-bold text-lg text-slate-900 tracking-tight leading-none">
              DokanDar
            </div>
            <div className="text-[11px] font-semibold tracking-wider text-indigo-600 uppercase mt-1">
              Commerce OS
            </div>
          </div>
        </Link>
      </div>

      {/* Branch / Outlet Selector */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200 text-left hover:border-slate-300 transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-800 truncate leading-tight">
                Downtown Flagship
              </div>
              <div className="text-[10px] text-slate-400">Terminal #01 (Active)</div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation Modules
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    item.badgeColor || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
              MB
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-900 truncate leading-tight">
                Marcus Brody
              </div>
              <div className="text-[10px] text-emerald-600 font-medium">Store Admin</div>
            </div>
          </div>
          <Link
            href="/login"
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
