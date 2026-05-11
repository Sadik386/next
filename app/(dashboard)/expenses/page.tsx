"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, X, Search, Pencil, Trash2 } from "lucide-react";
import { usePDF } from "@/hooks/usePDF";
import PdfActions from "@/components/ui/PdfActions";

type Expense = {
  id: number;
  expenseId: string;
  date: string;
  amount: string;
  currency: string;
  category: string;
  paymentMethod: string;
  vendor: string;
  receiptId: string | null;
  referenceNo: string | null;
  taxAmount: string;
  taxPercent: string;
  description: string | null;
  notes: string | null;
};

const EXPENSE_CATEGORIES = [
  "Utilities",
  "Rent",
  "Salaries",
  "Marketing",
  "Transport",
  "Office Supplies",
  "Equipment",
  "Maintenance",
  "Food",
  "Insurance",
  "Tax",
  "Bank Charges",
  "Other",
] as const;

const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Upay", "Bank", "Card"] as const;
const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "INR"] as const;

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  date: todayISO(),
  amount: "",
  currency: "BDT",
  category: "",
  paymentMethod: "Cash",
  vendor: "",
  receiptId: "",
  referenceNo: "",
  taxAmount: "0",
  taxPercent: "0",
  description: "",
  notes: "",
});

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState("0");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { downloadPDF, printPDF, isLoading } = usePDF();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    const res = await fetch(`/api/expenses?${params}`);
    if (res.ok) {
      const data = await res.json();
      setExpenses(data.items ?? []);
      setTotalAmount(data.totalAmount ?? "0");
    }
    setLoading(false);
  }, [search, categoryFilter]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  function setField<K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setForm({
      date: e.date.slice(0, 10),
      amount: e.amount,
      currency: e.currency,
      category: e.category,
      paymentMethod: e.paymentMethod,
      vendor: e.vendor,
      receiptId: e.receiptId ?? "",
      referenceNo: e.referenceNo ?? "",
      taxAmount: e.taxAmount,
      taxPercent: e.taxPercent,
      description: e.description ?? "",
      notes: e.notes ?? "",
    });
    setError(null);
    setDrawerOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.amount || Number(form.amount) <= 0) return setError("Amount must be greater than 0");
    if (!form.category) return setError("Category is required");
    if (!form.paymentMethod) return setError("Payment method is required");
    if (!form.vendor.trim()) return setError("Vendor is required");
    if (!form.receiptId.trim()) return setError("Receipt ID is required");

    setSaving(true);
    const body = {
      date: form.date,
      amount: Number(form.amount),
      currency: form.currency,
      category: form.category,
      paymentMethod: form.paymentMethod,
      vendor: form.vendor.trim(),
      receiptId: form.receiptId.trim() || null,
      referenceNo: form.referenceNo.trim() || null,
      taxAmount: Number(form.taxAmount) || 0,
      taxPercent: Number(form.taxPercent) || 0,
      description: form.description.trim() || null,
      notes: form.notes.trim() || null,
    };
    const url = editing ? `/api/expenses/${editing.id}` : "/api/expenses";
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Save failed");
      return;
    }
    setDrawerOpen(false);
    load();
  }

  async function submitDeleteRequest() {
    if (!deleteTarget || !deleteReason.trim()) return;
    setDeleteSubmitting(true);
    const res = await fetch(`/api/expenses/${deleteTarget.id}/delete-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: deleteReason.trim() }),
    });
    setDeleteSubmitting(false);
    if (res.ok) {
      setDeleteTarget(null);
      setDeleteReason("");
    }
  }

  return (
    <div>
      <div style={pageHeader}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>Expenses</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Record business expenses, receipts, and tax info
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <Plus size={14} /> New Expense
        </button>
      </div>

      <div style={totalsBanner}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Total Expenses
        </span>
        <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
          ৳{formatMoney(totalAmount)}
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          (filtered period)
        </span>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div style={searchBox}>
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by expense, vendor, or receipt"
            style={searchInput}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={selectFilter}
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)" }}>
              <Th>Expense ID</Th>
              <Th>Date</Th>
              <Th>Category</Th>
              <Th>Vendor</Th>
              <Th align="right">Amount</Th>
              <Th>Currency</Th>
              <Th>Method</Th>
              <Th>Receipt ID</Th>
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
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={9} style={emptyCell}>
                  No expenses yet. Click &ldquo;New Expense&rdquo; to record one.
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <Td mono>{e.expenseId}</Td>
                  <Td>{new Date(e.date).toLocaleDateString()}</Td>
                  <Td>{e.category}</Td>
                  <Td>{e.vendor}</Td>
                  <Td align="right">{formatMoney(e.amount)}</Td>
                  <Td>{e.currency}</Td>
                  <Td>{e.paymentMethod}</Td>
                  <Td mono>{e.receiptId ?? "—"}</Td>
                  <Td align="right">
                    <div style={{ display: "inline-flex", gap: "4px" }}>
                      <PdfActions
                        groups={[
                          {
                            label: "Expense Voucher",
                            items: [
                              {
                                label: "Download Voucher",
                                icon: (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                  </svg>
                                ),
                                onClick: () => downloadPDF(`/api/pdf/expense-slip/${e.id}`, `expense-${e.expenseId}.pdf`, `exp-dl-${e.id}`),
                                disabled: isLoading(`exp-dl-${e.id}`),
                              },
                              {
                                label: "Print Voucher",
                                icon: (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 6 2 18 2 18 9"/>
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                    <rect x="6" y="14" width="12" height="8"/>
                                  </svg>
                                ),
                                onClick: () => printPDF(`/api/pdf/expense-slip/${e.id}`, `exp-print-${e.id}`),
                                disabled: isLoading(`exp-print-${e.id}`),
                              },
                            ],
                          },
                        ]}
                      />
                      <IconBtn onClick={() => openEdit(e)} title="Edit">
                        <Pencil size={13} />
                      </IconBtn>
                      <IconBtn
                        onClick={() => {
                          setDeleteTarget(e);
                          setDeleteReason("");
                        }}
                        title="Request delete"
                        danger
                      >
                        <Trash2 size={13} />
                      </IconBtn>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={overlay} />
          <aside style={drawer}>
            <div style={drawerHeader}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                {editing ? `Edit Expense ${editing.expenseId}` : "New Expense"}
              </h2>
              <button onClick={() => setDrawerOpen(false)} style={iconButton}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "contents" }}>
              <div style={drawerBody}>
                {editing && (
                  <div>
                    <Label>Expense ID</Label>
                    <input value={editing.expenseId} readOnly style={{ ...inputStyle, opacity: 0.7 }} />
                  </div>
                )}

                <div>
                  <Label required>Date</Label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={twoCol}>
                  <Field
                    label="Amount"
                    required
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(v) => setField("amount", v)}
                  />
                  <div>
                    <Label>Currency</Label>
                    <select
                      value={form.currency}
                      onChange={(e) => setField("currency", e.target.value)}
                      style={inputStyle}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={twoCol}>
                  <div>
                    <Label required>Category</Label>
                    <select
                      value={form.category}
                      onChange={(e) => setField("category", e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select category</option>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label required>Payment Method</Label>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setField("paymentMethod", e.target.value)}
                      style={inputStyle}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Field
                  label="Vendor / Merchant"
                  required
                  value={form.vendor}
                  onChange={(v) => setField("vendor", v)}
                />

                <div style={twoCol}>
                  <Field
                    label="Receipt ID"
                    required
                    value={form.receiptId}
                    onChange={(v) => setField("receiptId", v)}
                  />
                  <Field
                    label="Reference #"
                    value={form.referenceNo}
                    onChange={(v) => setField("referenceNo", v)}
                  />
                </div>

                <div style={twoCol}>
                  <Field
                    label="Tax Amount"
                    type="number"
                    step="0.01"
                    value={form.taxAmount}
                    onChange={(v) => setField("taxAmount", v)}
                  />
                  <Field
                    label="Tax %"
                    type="number"
                    step="0.01"
                    value={form.taxPercent}
                    onChange={(v) => setField("taxPercent", v)}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                {error && <div style={errorBox}>{error}</div>}
              </div>
              <div style={drawerFooter}>
                <button type="button" onClick={() => setDrawerOpen(false)} style={btnSecondary}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Expense"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {deleteTarget && (
        <>
          <div onClick={() => setDeleteTarget(null)} style={modalOverlay} />
          <div style={modalBox}>
            <h3 style={modalTitle}>Request deletion of {deleteTarget.expenseId}</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
              An admin will review this request before the expense is removed.
            </p>
            <Label required>Reason</Label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              placeholder="Why should this expense be deleted?"
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button onClick={() => setDeleteTarget(null)} style={btnSecondary}>
                Cancel
              </button>
              <button
                onClick={submitDeleteRequest}
                disabled={!deleteReason.trim() || deleteSubmitting}
                style={{
                  ...btnPrimary,
                  backgroundColor: "#dc2626",
                  opacity: !deleteReason.trim() || deleteSubmitting ? 0.6 : 1,
                }}
              >
                {deleteSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatMoney(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: "26px",
        height: "26px",
        borderRadius: "6px",
        border: "1px solid var(--card-border)",
        backgroundColor: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        color: danger ? "#dc2626" : disabled ? "var(--text-muted)" : "var(--text-secondary)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

const pageHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const totalsBanner: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "12px",
  padding: "14px 18px",
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  marginBottom: "12px",
};

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

const searchBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  padding: "8px 12px",
  flex: "1 1 280px",
  maxWidth: "360px",
};

const searchInput: React.CSSProperties = {
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "13px",
  color: "var(--text-primary)",
  flex: 1,
};

const selectFilter: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  fontSize: "13px",
  color: "var(--text-primary)",
};

const tableWrap: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  overflow: "hidden",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
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
  padding: "7px 12px",
  borderRadius: "7px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.3)",
  zIndex: 100,
};

const drawer: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  height: "100vh",
  width: "480px",
  maxWidth: "100vw",
  backgroundColor: "var(--card-bg)",
  borderLeft: "1px solid var(--card-border)",
  zIndex: 101,
  display: "flex",
  flexDirection: "column",
};

const drawerHeader: React.CSSProperties = {
  padding: "16px 20px",
  borderBottom: "1px solid var(--card-border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const drawerBody: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "20px",
  display: "grid",
  gap: "12px",
};

const drawerFooter: React.CSSProperties = {
  padding: "12px 20px",
  borderTop: "1px solid var(--card-border)",
  display: "flex",
  gap: "8px",
  justifyContent: "flex-end",
};

const iconButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
};

const errorBox: React.CSSProperties = {
  padding: "8px 12px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  borderRadius: "6px",
  fontSize: "12px",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  zIndex: 110,
};

const modalBox: React.CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "var(--card-bg)",
  borderRadius: "12px",
  padding: "20px",
  width: "440px",
  maxWidth: "90vw",
  zIndex: 111,
  border: "1px solid var(--card-border)",
};

const modalTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "12px",
};

const emptyCell: React.CSSProperties = {
  padding: "32px",
  textAlign: "center",
  color: "var(--text-muted)",
};

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};
