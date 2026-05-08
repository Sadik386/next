"use client";
import { useCallback, useEffect, useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Activity } from "lucide-react";

type LogEntry = {
  id: number;
  action: string;
  module: string;
  entityId?: string;
  entityName?: string;
  description: string;
  createdAt: string;
  user: { name: string; email: string };
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

const MODULES = [
  "All Modules", "User", "Role", "Product", "Category", "Inventory", 
  "Order", "Sale", "Expense", "Customer", "Supplier", "Delete_Request"
];

const ACTIONS = [
  "All Actions", "Create", "Update", "Delete", "Delete_Request", 
  "Approved", "Rejected", "Activate", "Deactivate", "Change_Role"
];

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: "20",
    });
    if (module && module !== "All Modules") params.set("module", module.toLowerCase());
    if (action && action !== "All Actions") params.set("action", action.toLowerCase());
    if (search) params.set("search", search);

    const res = await fetch(`/api/activity-logs?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.items);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [module, action, search, page]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Activity Log
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
          Complete audit trail of all system activities
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={searchBox}>
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search activities..."
            style={searchInput}
          />
        </div>

        <select
          value={module}
          onChange={(e) => { setModule(e.target.value); setPage(1); }}
          style={filterSelect}
        >
          {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          style={filterSelect}
        >
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div style={tableCard}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)", borderBottom: "1px solid var(--card-border)" }}>
              <Th>Action</Th>
              <Th>Module</Th>
              <Th>Description</Th>
              <Th>User</Th>
              <Th>Time</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={emptyCell}>Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} style={emptyCell}>No activities found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={cellStyle}>
                    <ActionBadge action={log.action} />
                  </td>
                  <td style={cellStyle}>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", textTransform: "capitalize" }}>
                      {log.module.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, maxWidth: "400px" }}>
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
                    <div style={{ fontWeight: 500 }}>{log.user.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{log.user.email}</div>
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

        {totalPages > 1 && (
          <div style={paginationStyle}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={pageBtn}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={pageBtn}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
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

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th style={{
      textAlign: align ?? "left",
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
