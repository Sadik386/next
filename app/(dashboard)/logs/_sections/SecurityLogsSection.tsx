"use client";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import DateRangePicker from "@/components/ui/DateRangePicker";
import type { DateRangeValue } from "@/components/ui/DateRangePicker";

const PAGE_SIZE = 20;

function parseUserAgent(ua: string): string {
  if (!ua || ua === "unknown") return "Unknown";
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

type LogEntry = {
  id: number;
  action: string;
  module: string;
  description: string;
  createdAt: string;
  user: { id: number; name: string; email: string };
  ipAddress?: string;
  userAgent?: string;
};

const ACTION_COLORS: Record<string, { bg: string; fg: string }> = {
  login: { bg: "#dcfce7", fg: "#166534" },
  logout: { bg: "#e0e7ff", fg: "#4338ca" },
};

interface SecurityAlert {
  userId: number;
  userName: string;
  ips: string[];
  time: string;
  type: "suspicious_ip";
}

export default function SecurityLogsSection() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: null, to: null, preset: "lifetime" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  const analyzeSecurityPatterns = (items: LogEntry[]) => {
    const userIps: Record<number, { name: string; ips: { ip: string; time: string }[] }> = {};
    items.forEach(log => {
      if (log.action === "login" && log.ipAddress) {
        if (!userIps[log.user.id]) userIps[log.user.id] = { name: log.user.name, ips: [] };
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
    const params = new URLSearchParams({ page: page.toString(), pageSize: String(PAGE_SIZE), action: "login,logout" });
    if (search) params.set("search", search);
    if (dateRange.from) params.set("from", dateRange.from.toISOString());
    if (dateRange.to) params.set("to", dateRange.to.toISOString());

    const res = await fetch(`/api/activity-logs?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total ?? 0);
      analyzeSecurityPatterns(data.items);
    }
    setLoading(false);
  }, [search, dateRange.from, dateRange.to, page]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useEffect(() => { setPage(1); }, [dateRange.from, dateRange.to]);

  return (
    <div>
      {alerts.length > 0 && (
        <div style={alertCard}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#b45309", marginBottom: "8px" }}>Security Alerts</div>
          {alerts.map((alert, idx) => (
            <div key={idx} style={{ fontSize: "13px", color: "#92400e", marginBottom: "4px" }}>
              <strong>{alert.userName}</strong> logged in from multiple different IPs within 1 hour: {alert.ips.join(", ")}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={searchBox}>
          <Search size={14} color="var(--text-muted)" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by user..." style={searchInput} />
        </div>

        <DateRangePicker value={dateRange} onChange={(val) => { setDateRange(val); setPage(1); }} />

        {(search || dateRange.preset !== "lifetime") && (
          <button
            onClick={() => { setSearch(""); setDateRange({ from: null, to: null, preset: "lifetime" }); setPage(1); }}
            style={clearBtn}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div style={tableCard}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)", borderBottom: "1px solid var(--card-border)" }}>
              <Th>User</Th>
              <Th>Action</Th>
              <Th>IP Address</Th>
              <Th>Browser / OS</Th>
              <Th>Time</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={emptyCell}>Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} style={emptyCell}>No security events found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 500 }}>{log.user.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{log.user.email}</div>
                  </td>
                  <td style={cellStyle}><ActionBadge action={log.action} /></td>
                  <td style={cellStyle}><span style={{ fontFamily: "monospace", fontSize: "12px", color: log.ipAddress && log.ipAddress !== "unknown" ? "var(--text-primary)" : "var(--text-muted)" }}>{log.ipAddress || "—"}</span></td>
                  <td style={cellStyle}><span style={{ fontSize: "12px" }}>{log.userAgent ? parseUserAgent(log.userAgent) : "—"}</span></td>
                  <td style={{ ...cellStyle, color: "var(--text-muted)", fontSize: "12px" }}>{new Date(log.createdAt).toLocaleDateString()}<br />{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action.toLowerCase()] || { bg: "#f3f4f6", fg: "#4b5563" };
  return (
    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", backgroundColor: color.bg, color: color.fg, display: "inline-block" }}>
      {action}
    </span>
  );
}

const alertCard: React.CSSProperties = { marginBottom: "20px", padding: "12px 16px", backgroundColor: "#fef3c7", borderRadius: "8px", border: "1px solid #f59e0b" };
const searchBox: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "8px", padding: "0 12px", flex: 1, minWidth: "200px", maxWidth: "400px" };
const searchInput: React.CSSProperties = { border: "none", outline: "none", background: "transparent", fontSize: "13px", color: "var(--text-primary)", height: "36px", width: "100%" };
const clearBtn: React.CSSProperties = { padding: "6px 12px", fontSize: "12px", backgroundColor: "var(--input-bg)", border: "1px solid var(--card-border)", borderRadius: "6px", color: "var(--text-secondary)", cursor: "pointer" };
const tableCard: React.CSSProperties = { backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "10px", overflow: "hidden" };
const cellStyle: React.CSSProperties = { padding: "12px 16px", color: "var(--text-primary)", verticalAlign: "middle" };
const emptyCell: React.CSSProperties = { padding: "40px", textAlign: "center", color: "var(--text-muted)" };

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{children}</th>;
}