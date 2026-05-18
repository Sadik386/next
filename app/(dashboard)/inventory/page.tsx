"use client";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Clock, Search, X } from "lucide-react";
import DateRangePicker, { DateRangeValue, buildDateFilterParams } from "@/components/ui/DateRangePicker";

type StockStatus = "in_stock" | "low" | "out_of_stock";

type InventoryItem = {
  id: number;
  productId: string;
  name: string;
  sku: string | null;
  unit: string;
  categoryName: string | null;
  productStatus: string;
  stockId: number | null;
  quantity: number;
  threshold: number;
  location: string | null;
  updatedAt: string;
  stockStatus: StockStatus;
};

type StockLogEntry = {
  id: number;
  type: string;
  quantity: number;
  reason: string | null;
  previousQty: number;
  newQty: number;
  createdAt: string;
  createdByUser: { id: number; name: string; email: string } | null;
  product: { id: number; productId: string; name: string; unit: string } | null;
};

type AdjustmentType = "add" | "subtract" | "set";

const REASONS = ["Purchase", "Sale Return", "Damage", "Correction", "Transfer", "Other"];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all");
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: null,
    to: null,
    preset: "lifetime",
  });

  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<AdjustmentType>("add");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustThreshold, setAdjustThreshold] = useState("");
  const [adjustLocation, setAdjustLocation] = useState("");
  const [adjustReason, setAdjustReason] = useState("Purchase");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const [historyTarget, setHistoryTarget] = useState<InventoryItem | null>(null);
  const [historyLogs, setHistoryLogs] = useState<StockLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/inventory?${buildDateFilterParams(params, dateRange)}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
    setLoading(false);
  }, [search, statusFilter, dateRange]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  function openAdjust(item: InventoryItem) {
    setAdjustTarget(item);
    setAdjustType("add");
    setAdjustQty("");
    setAdjustThreshold(String(item.threshold));
    setAdjustLocation(item.location ?? "");
    setAdjustReason("Purchase");
    setAdjustError(null);
  }

  function closeAdjust() {
    setAdjustTarget(null);
    setAdjustError(null);
  }

  async function submitAdjust() {
    if (!adjustTarget) return;
    setAdjustError(null);

    const qtyNum = Number(adjustQty);
    if (adjustQty === "" || Number.isNaN(qtyNum) || qtyNum < 0) {
      setAdjustError("Quantity must be a non-negative number");
      return;
    }

    setAdjustSubmitting(true);
    const res = await fetch(`/api/inventory/${adjustTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: adjustType,
        quantity: qtyNum,
        threshold: adjustThreshold === "" ? undefined : Number(adjustThreshold),
        location: adjustLocation.trim() || null,
        reason: adjustReason,
      }),
    });
    setAdjustSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setAdjustError(data.error ?? "Failed to adjust stock");
      return;
    }

    closeAdjust();
    load();
  }

  async function openHistory(item: InventoryItem) {
    setHistoryTarget(item);
    setHistoryLogs([]);
    setHistoryLoading(true);
    const res = await fetch(`/api/inventory/${item.id}/logs?limit=20`);
    if (res.ok) {
      const data = await res.json();
      setHistoryLogs(data.logs ?? []);
    }
    setHistoryLoading(false);
  }

  function closeHistory() {
    setHistoryTarget(null);
    setHistoryLogs([]);
  }

  const previewQty = (() => {
    if (!adjustTarget) return null;
    const q = Number(adjustQty);
    if (Number.isNaN(q)) return null;
    if (adjustType === "add") return adjustTarget.quantity + q;
    if (adjustType === "subtract") return Math.max(0, adjustTarget.quantity - q);
    return q;
  })();

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Inventory
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Track stock levels and history
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "8px",
            padding: "8px 12px",
            maxWidth: "360px",
            flex: 1,
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, SKU"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: "var(--text-primary)",
              flex: 1,
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StockStatus | "all")}
          style={{
            ...inputStyle,
            maxWidth: "180px",
            padding: "8px 12px",
          }}
        >
          <option value="all">All status</option>
          <option value="in_stock">In Stock</option>
          <option value="low">Low</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)" }}>
              <Th>Product ID</Th>
              <Th>Product Name</Th>
              <Th>SKU</Th>
              <Th align="right">Quantity</Th>
              <Th align="right">Threshold</Th>
              <Th>Status</Th>
              <Th>Location</Th>
              <Th>Last Updated</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={emptyCell}>
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} style={emptyCell}>
                  No inventory items match your filters.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <Td mono>{item.productId}</Td>
                  <Td>{item.name}</Td>
                  <Td>{item.sku ?? "—"}</Td>
                  <Td align="right">
                    {item.quantity} <span style={{ color: "var(--text-muted)" }}>{item.unit}</span>
                  </Td>
                  <Td align="right">{item.threshold}</Td>
                  <Td>
                    <StatusBadge status={item.stockStatus} />
                  </Td>
                  <Td>{item.location ?? "—"}</Td>
                  <Td>{formatDate(item.updatedAt)}</Td>
                  <Td align="right">
                    <div style={{ display: "inline-flex", gap: "4px" }}>
                      <IconBtn onClick={() => openAdjust(item)} title="Adjust Stock">
                        <Pencil size={13} />
                      </IconBtn>
                      <IconBtn onClick={() => openHistory(item)} title="View History">
                        <Clock size={13} />
                      </IconBtn>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {adjustTarget && (
        <>
          <div onClick={closeAdjust} style={overlayStyle} />
          <div style={{ ...modalStyle, width: "480px" }}>
            <div style={modalHeader}>
              <h3 style={modalTitle}>Adjust Stock</h3>
              <button onClick={closeAdjust} style={iconBtnPlain}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <Label>Product</Label>
                <input value={adjustTarget.name} readOnly style={{ ...inputStyle, opacity: 0.7 }} />
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--input-bg)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                }}
              >
                Current: <strong>{adjustTarget.quantity}</strong> {adjustTarget.unit}
              </div>

              <div>
                <Label>Adjustment Type</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                  {(
                    [
                      { v: "add", label: "Add Stock" },
                      { v: "subtract", label: "Remove Stock" },
                      { v: "set", label: "Set Exact" },
                    ] as { v: AdjustmentType; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setAdjustType(opt.v)}
                      style={{
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid var(--input-border)",
                        backgroundColor:
                          adjustType === opt.v ? "var(--brand-light)" : "var(--input-bg)",
                        color: adjustType === opt.v ? "var(--brand)" : "var(--text-secondary)",
                        fontWeight: adjustType === opt.v ? 600 : 400,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label required>Quantity</Label>
                <input
                  type="number"
                  min={0}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {previewQty !== null && adjustQty !== "" && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--brand)",
                    backgroundColor: "var(--brand-light)",
                    padding: "8px 12px",
                    borderRadius: "6px",
                  }}
                >
                  New quantity will be: <strong>{previewQty}</strong> {adjustTarget.unit}
                </div>
              )}

              <div>
                <Label>Low Stock Threshold</Label>
                <input
                  type="number"
                  min={0}
                  value={adjustThreshold}
                  onChange={(e) => setAdjustThreshold(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <Label>Warehouse Location</Label>
                <input
                  value={adjustLocation}
                  onChange={(e) => setAdjustLocation(e.target.value)}
                  placeholder="Optional"
                  style={inputStyle}
                />
              </div>

              <div>
                <Label>Reason</Label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  style={inputStyle}
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {adjustError && (
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  {adjustError}
                </div>
              )}
            </div>

            <div style={modalFooter}>
              <button onClick={closeAdjust} style={btnSecondary}>
                Cancel
              </button>
              <button
                onClick={submitAdjust}
                disabled={adjustSubmitting}
                style={{ ...btnPrimary, opacity: adjustSubmitting ? 0.6 : 1 }}
              >
                {adjustSubmitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </>
      )}

      {historyTarget && (
        <>
          <div onClick={closeHistory} style={overlayStyle} />
          <div style={{ ...modalStyle, width: "640px" }}>
            <div style={modalHeader}>
              <div>
                <h3 style={modalTitle}>Stock History</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {historyTarget.name}
                </p>
              </div>
              <button onClick={closeHistory} style={iconBtnPlain}>
                <X size={16} />
              </button>
            </div>

            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--input-bg)" }}>
                    <Th>Type</Th>
                    <Th align="right">Qty Change</Th>
                    <Th>Reason</Th>
                    <Th>User</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    <tr>
                      <td colSpan={5} style={emptyCell}>
                        Loading...
                      </td>
                    </tr>
                  ) : historyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={emptyCell}>
                        No stock movements yet.
                      </td>
                    </tr>
                  ) : (
                    historyLogs.map((log) => (
                      <tr key={log.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                        <Td>
                          <TypeBadge type={log.type} />
                        </Td>
                        <Td align="right">
                          {log.previousQty} → {log.newQty}
                        </Td>
                        <Td>{log.reason ?? "—"}</Td>
                        <Td>{log.createdByUser?.name ?? "—"}</Td>
                        <Td>{formatDate(log.createdAt)}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: StockStatus }) {
  const map: Record<StockStatus, { label: string; bg: string; color: string }> = {
    in_stock: { label: "In Stock", bg: "#dcfce7", color: "#166534" },
    low: { label: "Low", bg: "#fef3c7", color: "#92400e" },
    out_of_stock: { label: "Out of Stock", bg: "#fee2e2", color: "#991b1b" },
  };
  const s = map[status];
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "999px",
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    add: { bg: "#dcfce7", color: "#166534" },
    subtract: { bg: "#fee2e2", color: "#991b1b" },
    set: { bg: "#dbeafe", color: "#1e40af" },
  };
  const s = map[type] ?? { bg: "#f3f4f6", color: "#374151" };
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "999px",
        backgroundColor: s.bg,
        color: s.color,
        textTransform: "capitalize",
      }}
    >
      {type}
    </span>
  );
}

function formatDate(value: string | Date) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--input-bg)",
  fontSize: "13px",
  color: "var(--text-primary)",
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 14px",
  borderRadius: "7px",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "white",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 14px",
  borderRadius: "7px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  zIndex: 110,
};

const modalStyle: React.CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "var(--card-bg)",
  borderRadius: "12px",
  padding: "20px",
  maxWidth: "92vw",
  maxHeight: "90vh",
  overflowY: "auto",
  zIndex: 111,
  border: "1px solid var(--card-border)",
};

const modalHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
};

const modalTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const modalFooter: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "16px",
};

const iconBtnPlain: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
};

const emptyCell: React.CSSProperties = {
  padding: "32px",
  textAlign: "center",
  color: "var(--text-muted)",
};

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      style={{
        textAlign: align ?? "left",
        padding: "10px 12px",
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  mono,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  mono?: boolean;
}) {
  return (
    <td
      style={{
        padding: "10px 12px",
        textAlign: align ?? "left",
        color: "var(--text-primary)",
        fontFamily: mono ? "ui-monospace, monospace" : undefined,
      }}
    >
      {children}
    </td>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: "26px",
        height: "26px",
        borderRadius: "6px",
        border: "1px solid var(--card-border)",
        backgroundColor: "transparent",
        cursor: "pointer",
        color: "var(--text-secondary)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "12px",
        fontWeight: 500,
        color: "var(--text-secondary)",
        marginBottom: "5px",
      }}
    >
      {children}
      {required && <span style={{ color: "#dc2626" }}> *</span>}
    </label>
  );
}
