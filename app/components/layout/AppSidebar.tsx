"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Package,
  ShoppingBag,
  Briefcase,
  Truck,
  ShoppingCart,
  Landmark,
  Wallet,
  UserCheck,
  FileBarChart,
  Globe,
  ChevronRight,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    label: "Parties",
    href: "/customers",
    icon: Users,
  },
  {
    label: "Product Manager",
    href: "/products",
    icon: Package,
  },
  {
    label: "Sales",
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    label: "Purchases",
    href: "/inventory",
    icon: Briefcase,
  },
  {
    label: "Stock Transfer",
    href: "/inventory",
    icon: Truck,
  },
  {
    label: "POS",
    href: "/pos",
    icon: ShoppingCart,
  },
  {
    label: "Cash & Bank",
    href: "/reports",
    icon: Landmark,
  },
  {
    label: "Expenses",
    href: "/reports",
    icon: Wallet,
  },
  {
    label: "Staff Members",
    href: "/platform-admin",
    icon: UserCheck,
  },
  {
    label: "Sales Reports",
    href: "/reports",
    icon: FileBarChart,
  },
  {
    label: "Online Orders",
    href: "/orders",
    icon: Globe,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] bg-[#161622] text-[#8E8EA8] flex flex-col shrink-0 min-h-[100dvh] sticky top-0 select-none z-30 transition-all border-r border-[#1F1F30]">
      {/* Brand Logo - NextGen Cloud POS aesthetic */}
      <div className="pt-7 pb-6 px-6">
        <Link href="/dashboard" className="inline-flex items-baseline gap-1.5 group">
          <span className="font-heading font-black text-2xl tracking-tight text-[#2F80ED] group-hover:text-[#4CA0FF] transition-colors">
            NextGen
          </span>
          <span className="text-xs font-semibold text-[#A0A0B2] tracking-normal">
            Cloud POS.
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 custom-sidebar-scroll">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-[13px] font-medium transition-all group ${
                isActive
                  ? "bg-[#252538] text-white shadow-sm font-semibold"
                  : "text-[#8E8EA8] hover:bg-[#1E1E2D] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-[#757591] group-hover:text-white"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {!isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-[#52526E] group-hover:text-zinc-300 transition-colors shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile & Logout */}
      <div className="p-4 border-t border-[#1F1F30] mt-auto">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#1C1C2A]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              NG
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate leading-tight">
                NextGen Admin
              </div>
              <div className="text-[10px] text-zinc-400 truncate">
                admin@nextgenpos.com
              </div>
            </div>
          </div>
          <Link
            href="/login"
            title="Sign out"
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-[#28283C] rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
