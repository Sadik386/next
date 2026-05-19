"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Bell,
  Brain,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Search,
  Command,
  UserCircle,
  X,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useSidebar } from "@/contexts/SidebarContext";
import { useSettings } from "@/contexts/SettingsContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useEffect, useState, useRef, useCallback } from "react";
import { canAccessPlatform } from "@/lib/platform-client";

const searchShortcutStyle = `
  .search-shortcut {
    display: none !important;
  }
`;

const navGroups = [
  {
    label: "Analytics",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Intelligence", href: "/intelligence", icon: Brain },
      { label: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "POS", href: "/pos", icon: Receipt },
      { label: "Sales", href: "/sales", icon: BarChart2 },
      { label: "Orders", href: "/orders", icon: ShoppingCart },
      { label: "Products", href: "/products", icon: Package },
      { label: "Inventory", href: "/inventory", icon: Warehouse },
      { label: "Expenses", href: "/expenses", icon: TrendingDown },
    ],
  },
  {
    label: "Relationships",
    items: [
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Suppliers", href: "/suppliers", icon: Truck },
    ],
  },
  {
    label: "System",
    items: [
      { label: "System", href: "/system", navTarget: "/system/settings", icon: Settings },
      { label: "All Logs", href: "/logs", icon: FileText },
      { label: "My Profile", href: "/profile", icon: UserCircle },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
];

function NavItem({
  item,
  active,
  isExpanded,
  badge,
}: {
  item: { label: string; href: string; navTarget?: string; icon: React.ElementType; indent?: boolean };
  active: boolean;
  isExpanded: boolean;
  badge?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.navTarget || item.href}
      title={!isExpanded ? item.label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: isExpanded ? "space-between" : "center",
        padding: isExpanded ? (item.indent ? "0 10px 0 30px" : "0 10px") : "0",
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

type UserInfo = { name: string; email: string; role: string } | null;

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, closeMobile, isHovered, setIsHovered, isExpanded, toggleSidebar } = useSidebar();
  const { settings } = useSettings();
  
  // Refined isActive to handle consolidated logs and nested paths
  const isActive = (href: string) => {
    if (pathname === href) return true;
    
    // Special case: "All Logs" highlights for its tabs and standalone log pages
    if (href === "/logs" && (
      pathname === "/activity-logs" || 
      pathname.startsWith("/activity-logs/") ||
      pathname.startsWith("/logs?")
    )) {
      return true;
    }

    if (pathname.startsWith(href + "/")) {
      // Check if there's a more specific match in any nav group
      const hasSpecificMatch = navGroups.some(group => 
        group.items.some(item => 
          item.href !== href && 
          item.href.startsWith(href + "/") && 
          (pathname === item.href || pathname.startsWith(item.href + "/"))
        )
      );
      return !hasSpecificMatch;
    }
    return false;
  };

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pendingRegCount, setPendingRegCount] = useState(0);

  // Global search state
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Record<string, unknown[]> | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults(null);
      }
    } catch {
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSearchOpen(value.length > 0);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => performSearch(value), 300);
    } else {
      setSearchResults(null);
    }
  };

  const handleResultClick = (type: string, id: number, code?: string) => {
    setSearchOpen(false);
    const searchParam = searchQuery.trim();
    const highlightParam = code || searchParam;
    switch (type) {
      case "product":
        router.push(`/products?search=${encodeURIComponent(searchParam)}&highlight=${encodeURIComponent(highlightParam)}`);
        break;
      case "order":
        router.push(`/orders/${encodeURIComponent(code || id)}`);
        break;
      case "sale":
        router.push(`/sales?search=${encodeURIComponent(searchParam)}&highlight=${encodeURIComponent(highlightParam)}`);
        break;
      case "customer":
        router.push(`/customers/${encodeURIComponent(code || id)}`);
        break;
      case "supplier":
        router.push(`/suppliers/${encodeURIComponent(code || id)}`);
        break;
      case "expense":
        router.push(`/expenses?search=${encodeURIComponent(searchParam)}&highlight=${encodeURIComponent(highlightParam)}`);
        break;
      default:
        break;
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
  };

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && searchOpen) {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  // Click outside to close search
  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-popup') && !target.closest('.search-input')) {
        closeSearch();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [searchOpen]);

  // Show skeleton placeholder until loaded - prevents layout shift
  const showUser = loaded && user !== null;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user) {
          setUser({ 
            name: data.user.name || data.user.email || "User", 
            email: data.user.email || "",
            role: data.user.role || "staff"
          });
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
      <style dangerouslySetInnerHTML={{ __html: searchShortcutStyle }} />
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
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              {settings?.logoUrl ? (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <Image 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    width={32} 
                    height={32} 
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                </div>
              ) : (
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
              )}
              {isExpanded && (
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--sidebar-text-active)" }}>
                  Accoraze
                </span>
              )}
            </div>
          </Link>

          {/* Decorative search */}
          {isExpanded && (
            <div style={{ position: "relative" }}>
              <div
                className="search-input"
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
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
                  placeholder="Search..."
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                  }}
                />
                {searchQuery && (
                  <X
                    size={12}
                    color="var(--text-muted)"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSearchChange("")}
                  />
                )}
                <div
                  className="search-shortcut"
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

              {/* Search Results Popup */}
              {searchOpen && (
                <div
                  className="search-popup"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "8px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    zIndex: 100,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {searchLoading ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite", display: "inline" }} />
                    </div>
                  ) : searchQuery.trim().length < 2 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                      Type at least 2 characters
                    </div>
                  ) : searchResults && Object.keys(searchResults).length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                      No results found
                    </div>
                  ) : searchResults ? (
                    <div>
                      {searchResults.products && searchResults.products.length > 0 && (
                        <SearchSection title="Products" onClickMore={() => { closeSearch(); router.push("/products"); }}>
                          {searchResults.products.slice(0, 3).map((p: any) => (
                            <SearchResultItem
                              key={`product-${p.id}`}
                              label={p.name}
                              subLabel={p.sku || p.productId}
                              onClick={() => handleResultClick("product", p.id, p.productId)}
                            />
                          ))}
                        </SearchSection>
                      )}
                      {searchResults.orders && searchResults.orders.length > 0 && (
                        <SearchSection title="Orders" onClickMore={() => { closeSearch(); router.push("/orders"); }}>
                          {searchResults.orders.slice(0, 3).map((o: any) => (
                            <SearchResultItem
                              key={`order-${o.id}`}
                              label={o.orderId}
                              subLabel={o.customerName || o.paymentStatus}
                              onClick={() => handleResultClick("order", o.id, o.orderId)}
                            />
                          ))}
                        </SearchSection>
                      )}
                      {searchResults.customers && searchResults.customers.length > 0 && (
                        <SearchSection title="Customers" onClickMore={() => { closeSearch(); router.push("/customers"); }}>
                          {searchResults.customers.slice(0, 3).map((c: any) => (
                            <SearchResultItem
                              key={`customer-${c.id}`}
                              label={c.name}
                              subLabel={c.mobile}
                              onClick={() => handleResultClick("customer", c.id, c.customerId)}
                            />
                          ))}
                        </SearchSection>
                      )}
                      {searchResults.suppliers && searchResults.suppliers.length > 0 && (
                        <SearchSection title="Suppliers" onClickMore={() => { closeSearch(); router.push("/suppliers"); }}>
                          {searchResults.suppliers.slice(0, 3).map((s: any) => (
                            <SearchResultItem
                              key={`supplier-${s.id}`}
                              label={s.companyName}
                              subLabel={s.contactName || s.mobile}
                              onClick={() => handleResultClick("supplier", s.id, s.supplierId)}
                            />
                          ))}
                        </SearchSection>
                      )}
                      {searchResults.sales && searchResults.sales.length > 0 && (
                        <SearchSection title="Sales" onClickMore={() => { closeSearch(); router.push("/sales"); }}>
                          {searchResults.sales.slice(0, 3).map((s: any) => (
                            <SearchResultItem
                              key={`sale-${s.id}`}
                              label={s.saleId}
                              subLabel={s.productName || s.customerName || ""}
                              onClick={() => handleResultClick("sale", s.id, s.saleId)}
                            />
                          ))}
                        </SearchSection>
                      )}
                      {searchResults.expenses && searchResults.expenses.length > 0 && (
                        <SearchSection title="Expenses" onClickMore={() => { closeSearch(); router.push("/expenses"); }}>
                          {searchResults.expenses.slice(0, 3).map((e: any) => (
                            <SearchResultItem
                              key={`expense-${e.id}`}
                              label={`${e.category} - ${e.vendor || e.expenseId}`}
                              subLabel={`$${e.amount}`}
                              onClick={() => handleResultClick("expense", e.id, e.expenseId)}
                            />
                          ))}
                        </SearchSection>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <p style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "12px 10px 4px",
                opacity: isExpanded ? 1 : 0,
                transition: "opacity 0.15s",
              }}>
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  isExpanded={isExpanded}
                />
              ))}
            </div>
          ))}

          {canAccessPlatform(user) && (
            <div>
              <p style={{
                fontSize: "10px",
                color: "var(--brand)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "12px 10px 4px",
                opacity: isExpanded ? 1 : 0,
                transition: "opacity 0.15s",
              }}>
                Platform
              </p>
              <NavItem 
                item={{ label: "Platform Admin", href: "/platform", icon: ShieldCheck }}
                active={pathname.startsWith("/platform")}
                isExpanded={isExpanded}
              />
            </div>
          )}
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
            <UserAvatar 
              name={user?.name} 
              role={user?.role} 
              size={32} 
            />
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

function SearchSection({
  title,
  children,
  onClickMore,
}: {
  title: string;
  children: React.ReactNode;
  onClickMore: () => void;
}) {
  return (
    <div style={{ borderBottom: "1px solid var(--card-border)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px 4px",
        }}
      >
        <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </span>
        <button
          onClick={onClickMore}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--brand)",
            fontSize: "10px",
            padding: "2px 4px",
          }}
        >
          More <ArrowRight size={10} />
        </button>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SearchResultItem({
  label,
  subLabel,
  onClick,
}: {
  label: string;
  subLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
    >
      <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500 }}>{label}</span>
      {subLabel && <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{subLabel}</span>}
    </button>
  );
}
