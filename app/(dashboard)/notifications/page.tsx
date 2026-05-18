"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  AlertTriangle,
  PackageX,
  Trash2,
  XCircle,
} from "lucide-react";
import DateRangePicker, { DateRangeValue, buildDateFilterParams } from "@/components/ui/DateRangePicker";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

type Filter = "all" | "unread" | "read";

const TYPE_ICON: Record<string, React.ReactNode> = {
  new_order: <ShoppingCart size={16} color="#2563eb" />,
  low_stock: <AlertTriangle size={16} color="#d97706" />,
  out_of_stock: <PackageX size={16} color="#dc2626" />,
  delete_request: <Trash2 size={16} color="#7c3aed" />,
  order_cancelled: <XCircle size={16} color="#dc2626" />,
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: null,
    to: null,
    preset: "lifetime",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (filter !== "all") params.set("status", filter);
    const res = await fetch(`/api/notifications?${buildDateFilterParams(params, dateRange)}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [filter, page, dateRange]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n.id}/read`, { method: "PUT" });
    }
    if (n.link) router.push(n.link);
    else load();
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PUT" });
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Notifications
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            All system alerts and updates
          </p>
        </div>
        <button onClick={handleMarkAllRead} style={primaryBtn}>
          <Check size={14} /> Mark all as read
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {(["all", "unread", "read"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            style={{
              ...filterBtn,
              backgroundColor: filter === f ? "var(--brand)" : "var(--card-bg)",
              color: filter === f ? "white" : "var(--text-primary)",
              borderColor: filter === f ? "var(--brand)" : "var(--card-border)",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <DateRangePicker
          value={dateRange}
          onChange={(next) => {
            setDateRange(next);
            setPage(1);
          }}
        />
      </div>

      <div style={tableCard}>
        {loading ? (
          <div style={emptyCell}>Loading notifications...</div>
        ) : items.length === 0 ? (
          <div style={emptyCell}>
            <Bell size={28} color="var(--text-muted)" />
            <div style={{ marginTop: "10px" }}>No notifications</div>
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                display: "flex",
                gap: "12px",
                padding: "14px 16px",
                borderBottom: "1px solid var(--card-border)",
                cursor: "pointer",
                backgroundColor: n.isRead ? "transparent" : "rgba(37,99,235,0.04)",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "var(--input-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {TYPE_ICON[n.type] ?? <Bell size={16} color="var(--text-muted)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: n.isRead ? 500 : 700, color: "var(--text-primary)" }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {n.message}
                </div>
              </div>
              {!n.isRead && (
                <div
                  style={{
                    width: "8px",
                    height: "8px",
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

        {totalPages > 1 && (
          <div style={paginationStyle}>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={pageBtn}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Page {page} of {totalPages}
            </span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} style={pageBtn}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const tableCard: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  overflow: "hidden",
};

const emptyCell: React.CSSProperties = {
  padding: "60px 20px",
  textAlign: "center",
  color: "var(--text-muted)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  fontSize: "13px",
};

const filterBtn: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
};

const primaryBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--text-primary)",
  cursor: "pointer",
};

const pageBtn: React.CSSProperties = {
  padding: "6px",
  borderRadius: "6px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const paginationStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  padding: "16px",
  borderTop: "1px solid var(--card-border)",
};
