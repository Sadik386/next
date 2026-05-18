"use client";
import { useCallback, useEffect, useState } from "react";
import { Search, Activity } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DateRangePicker, { DateRangeValue, buildDateFilterParams } from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 20;

type LogEntry = {
  id: number;
  action: string;
  module: string;
  entityId?: string;
  entityName?: string;
  description: string;
  createdAt: string;
  user: { id: number; name: string; email: string };
  ipAddress?: string;
  userAgent?: string;
};

const ACTION_COLORS: Record<string, { bg: string; fg: string }> = {
  created: { bg: "#dcfce7", fg: "#166534" },
  create: { bg: "#dcfce7", fg: "#166534" },
  updated: { bg: "#e0e7ff", fg: "#4338ca" },
  update: { bg: "#e0e7ff", fg: "#4338ca" },
  deleted: { bg: "#fee2e2", fg: "#991b1b" },
  delete: { bg: "#fee2e2", fg: "#991b1b" },
  delete_request: { bg: "#fef3c7", fg: "#b45309" },
  approved: { bg: "#d1fae5", fg: "#065f46" },
  rejected: { bg: "#ffedd5", fg: "#9a3412" },
  activate: { bg: "#dcfce7", fg: "#166534" },
  deactivate: { bg: "#fee2e2", fg: "#991b1b" },
  change_role: { bg: "#f3e8ff", fg: "#6b21a8" },
  login: { bg: "#dcfce7", fg: "#166534" },
  logout: { bg: "#e0e7ff", fg: "#4338ca" },
};

const MODULES = [
  "All Modules", "User", "Role", "Product", "Category", "Inventory",
  "Order", "Sale", "Expense", "Customer", "Supplier", "Delete_Request"
];

const ACTIONS = [
  "All Actions", "Create", "Update", "Delete", "Delete_Request",
  "Approved", "Rejected", "Activate", "Deactivate", "Change_Role",
  "Login", "Logout"
];

function parseUserAgent(ua: string): string {
  if (!ua || ua === "unknown") return "—";
  let browser = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "Mac";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  return `${browser} / ${os}`;
}

interface SecurityAlert {
  userId: number;
  userName: string;
  ips: string[];
  time: string;
  type: "suspicious_ip";
}

