"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Moon,
  Sun,
  Bell,
  LogOut,
  ChevronDown,
  ShoppingCart,
  AlertTriangle,
  PackageX,
  Trash2,
  XCircle,
  Menu,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessSwitcher } from "@/components/layout/BusinessSwitcher";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  new_order: <ShoppingCart size={14} color="#2563eb" />,
  low_stock: <AlertTriangle size={14} color="#d97706" />,
  out_of_stock: <PackageX size={14} color="#dc2626" />,
  delete_request: <Trash2 size={14} color="#7c3aed" />,
  order_cancelled: <XCircle size={14} color="#dc2626" />,
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleMobile } = useSidebar();
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState<Notification[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCount = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (!user) return;
    try {
      const res = await fetch("/api/notifications/count");
      if (res.ok) {
        const data = await res.json();
        setUnread(data.count ?? 0);
      }
    } catch {}
  }, [user]);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?recent=1&limit=5");
      if (res.ok) {
        const data = await res.json();
        setRecent(data.items ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;

    // Function to start polling
    const startPolling = () => {
      fetchCount(); // fetch immediately when becoming visible
      pollRef.current = setInterval(fetchCount, 60000);
    };

    // Function to stop polling
    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Initial state: if visible, start polling
    if (document.visibilityState === 'visible') {
      startPolling();
    }

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchCount, user]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const openNotif = async () => {
    if (!showNotif) await fetchRecent();
    setShowNotif((v) => !v);
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n.id}/read`, { method: "PUT" });
    }
    setShowNotif(false);
    fetchCount();
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PUT" });
    await fetchCount();
    await fetchRecent();
  };

  const pathLabel = "/" + pathname.replace("/", "").toUpperCase();

  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <header
      className="acc-topbar"
      style={{
        position: "fixed",
        top: 0,
        left: "var(--sidebar-width)",
        right: 0,
        height: "48px",
        backgroundColor: "var(--topbar-bg)",
        borderBottom: "1px solid var(--topbar-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 30,
        transition: "left 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={toggleMobile}
          className="acc-mobile-menu-btn"
          style={{
            display: "none",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            color: "var(--text-secondary)",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          title="Open menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <div className="acc-route-title" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {pathLabel}
          </div>
          <div className="acc-route-date" style={{ fontSize: "11px", color: "var(--text-muted)" }}>{today}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          onClick={toggleTheme}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={openNotif}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Bell size={14} />
            {unread > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  minWidth: "14px",
                  height: "14px",
                  padding: "0 3px",
                  backgroundColor: "#dc2626",
                  borderRadius: "7px",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
          {showNotif && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 90 }}
                onClick={() => setShowNotif(false)}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "40px",
                  width: "340px",
                  maxHeight: "440px",
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "10px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--card-border)",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Notifications
                  </span>
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      fontSize: "11px",
                      color: "var(--brand)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Mark all read
                  </button>
                </div>
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {recent.length === 0 ? (
                    <div
                      style={{
                        padding: "30px 14px",
                        textAlign: "center",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                      }}
                    >
                      No notifications
                    </div>
                  ) : (
                    recent.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        style={{
                          display: "flex",
                          gap: "10px",
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--card-border)",
                          cursor: "pointer",
                          backgroundColor: n.isRead ? "transparent" : "rgba(37,99,235,0.04)",
                        }}
                      >
                        <div
                          style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "6px",
                            backgroundColor: "var(--input-bg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {TYPE_ICON[n.type] ?? <Bell size={14} color="var(--text-muted)" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: n.isRead ? 500 : 700,
                              color: "var(--text-primary)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {n.title}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--text-secondary)",
                              marginTop: "1px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {n.message}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {timeAgo(n.createdAt)}
                          </div>
                        </div>
                        {!n.isRead && (
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: "var(--brand)",
                              alignSelf: "center",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowNotif(false);
                    router.push("/notifications");
                  }}
                  style={{
                    padding: "10px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--brand)",
                    background: "none",
                    border: "none",
                    borderTop: "1px solid var(--card-border)",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  View all →
                </button>
              </div>
            </>
          )}
        </div>
        <div
          style={{
            width: "1px",
            height: "18px",
            backgroundColor: "var(--card-border)",
            margin: "0 6px",
          }}
        />
        <BusinessSwitcher />
        <button
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            border: "1px solid var(--card-border)",
            backgroundColor: "transparent",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
          onClick={() => router.push("/pos")}
        >
          POS
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "5px 8px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
            }}
          >
            <UserAvatar 
              name={user?.name} 
              role={user?.role} 
              size={26} 
            />
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
              {user ? user.name.split(" ")[0] : "Admin"}
            </span>
            <ChevronDown size={12} color="var(--text-muted)" />
          </button>
          {showMenu && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 90 }}
                onClick={() => setShowMenu(false)}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "40px",
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "10px",
                  padding: "5px",
                  minWidth: "150px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                  zIndex: 100,
                }}
              >
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#ef4444",
                    fontWeight: 500,
                  }}
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
