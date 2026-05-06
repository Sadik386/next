"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  BarChart2,
  TrendingDown,
  Users,
  Truck,
  FileText,
  Settings,
  Shield,
  Trash2,
  Activity,
  Bell,
  Receipt,
  Import,
  Brain,
} from "lucide-react";

const businessNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Products", href: "/products", icon: Package },
  { label: "Inventory", href: "/inventory", icon: Warehouse },
  { label: "Sales", href: "/sales", icon: BarChart2 },
  { label: "Expenses", href: "/expenses", icon: TrendingDown },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Suppliers", href: "/suppliers", icon: Truck },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Intelligence", href: "/intelligence", icon: Brain },
  { label: "POS", href: "/pos", icon: Receipt },
  { label: "Settings", href: "/settings", icon: Settings },
];

const adminNav = [
  { label: "Users", href: "/users", icon: Users },
  { label: "Roles & Permissions", href: "/roles", icon: Shield },
  { label: "Import / Export", href: "/import-export", icon: Import },
  { label: "Delete Requests", href: "/delete-requests", icon: Trash2 },
  { label: "Activity Log", href: "/activity-logs", icon: Activity },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

function NavItem({
  item,
  active,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 10px",
        borderRadius: "8px",
        textDecoration: "none",
        backgroundColor: active ? "var(--sidebar-active-bg)" : "transparent",
        marginBottom: "1px",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <Icon size={15} strokeWidth={1.8} color={active ? "var(--brand)" : "var(--sidebar-text)"} />
        <span
          style={{
            fontSize: "13px",
            fontWeight: active ? 600 : 400,
            color: active ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
          }}
        >
          {item.label}
        </span>
      </div>
      {active && <span style={{ fontSize: "11px", color: "var(--brand)" }}>›</span>}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: "220px",
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
      }}
    >
      <div style={{ padding: "18px 14px 14px", borderBottom: "1px solid var(--sidebar-border)" }}>
        <p
          style={{
            fontSize: "9px",
            color: "var(--sidebar-text)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Workspace
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              backgroundColor: "var(--brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: "white",
            }}
          >
            A
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--sidebar-text-active)" }}>
            Accoraze
          </span>
        </div>
      </div>
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        <p
          style={{
            fontSize: "9px",
            color: "var(--sidebar-text)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "4px 10px 8px",
          }}
        >
          Business
        </p>
        {businessNav.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
        <p
          style={{
            fontSize: "9px",
            color: "var(--sidebar-text)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "14px 10px 8px",
          }}
        >
          Admin
        </p>
        {adminNav.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--sidebar-border)" }}>
        <p style={{ fontSize: "11px", color: "var(--sidebar-text)", textAlign: "center" }}>
          Accoraze v1.0.0
        </p>
      </div>
    </aside>
  );
}