export default function LogsPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "activity";

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: null, to: null, preset: "this_month" });

  const analyzeSecurityPatterns = (items: LogEntry[]) => {
    const userIps: Record<number, { name: string; ips: { ip: string; time: string }[] }> = {};
    items.forEach(log => {
      if (log.action === "login" && log.ipAddress) {
        if (!userIps[log.user.id]) {
          userIps[log.user.id] = { name: log.user.name, ips: [] };
        }
        userIps[log.user.id].ips.push({ ip: log.ipAddress, time: log.createdAt });
      }
    });

    const newAlerts: SecurityAlert[] = [];
    Object.entries(userIps).forEach(([userId, data]) => {
      const uniqueIps = new Set(data.ips.map(i => i.ip));
      if (uniqueIps.size > 1) {
        const sorted = data.ips.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        let lastTime = new Date(sorted[0].time);
        for (let i = 1; i < sorted.length; i++) {
          const currTime = new Date(sorted[i].time);
          const diffMinutes = (currTime.getTime() - lastTime.getTime()) / (1000 * 60);
          if (diffMinutes <= 60 && sorted[i].ip !== sorted[i - 1].ip) {
            newAlerts.push({ userId: parseInt(userId), userName: data.name, ips: Array.from(uniqueIps), time: sorted[i].time, type: "suspicious_ip" });
            break;
          }
          lastTime = currTime;
        }
      }
    });
    setAlerts(newAlerts);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: String(PAGE_SIZE),
    });

    if (tab === "security") {
      params.set("action", "login,logout");
    } else {
      if (module && module !== "All Modules") params.set("module", module.toLowerCase());
      if (action && action !== "All Actions") params.set("action", action.toLowerCase());
    }
    if (search) params.set("search", search);
    if (ipFilter) params.set("ipAddress", ipFilter);

    const res = await fetch(`/api/activity-logs?${buildDateFilterParams(params, dateRange)}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total ?? 0);
      if (tab === "security") analyzeSecurityPatterns(data.items);
    }
    setLoading(false);
  }, [tab, module, action, search, ipFilter, page, dateRange]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab, module, action, search, ipFilter, dateRange]);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          All Logs
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
          System activity and security event logs
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "0px" }}>
        <TabButton href="/logs?tab=activity" active={tab === "activity"}>Activity Logs</TabButton>
        <TabButton href="/logs?tab=security" active={tab === "security"}>Security Logs</TabButton>
      </div>

      {/* Security Alerts */}
      {tab === "security" && alerts.length > 0 && (
        <div style={{ marginBottom: "20px", padding: "12px 16px", backgroundColor: "#fef3c7", borderRadius: "8px", border: "1px solid #f59e0b" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#b45309", marginBottom: "8px" }}>Security Alerts</div>
          {alerts.map((alert, idx) => (
            <div key={idx} style={{ fontSize: "13px", color: "#92400e", marginBottom: "4px" }}>
              <strong>{alert.userName}</strong> logged in from multiple different IPs within 1 hour: {alert.ips.join(", ")}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={searchBox}>
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search..."
            style={searchInput}
          />
        </div>

        {tab === "activity" && (
          <>
            <select value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }} style={filterSelect}>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} style={filterSelect}>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </>
        )}

        <div style={searchBox}>
          <Search size={14} color="var(--text-muted)" />
          <input
            value={ipFilter}
            onChange={(e) => { setIpFilter(e.target.value); setPage(1); }}
            placeholder="Filter by IP..."
            style={searchInput}
          />
        </div>

        <DateRangePicker value={dateRange} onChange={(val) => { setDateRange(val); setPage(1); }} />
      </div>

      {/* Table */}
      <div style={tableCard}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)", borderBottom: "1px solid var(--card-border)" }}>
              <Th>User</Th>
              <Th>Action</Th>
              {tab === "activity" && <Th>Module</Th>}
              <Th>Description</Th>
              <Th>IP Address</Th>
              <Th>Browser / OS</Th>
              <Th>Time</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={tab === "security" ? 6 : 7} style={emptyCell}>Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={tab === "security" ? 6 : 7} style={emptyCell}>No logs found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 500 }}>{log.user.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{log.user.email}</div>
                  </td>
                  <td style={cellStyle}>
                    <ActionBadge action={log.action} />
                  </td>
                  {tab === "activity" && (
                    <td style={cellStyle}>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", textTransform: "capitalize" }}>
                        {log.module.replace('_', ' ')}
                      </span>
                    </td>
                  )}
                  <td style={{ ...cellStyle, maxWidth: "300px" }}>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)", whiteSpace: "normal" }}>
                      {log.description}
                    </div>
                    {log.entityName && (
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Entity: {log.entityName} {log.entityId && `(ID: ${log.entityId})`}
                      </div>
                    )}
                  </td>
                  <td style={cellStyle}>
                    <span style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: log.ipAddress && log.ipAddress !== "unknown" ? "var(--text-primary)" : "var(--text-muted)"
                    }}>
                      {log.ipAddress || "—"}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span style={{ fontSize: "12px" }}>{log.userAgent ? parseUserAgent(log.userAgent) : "—"}</span>
                  </td>
                  <td style={{ ...cellStyle, color: "var(--text-muted)", fontSize: "12px" }}>
                    {new Date(log.createdAt).toLocaleDateString()}
                    <br />
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

function TabButton({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: "10px 16px",
        borderRadius: "8px 8px 0 0",
        border: "none",
        backgroundColor: active ? "var(--card-bg)" : "transparent",
        color: active ? "var(--brand)" : "var(--text-secondary)",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        borderBottom: active ? "2px solid var(--brand)" : "2px solid transparent",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action.toLowerCase()] || { bg: "#f3f4f6", fg: "#4b5563" };
  return (
    <span style={{
      fontSize: "10px",
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: "4px",
      textTransform: "uppercase",
      backgroundColor: color.bg,
      color: color.fg,
      display: "inline-block"
    }}>
      {action.replace('_', ' ')}
    </span>
  );
}

const tableCard: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  overflow: "hidden",
};

const cellStyle: React.CSSProperties = {
  padding: "12px 16px",
  color: "var(--text-primary)",
  verticalAlign: "middle",
};

const emptyCell: React.CSSProperties = {
  padding: "40px",
  textAlign: "center",
  color: "var(--text-muted)",
};

const searchBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  padding: "0 12px",
  flex: 1,
  minWidth: "200px",
  maxWidth: "400px",
};

const searchInput: React.CSSProperties = {
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "13px",
  color: "var(--text-primary)",
  height: "36px",
  width: "100%",
};

const filterSelect: React.CSSProperties = {
  padding: "0 12px",
  height: "38px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  fontSize: "13px",
  color: "var(--text-primary)",
  outline: "none",
  cursor: "pointer",
  minWidth: "140px",
};

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      textAlign: "left",
      padding: "12px 16px",
      fontSize: "11px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "var(--text-muted)",
    }}>
      {children}
    </th>
  );
}
