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
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  User,
  Search,
  Command,
  UserCircle,
  UserPlus,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useEffect, useState } from "react";

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
  { label: "My Profile", href: "/profile", icon: UserCircle },
  { label: "Users", href: "/users", icon: Users },
  { label: "Roles & Permissions", href: "/roles", icon: Shield },
  { label: "Registration Requests", href: "/admin/registrations", icon: UserPlus },
  { label: "Import / Export", href: "/import-export", icon: Import },
  { label: "Delete Requests", href: "/delete-requests", icon: Trash2 },
  { label: "Activity Log", href: "/activity-logs", icon: Activity },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

function NavItem({
  item,
  active,
  isExpanded,
  badge,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  active: boolean;
  isExpanded: boolean;
  badge?: number;
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
        padding: isExpanded ? "0 10px" : "0",
        height: "36px",
        borderRadius: "8px",
        textDecoration: "none",
        backgroundColor: active ? "var(--sidebar-active-bg)" : "transparent",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Icon size={16} strokeWidth={1.6} color={active ? "var(--brand)" : "var(--sidebar-text)"} />
        <span
          style={{
            opacity: isExpanded ? 1 : 0,
            width: isExpanded ? "auto" : 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            fontSize: "13px",
            fontWeight: active ? 600 : 400,
            color: active ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
            transition: "opacity 0.15s, width 0.2s",
          }}
        >
          {item.label}
        </span>
        {badge !== undefined && badge > 0 && (
          <span
            style={{
              background: "#dc2626",
              color: "white",
              fontSize: "10px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "10px",
              minWidth: "18px",
              textAlign: "center",
              marginLeft: isExpanded ? "8px" : "0",
              display: isExpanded ? "inline-block" : "none",
            }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      {active && isExpanded && (
        <span style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 600 }}>›</span>
      )}
    </Link>
  );
}

type UserInfo = { name: string; email: string } | null;

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, closeMobile, isHovered, setIsHovered, isExpanded, toggleSidebar } = useSidebar();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pendingRegCount, setPendingRegCount] = useState(0);

  // Show skeleton placeholder until loaded - prevents layout shift
  const showUser = loaded && user !== null;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user) {
          setUser({ name: data.user.name || data.user.email || "User", email: data.user.email || "" });
        } else {
          setUser(null);
        }
        setLoaded(true);
      })
      .catch(() => { setUser(null); setLoaded(true); });

    fetch("/api/admin/registrations?status=pending")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.pendingCount) {
          setPendingRegCount(data.pendingCount);
        }
      })
      .catch(() => {});
  }, []);

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
        {/* Logo */}
        <div
          style={{
            padding: isExpanded ? "16px" : "16px 8px",
            borderBottom: "1px solid var(--sidebar-border)",
            transition: "padding 0.2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}
            >
              A
            </div>
            {isExpanded && (
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--sidebar-text-active)" }}>
                Accoraze
              </span>
            )}
          </div>

          {/* Decorative search */}
          {isExpanded && (
            <div
              style={{
                marginTop: "10px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid var(--input-border)",
                backgroundColor: "var(--input-bg)",
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
                gap: "8px",
              }}
            >
              <Search size={12} color="var(--text-muted)" strokeWidth={2} />
              <span style={{ flex: 1, fontSize: "12px", color: "var(--text-muted)" }}>Search...</span>
              <div
                style={{
                  backgroundColor: "var(--card-border)",
                  borderRadius: "4px",
                  padding: "2px 5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <Command size={9} color="var(--text-muted)" />
                <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>K</span>
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          <p
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "12px 10px 4px",
              opacity: isExpanded ? 1 : 0,
              transition: "opacity 0.15s",
            }}
          >
            Business
          </p>
          {businessNav.map((item) => (
            <NavItem key={item.href} item={item} active={isActive(item.href)} isExpanded={isExpanded} />
          ))}

          <p
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "14px 10px 4px",
              opacity: isExpanded ? 1 : 0,
              transition: "opacity 0.15s",
            }}
          >
            Admin
          </p>
          {adminNav.map((item) => (
            <NavItem 
              key={item.href} 
              item={item} 
              active={isActive(item.href)} 
              isExpanded={isExpanded}
              badge={item.href === "/admin/registrations" ? pendingRegCount : undefined}
            />
          ))}
        </nav>

        {/* Toggle button */}
        <div
          style={{
            borderTop: "1px solid var(--sidebar-border)",
            padding: "6px 8px",
          }}
        >
          <button
            onClick={toggleSidebar}
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            style={{
              width: "100%",
              height: "32px",
              backgroundColor: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: isExpanded ? "flex-start" : "center",
              padding: "0 10px",
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
                <span>Collapse</span>
              </>
            ) : (
              <PanelLeftOpen size={15} strokeWidth={1.8} />
            )}
          </button>
        </div>

        {/* User card */}
        <div
          style={{
            borderTop: "1px solid var(--sidebar-border)",
            padding: "10px 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
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
              {showUser ? (
                <>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--sidebar-text-active)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.name || "User"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.email || ""}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ height: "16px", width: "60%", background: "var(--sidebar-border)", borderRadius: "4px", marginBottom: "4px" }} />
                  <div style={{ height: "12px", width: "80%", background: "var(--sidebar-border)", borderRadius: "4px" }} />
                </>
              )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
