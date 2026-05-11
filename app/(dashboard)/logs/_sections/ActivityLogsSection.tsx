"use client";
import { useCallback, useEffect, useState } from "react";
import { Search, Download } from "lucide-react";
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
  entityId?: string;
  entityName?: string;
  description: string;
  createdAt: string;
  user: { name: string; email: string };
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
};

const MODULES = ["All Modules", "User", "Role", "Product", "Category", "Inventory", "Order", "Sale", "Expense", "Customer", "Supplier", "Delete_Request"];
const ACTIONS = ["All Actions", "Create", "Update", "Delete", "Delete_Request", "Approved", "Rejected", "Activate", "Deactivate", "Change_Role", "Login", "Logout"];

export default function ActivityLogsSection() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: null, to: null, preset: "lifetime" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  async function exportCSV() {
    setLoading(true);
    const params = new URLSearchParams({ export: "true" });
    if (module && module !== "All Modules") params.set("module", module.toLowerCase());
    if (action && action !== "All Actions") params.set("action", action.toLowerCase());
    if (search) params.set("search", search);
    if (ipFilter) params.set("ipFilter", ipFilter);
    if (dateRange.from) params.set("from", dateRange.from.toISOString());
    if (dateRange.to) params.set("to", dateRange.to.toISOString());

    const res = await fetch(`/api/activity-logs?${params}`);
    if (res.ok) {
      const data = await res.json();
      const items = data.items as LogEntry[];
      if (items.length === 0) { setLoading(false); return; }
      const headers = ["Action", "Module", "Entity ID", "Description", "User", "Email", "IP Address", "User Agent", "Time"];
      const rows = items.map((log) => [
        log.action, log.module, log.entityId || "", log.description.replace(/"/g, '""'), log.user.name, log.user.email, log.ipAddress || "", log.userAgent || "", new Date(log.createdAt).toISOString(),
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setLoading(false);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), pageSize: String(PAGE_SIZE) });
    if (module && module !== "All Modules") params.set("module", module.toLowerCase());
    if (action && action !== "All Actions") params.set("action", action.toLowerCase());
    if (search) params.set("search", search);
    if (ipFilter) params.set("ipFilter", ipFilter);
    if (dateRange.from) params.set("from", dateRange.from.toISOString());
    if (dateRange.to) params.set("to", dateRange.to.toISOString());

    const res = await fetch(`/api/activity-logs?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [module, action, search, ipFilter, dateRange.from, dateRange.to, page]);

  useEffect(() => {
    const timer = setTimeout(load, search || ipFilter ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search, ipFilter]);

  useEffect(() => { setPage(1); }, [module, action, ipFilter, dateRange.from, dateRange.to]);

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={searchBox}>
          <Search size={14} color="var(--text-muted)" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search activities..." style={searchInput} />
        </div>

        <select value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }} style={filterSelect}>
          {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} style={filterSelect}>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <div style={searchBox}>
          <Search size={14} color="var(--text-muted)" />
          <input value={ipFilter} onChange={(e) => { setIpFilter(e.target.value); setPage(1); }} placeholder="Filter by IP..." style={searchInput} />
        </div>

        <DateRangePicker value={dateRange} onChange={(val) => { setDateRange(val); setPage(1); }} />

        {(search || (module && module !== "All Modules") || (action && action !== "All Actions") || ipFilter || dateRange.preset !== "lifetime") && (
          <button
            onClick={() => { setSearch(""); setModule(""); setAction(""); setIpFilter(""); setDateRange({ from: null, to: null, preset: "lifetime" }); setPage(1); }}
            style={clearBtn}
          >
            Clear Filters
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={exportCSV} style={exportBtn}><Download size={13} /> Export CSV</button>
      </div>

      <div style={tableCard}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)", borderBottom: "1px solid var(--card-border)" }}>
              <Th>Action</Th>
              <Th>Module</Th>
              <Th>Description</Th>
              <Th>User</Th>
              <Th>IP Address</Th>
              <Th>Browser</Th>
              <Th>Time</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={emptyCell}>Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7} style={emptyCell}>No activities found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={cellStyle}><ActionBadge action={log.action} /></td>
                  <td style={cellStyle}><span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", textTransform: "capitalize" }}>{log.module.replace('_', ' ')}</span></td>
                  <td style={{ ...cellStyle, maxWidth: "400px" }}>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)", whiteSpace: "normal" }}>{log.description}</div>
                    {log.entityName && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Entity: {log.entityName} {log.entityId && `(ID: ${log.entityId})`}</div>}
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 500 }}>{log.user.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{log.user.email}</div>
                  </td>
                  <td style={cellStyle}><span style={{ fontFamily: "monospace", fontSize: "12px", color: log.ipAddress && log.ipAddress !== "unknown" ? "var(--text-primary)" : "var(--text-muted)" }}>{log.ipAddress || "—"}</span></td>
                  <td style={cellStyle}><span style={{ fontSize: "12px" }} title={log.userAgent || ""}>{log.userAgent ? parseUserAgent(log.userAgent) : "—"}</span></td>
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
      {action.replace('_', ' ')}
    </span>
  );
}

const searchBox: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "8px", padding: "0 12px", flex: 1, minWidth: "200px", maxWidth: "400px",
};
const searchInput: React.CSSProperties = { border: "none", outline: "none", background: "transparent", fontSize: "13px", color: "var(--text-primary)", height: "36px", width: "100%" };
const filterSelect: React.CSSProperties = { padding: "0 12px", height: "38px", borderRadius: "8px", border: "1px solid var(--card-border)", backgroundColor: "var(--card-bg)", fontSize: "13px", color: "var(--text-primary)", outline: "none", cursor: "pointer", minWidth: "140px" };
const clearBtn: React.CSSProperties = { padding: "6px 12px", fontSize: "12px", backgroundColor: "var(--input-bg)", border: "1px solid var(--card-border)", borderRadius: "6px", color: "var(--text-secondary)", cursor: "pointer" };
const exportBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "12px", backgroundColor: "var(--brand)", border: "none", borderRadius: "6px", color: "white", cursor: "pointer" };
const tableCard: React.CSSProperties = { backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "10px", overflow: "hidden" };
const cellStyle: React.CSSProperties = { padding: "12px 16px", color: "var(--text-primary)", verticalAlign: "middle" };
const emptyCell: React.CSSProperties = { padding: "40px", textAlign: "center", color: "var(--text-muted)" };

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <th style={{ textAlign: align ?? "left", padding: "12px 16px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{children}</th>;
}