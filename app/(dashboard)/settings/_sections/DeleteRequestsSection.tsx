"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import DateRangePicker, { DateRangeValue, buildDateFilterParams } from "@/components/ui/DateRangePicker";
import { readErrorMessage } from "@/lib/read-error-message";

type DeleteRequest = {
  id: number;
  entityType: string;
  entityId: string;
  entityName: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  requester: { name: string; email: string };
  reviewer?: { name: string; email: string };
  reviewedAt?: string;
};

const ENTITY_COLORS: Record<string, string> = {
  order: "#3b82f6",
  product: "#a855f7",
  customer: "#22c55e",
  supplier: "#f59e0b",
  sale: "#6366f1",
  expense: "#ef4444",
};

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default function DeleteRequestsSection() {
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("pending");
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: null,
    to: null,
    preset: "lifetime",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page: page.toString(), pageSize: "15" });
      const res = await fetch(`/api/delete-requests?${buildDateFilterParams(params, dateRange)}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.items ?? []);
        setTotalPages(data.totalPages ?? 1);
      } else {
        toast.error(await readErrorMessage(res, "Failed to load delete requests"));
        setRequests([]);
        setTotalPages(1);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load delete requests");
      setRequests([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [status, page, dateRange]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(id: number, action: "approve" | "reject") {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    setProcessingId(id);
    const res = await fetch(`/api/delete-requests/${id}/${action}`, { method: "POST" });
    setProcessingId(null);
    if (res.ok) {
      toast.success(`Delete request ${action}d`);
      load();
    } else {
      toast.error(await readErrorMessage(res, "Action failed"));
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Delete Requests</h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Review and approve deletion requests from staff</p>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: status === tab.value ? "var(--brand)" : "transparent",
              color: status === tab.value ? "white" : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {tab.label}
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
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)", borderBottom: "1px solid var(--card-border)" }}>
              <Th>Entity</Th>
              <Th>Name / ID</Th>
              <Th>Reason</Th>
              <Th>Requested By</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={emptyCell}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={7} style={emptyCell}>{emptyMessage(status, dateRange)}</td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={cellStyle}>
                    <span style={entityBadge(req.entityType)}>{req.entityType}</span>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{req.entityName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID: {req.entityId}</div>
                  </td>
                  <td style={{ ...cellStyle, maxWidth: "250px" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", whiteSpace: "normal", wordBreak: "break-word" }}>{req.reason}</div>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 500 }}>{req.requester.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{req.requester.email}</div>
                  </td>
                  <td style={cellStyle}><StatusBadge status={req.status} /></td>
                  <td style={{ ...cellStyle, color: "var(--text-muted)", fontSize: "12px" }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                    <br />
                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    {req.status === "pending" ? (
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button onClick={() => handleAction(req.id, "approve")} disabled={processingId !== null} style={{ ...actionBtn, color: "#16a34a", borderColor: "#bbf7d0" }} title="Approve">
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => handleAction(req.id, "reject")} disabled={processingId !== null} style={{ ...actionBtn, color: "#dc2626", borderColor: "#fecaca" }} title="Reject">
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        By: {req.reviewer?.name}
                        <br />
                        {req.reviewedAt && new Date(req.reviewedAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={paginationStyle}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={pageBtn}>←</button>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={pageBtn}>→</button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; fg: string; icon: React.ReactNode }> = {
    pending: { bg: "#fef3c7", fg: "#b45309", icon: <Clock size={12} /> },
    approved: { bg: "#dcfce7", fg: "#166534", icon: <Check size={12} /> },
    rejected: { bg: "#fee2e2", fg: "#991b1b", icon: <X size={12} /> },
  };
  const style = styles[status] || styles.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "999px", backgroundColor: style.bg, color: style.fg }}>
      {style.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function entityBadge(type: string): React.CSSProperties {
  return {
    fontSize: "10px",
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: "4px",
    textTransform: "uppercase",
    backgroundColor: `${ENTITY_COLORS[type.toLowerCase()] || "#6b7280"}15`,
    color: ENTITY_COLORS[type.toLowerCase()] || "#6b7280",
  };
}

function emptyMessage(status: string, dateRange: DateRangeValue) {
  if (status !== "all" || dateRange.preset !== "lifetime") {
    return "No delete requests match the current filters.";
  }
  return "No delete requests yet.";
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

const actionBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "5px 10px",
  borderRadius: "6px",
  border: "1px solid",
  backgroundColor: "transparent",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
};

const pageBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  cursor: "pointer",
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
    <th style={{ textAlign: align ?? "left", padding: "12px 16px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
      {children}
    </th>
  );
}
