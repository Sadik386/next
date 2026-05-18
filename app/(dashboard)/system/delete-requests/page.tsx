"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, X, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar } from "@/components/ui/BulkActionBar";
import { toast } from "sonner";
import DateRangePicker, { DateRangeValue, buildDateFilterParams } from "@/components/ui/DateRangePicker";

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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

export default function DeleteRequestsPage() {
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
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const { selectedIds, selectedCount, isAllSelected, toggle, selectAll, clearSelection, isSelected } = useBulkSelection({ items: requests });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status,
        page: page.toString(),
        pageSize: "15",
      });
      const res = await fetch(`/api/delete-requests?${buildDateFilterParams(params, dateRange)}`);
      const data = await safeJson(res);
      if (res.ok) {
        setRequests(data?.items ?? []);
        setTotalPages(data?.totalPages ?? 1);
      } else {
        toast.error(data?.message || data?.error || "Failed to load delete requests");
        setRequests([]);
        setTotalPages(1);
      }
    } catch {
      toast.error("Failed to load delete requests");
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
    const res = await fetch(`/api/delete-requests/${id}/${action}`, {
      method: "POST",
    });
    setProcessingId(null);

    const data = await safeJson(res);
    if (res.ok && data?.success) {
      toast.success(data.message || `${action} successful`);
      load();
    } else {
      toast.error(data?.message || data?.error || "Action failed");
    }
  }

  async function handleBulkAction(action: "approve" | "reject") {
    if (selectedCount === 0) {
      toast.error("No items selected");
      return;
    }
    if (!confirm(`Are you sure you want to ${action} ${selectedCount} selected requests?`)) return;
    setBulkSubmitting(true);
    try {
      const res = await fetch(`/api/delete-requests/bulk/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await safeJson(res);
      if (res.ok && data) {
        const count = action === "approve" ? data.approved : data.rejected;
        toast.success(`Bulk ${action} completed: ${count} processed, ${data.failed} failed`);
        clearSelection();
        setBulkAction(null);
        load();
      } else {
        toast.error(data?.message || data?.error || "Bulk action failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Delete Requests
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
          Review and approve deletion requests from staff
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            style={{
              ...tabBtn,
              backgroundColor: status === s ? "var(--brand)" : "var(--card-bg)",
              color: status === s ? "white" : "var(--text-secondary)",
              borderColor: status === s ? "var(--brand)" : "var(--card-border)",
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
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
              <Th style={{ width: "40px" }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={selectAll}
                  style={{ cursor: "pointer", width: "16px", height: "16px" }}
                />
              </Th>
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
              <tr><td colSpan={8} style={emptyCell}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={8} style={emptyCell}>{emptyMessage(status, dateRange)}</td></tr>
            ) : (
              requests.map((req) => (
                <tr
                  key={req.id}
                  style={{
                    borderBottom: "1px solid var(--card-border)",
                    backgroundColor: isSelected(req.id) ? "var(--selected-row-bg, #f0f9ff)" : "transparent",
                  }}
                >
                  <td style={cellStyle}>
                    {req.status === "pending" && (
                      <input
                        type="checkbox"
                        checked={isSelected(req.id)}
                        onChange={() => toggle(req.id)}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      />
                    )}
                  </td>
                  <td style={cellStyle}>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                      backgroundColor: `${ENTITY_COLORS[req.entityType.toLowerCase()] || "#6b7280"}15`,
                      color: ENTITY_COLORS[req.entityType.toLowerCase()] || "#6b7280"
                    }}>
                      {req.entityType}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{req.entityName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID: {req.entityId}</div>
                  </td>
                  <td style={{ ...cellStyle, maxWidth: "250px" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", whiteSpace: "normal", wordBreak: "break-word" }}>
                      {req.reason}
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 500 }}>{req.requester.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{req.requester.email}</div>
                  </td>
                  <td style={cellStyle}>
                    <StatusBadge status={req.status} />
                  </td>
                  <td style={{ ...cellStyle, color: "var(--text-muted)", fontSize: "12px" }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                    <br />
                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    {req.status === "pending" ? (
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => handleAction(req.id, "approve")}
                          disabled={processingId !== null}
                          style={{ ...actionBtn, color: "#16a34a", borderColor: "#bbf7d0" }}
                          title="Approve"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "reject")}
                          disabled={processingId !== null}
                          style={{ ...actionBtn, color: "#dc2626", borderColor: "#fecaca" }}
                          title="Reject"
                        >
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
    {selectedCount > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          onClear={clearSelection}
          actions={
            <>
              <button
                onClick={() => setBulkAction("approve")}
                disabled={bulkSubmitting}
                style={{ ...bulkBtn, backgroundColor: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}
              >
                <Check size={14} /> Approve Selected
              </button>
              <button
                onClick={() => setBulkAction("reject")}
                disabled={bulkSubmitting}
                style={{ ...bulkBtn, backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }}
              >
                <X size={14} /> Reject Selected
              </button>
            </>
          }
        />
      )}

      {bulkAction && (
        <div style={modalOverlay} onClick={() => !bulkSubmitting && setBulkAction(null)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
              Bulk {bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)} Delete Requests
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Are you sure you want to {bulkAction} <strong>{selectedCount}</strong> selected delete request{selectedCount > 1 ? "s" : ""}?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setBulkAction(null)}
                disabled={bulkSubmitting}
                style={cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAction(bulkAction)}
                disabled={bulkSubmitting}
                style={{
                  ...confirmBtn,
                  backgroundColor: bulkAction === "approve" ? "#16a34a" : "#dc2626",
                }}
              >
                {bulkSubmitting ? "Processing..." : `Yes, ${bulkAction}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, any> = {
    pending: { bg: "#fef3c7", fg: "#b45309", icon: <Clock size={12} /> },
    approved: { bg: "#dcfce7", fg: "#166534", icon: <Check size={12} /> },
    rejected: { bg: "#fee2e2", fg: "#991b1b", icon: <X size={12} /> },
  };
  const style = styles[status] || styles.pending;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "11px",
      fontWeight: 600,
      padding: "3px 9px",
      borderRadius: "999px",
      backgroundColor: style.bg,
      color: style.fg
    }}>
      {style.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
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

const tabBtn: React.CSSProperties = {
  padding: "7px 16px",
  borderRadius: "8px",
  border: "1px solid",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s",
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

const bulkBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalCard: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  padding: "24px",
  width: "420px",
  maxWidth: "90vw",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
};

const cancelBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const confirmBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "none",
  color: "white",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

function Th({ children, align, style }: { children: React.ReactNode; align?: "left" | "right"; style?: React.CSSProperties }) {
  return (
    <th style={{
      textAlign: align ?? "left",
      padding: "12px 16px",
      fontSize: "11px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "var(--text-muted)",
      ...style,
    }}>
      {children}
    </th>
  );
}