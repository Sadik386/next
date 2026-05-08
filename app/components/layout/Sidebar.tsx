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
  Import,
  Brain,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  User,
  LogOut,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

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
  isExpanded,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  active: boolean;
  isExpanded: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={!isExpanded ? item.label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: isExpanded ? "space-between" : "center",
        padding: isExpanded ? "7px 10px" : "7px 0",
        height: isExpanded ? "auto" : "36px",
        borderRadius: "8px",
        textDecoration: "none",
        backgroundColor: active ? "var(--sidebar-active-bg)" : "transparent",
        marginBottom: "1px",
        transition: "background 0.15s, padding 0.2s ease",
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
            opacity: isExpanded ? 1 : 0,
            width: isExpanded ? "auto" : 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            fontSize: "13px",
            fontWeight: active ? 600 : 400,
            color: active ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
            transition: "opacity 0.15s ease, width 0.2s ease",
          }}
        >
          {item.label}
        </span>
      </div>
      {active && isExpanded && <span style={{ fontSize: "11px", color: "var(--brand)" }}>›</span>}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, closeMobile, isHovered, setIsHovered, isExpanded, toggleSidebar } = useSidebar();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={closeMobile} />}
      <aside
        className="app-sidebar"
        data-mobile-open={isMobileOpen}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && setIsHovered(false)}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width: isExpanded ? "220px" : "64px",
          backgroundColor: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          display: "flex",
          flexDirection: "column",
          zIndex: 40,
          transition: "width 0.2s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: isExpanded ? "18px 14px 14px" : "18px 8px 14px",
            borderBottom: "1px solid var(--sidebar-border)",
            transition: "padding 0.2s ease",
          }}
        >
          {isExpanded && (
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
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isExpanded ? "flex-start" : "center",
              gap: "9px",
            }}
          >
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
                flexShrink: 0,
              }}
            >
              A
            </div>
            {isExpanded && (
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--sidebar-text-active)" }}>
                Accoraze
              </span>
            )}
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
          {isExpanded && (
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
          )}
          {businessNav.map((item) => (
            <NavItem key={item.href} item={item} active={isActive(item.href)} isExpanded={isExpanded} />
          ))}
          {isExpanded && (
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
          )}
          {adminNav.map((item) => (
            <NavItem key={item.href} item={item} active={isActive(item.href)} isExpanded={isExpanded} />
          ))}
        </nav>

        <div
          style={{
            borderTop: "1px solid var(--sidebar-border)",
            padding: "8px",
          }}
        >
          <button
            onClick={toggleSidebar}
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            style={{
              width: "100%",
              height: "36px",
              backgroundColor: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: isExpanded ? "flex-start" : "center",
              padding: "0 12px",
              gap: "8px",
              cursor: "pointer",
              color: "var(--sidebar-text)",
              fontSize: "12px",
              fontWeight: 500,
              borderRadius: "6px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            {isExpanded ? (
              <>
                <PanelLeftClose size={15} strokeWidth={1.8} />
                <span>Collapse sidebar</span>
              </>
            ) : (
              <PanelLeftOpen size={15} strokeWidth={1.8} />
            )}
          </button>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--sidebar-border)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "9px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              backgroundColor: "var(--brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={13} color="white" />
          </div>
          {isExpanded && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--sidebar-text-active)" }}>Admin</div>
              <div style={{ fontSize: "10px", color: "var(--sidebar-text)" }}>admin@accoraze.com</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}