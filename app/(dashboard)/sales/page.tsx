"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X, Search, Pencil, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { usePDF } from "@/hooks/usePDF";
import { FloatingPopover } from "@/components/ui/FloatingPopover";
import DateRangePicker, { DateRangeValue, buildDateFilterParams } from "@/components/ui/DateRangePicker";
import { readErrorMessage } from "@/lib/read-error-message";

type SaleListItem = {
  id: number;
  orderId: number | null;
  orderIdDisplay: string | null;
  saleId: string;
  date: string;
  quantity?: number;
  unitPrice?: string;
  totalAmount: string;
  taxAmount?: string;
  discountAmount?: string;
  paymentStatus: string;
  paymentMethod: string | null;
  returnStatus?: string;
  productName?: string | null;
  productId?: number | null;
  customerId: number | null;
  customer: { id: number; customerId: string; name: string } | null;
  product?: { id: number; productId: string; name: string; unit: string } | null;
  shippingAddress?: string | null;
  billingAddress?: string | null;
  deliveryDate?: string | null;
  trackingNumber?: string | null;
  warrantyPeriod?: string | null;
  salesCommission?: string;
  notes?: string | null;
  items?: number;
  totalQuantity?: number;
  paidAmount?: string;
  dueAmount?: string;
};

type CustomerOption = {
  id: number;
  customerId: string;
  name: string;
  email: string | null;
  mobile: string;
  streetAddress: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
};

type ProductOption = {
  id: number;
  productId: string;
  name: string;
  unit: string;
  salePrice: string;
};

const PAYMENT_STATUS_OPTIONS = ["unpaid", "partial", "paid"] as const;
const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Upay", "Bank", "Card"] as const;
const RETURN_STATUS_OPTIONS = ["none", "requested", "approved", "completed"] as const;

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  date: todayISO(),
  customerId: "" as number | "",
  productId: "" as number | "",
  quantity: "1",
  unitPrice: "",
  taxAmount: "0",
  discountAmount: "0",
  paymentStatus: "unpaid",
  paymentMethod: "Cash",
  shippingAddress: "",
  billingAddress: "",
  deliveryDate: "",
  trackingNumber: "",
  warrantyPeriod: "",
  salesCommission: "0",
  returnStatus: "none",
  notes: "",
});

export default function SalesPage() {
  const searchParams = useSearchParams();
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: null, to: null, preset: "this_month" });
  const { downloadPDF, printPDF, isLoading } = usePDF();

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SaleListItem | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SaleListItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("grouped", "true");
    if (search) params.set("search", search);
    if (paymentFilter) params.set("paymentStatus", paymentFilter);
    const res = await fetch(`/api/sales?${buildDateFilterParams(params, dateRange)}`);
    if (res.ok) {
      const data = await res.json();
      setSales(data.items ?? []);
    }
    setLoading(false);
  }, [search, paymentFilter, dateRange]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function loadOptions() {
    const [cRes, pRes] = await Promise.all([
      fetch("/api/customers?pageSize=100"),
      fetch("/api/products?pageSize=100"),
    ]);
    if (cRes.ok) {
      const d = await cRes.json();
      setCustomers(d.items ?? []);
    }
    if (pRes.ok) {
      const d = await pRes.json();
      setProducts(d.items ?? []);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setDrawerOpen(true);
    loadOptions();
  }

  function openEdit(s: SaleListItem) {
    setEditing(s);
    setForm({
      date: s.date.slice(0, 10),
      customerId: s.customerId ?? "",
      productId: s.productId ?? "",
      quantity: String(s.quantity ?? 1),
      unitPrice: s.unitPrice ?? "",
      taxAmount: s.taxAmount ?? "0",
      discountAmount: s.discountAmount ?? "0",
      paymentStatus: s.paymentStatus,
      paymentMethod: s.paymentMethod ?? "Cash",
      shippingAddress: s.shippingAddress ?? "",
      billingAddress: s.billingAddress ?? "",
      deliveryDate: s.deliveryDate ? s.deliveryDate.slice(0, 10) : "",
      trackingNumber: s.trackingNumber ?? "",
      warrantyPeriod: s.warrantyPeriod ?? "",
      salesCommission: s.salesCommission ?? "0",
      returnStatus: s.returnStatus ?? "none",
      notes: s.notes ?? "",
    });
    setError(null);
    setDrawerOpen(true);
    loadOptions();
  }

  function setField<K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onCustomerChange(id: number | "") {
    setForm((f) => {
      const next = { ...f, customerId: id };
      if (id) {
        const c = customers.find((x) => x.id === id);
        if (c) {
          if (!f.shippingAddress) next.shippingAddress = c.shippingAddress ?? c.streetAddress ?? "";
          if (!f.billingAddress) next.billingAddress = c.billingAddress ?? c.streetAddress ?? "";
        }
      }
      return next;
    });
  }

  function onProductChange(id: number | "") {
    setForm((f) => {
      const next = { ...f, productId: id };
      if (id) {
        const p = products.find((x) => x.id === id);
        if (p && (!f.unitPrice || Number(f.unitPrice) === 0)) {
          next.unitPrice = p.salePrice;
        }
      }
      return next;
    });
  }

  const totalAmount = useMemo(() => {
    const qty = Number(form.quantity) || 0;
    const price = Number(form.unitPrice) || 0;
    const tax = Number(form.taxAmount) || 0;
    const disc = Number(form.discountAmount) || 0;
    return Math.max(0, qty * price + tax - disc);
  }, [form.quantity, form.unitPrice, form.taxAmount, form.discountAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.customerId) return setError("Customer is required");
    if (!form.productId) return setError("Product is required");
    if (!form.unitPrice || Number(form.unitPrice) < 0) return setError("Valid unit price is required");
    if (!form.quantity || Number(form.quantity) < 1) return setError("Quantity must be at least 1");

    const wasEditing = Boolean(editing);
    setSaving(true);
    const body = {
      date: form.date,
      customerId: Number(form.customerId),
      productId: Number(form.productId),
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      taxAmount: Number(form.taxAmount) || 0,
      discountAmount: Number(form.discountAmount) || 0,
      paymentStatus: form.paymentStatus,
      paymentMethod: form.paymentMethod,
      shippingAddress: form.shippingAddress || null,
      billingAddress: form.billingAddress || null,
      deliveryDate: form.deliveryDate || null,
      trackingNumber: form.trackingNumber || null,
      warrantyPeriod: form.warrantyPeriod || null,
      salesCommission: Number(form.salesCommission) || 0,
      returnStatus: form.returnStatus,
      notes: form.notes || null,
    };
    const url = editing ? `/api/sales/${editing.id}` : "/api/sales";
    try {
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res, "Save failed"));
        return;
      }
      setDrawerOpen(false);
      toast.success(wasEditing ? "Sale updated" : "Sale created");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function submitDeleteRequest() {
    if (!deleteTarget || !deleteReason.trim()) return;
    const targetName = deleteTarget.saleId;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/sales/${deleteTarget.id}/delete-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason.trim() }),
      });
      if (!res.ok) {
        toast.error(await readErrorMessage(res, "Delete request failed"));
        return;
      }
      setDeleteTarget(null);
      setDeleteReason("");
      toast.success(`Delete request submitted for ${targetName}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete request failed");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div>
      <div style={pageHeader}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>Sales</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Track every sale, payment status, and return
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <Plus size={14} /> New Sale
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div style={searchBox}>
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sale, customer, or product"
            style={searchInput}
          />
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          style={selectFilter}
        >
          <option value="">All payments</option>
          {PAYMENT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)" }}>
              <Th>Transaction</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th align="right">Items</Th>
              <Th align="right">Qty</Th>
              <Th align="right">Total</Th>
              <Th align="right">Paid</Th>
              <Th align="right">Due</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
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
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={9} style={emptyCell}>
                  No sales yet. Click &ldquo;New Sale&rdquo; to record one.
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <Td mono>
                    {s.orderIdDisplay ? (
                      <span style={{ display: "flex", flexDirection: "column" }}>
                        <span>{s.orderIdDisplay}</span>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.saleId}</span>
                      </span>
                    ) : (
                      s.saleId
                    )}
                  </Td>
                  <Td>{new Date(s.date).toLocaleDateString()}</Td>
                  <Td>
                    {s.customer ? (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{s.customer.name}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {s.customer.customerId}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </Td>
                  <Td align="right">{s.items ?? 1}</Td>
                  <Td align="right">{s.totalQuantity ?? s.quantity ?? 1}</Td>
                  <Td align="right">{formatMoney(s.totalAmount)}</Td>
                  <Td align="right">{formatMoney(s.paidAmount ?? s.totalAmount)}</Td>
                  <Td align="right">{s.dueAmount && Number(s.dueAmount) > 0 ? formatMoney(s.dueAmount) : "—"}</Td>
                  <Td>{s.paymentMethod ?? "—"}</Td>
                  <Td>
                    <PaymentBadge value={s.paymentStatus} />
                  </Td>
                  <Td align="right">
                    <div style={{ display: "inline-flex", gap: "4px" }}>
                      <FloatingPopover
                        trigger={
                          <IconBtn title="Receipt" disabled={isLoading(`rec-dl-${s.id}`) || isLoading(`rec-print-${s.id}`)}>
                            <Receipt size={13} />
                          </IconBtn>
                        }
                        items={[
                          {
                            label: "Download Receipt",
                            icon: (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            ),
                            onClick: () => downloadPDF(`/api/pdf/receipt/${s.orderId ?? s.id}`, `receipt-${s.orderIdDisplay ?? s.saleId}.pdf`, `rec-dl-${s.id}`),
                            disabled: isLoading(`rec-dl-${s.id}`),
                          },
                          {
                            label: "Print Receipt",
                            icon: (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 6 2 18 2 18 9"/>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                <rect x="6" y="14" width="12" height="8"/>
                              </svg>
                            ),
                            onClick: () => printPDF(`/api/pdf/receipt/${s.orderId ?? s.id}`, `rec-print-${s.id}`),
                            disabled: isLoading(`rec-print-${s.id}`),
                          },
                        ]}
                      />
                      {!s.orderId && (
                        <>
                          <IconBtn onClick={() => openEdit(s)} title="Edit">
                            <Pencil size={13} />
                          </IconBtn>
                          <IconBtn
                            onClick={() => {
                              setDeleteTarget(s);
                              setDeleteReason("");
                            }}
                            title="Request delete"
                            danger
                          >
                            <Trash2 size={13} />
                          </IconBtn>
                        </>
                      )}
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
                {editing ? `Edit Sale ${editing.saleId}` : "New Sale"}
              </h2>
              <button onClick={() => setDrawerOpen(false)} style={iconButton}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "contents" }}>
              <div style={drawerBody}>
                {editing && (
                  <div>
                    <Label>Sale ID</Label>
                    <input value={editing.saleId} readOnly style={{ ...inputStyle, opacity: 0.7 }} />
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

                <div>
                  <Label required>Customer</Label>
                  <select
                    value={form.customerId}
                    onChange={(e) => onCustomerChange(e.target.value ? Number(e.target.value) : "")}
                    style={inputStyle}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.customerId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label required>Product</Label>
                  <select
                    value={form.productId}
                    onChange={(e) => onProductChange(e.target.value ? Number(e.target.value) : "")}
                    style={inputStyle}
                  >
                    <option value="">Select a product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.productId})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={twoCol}>
                  <Field
                    label="Quantity"
                    required
                    type="number"
                    value={form.quantity}
                    onChange={(v) => setField("quantity", v)}
                  />
                  <Field
                    label="Unit Price"
                    required
                    type="number"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={(v) => setField("unitPrice", v)}
                  />
                </div>

                <div style={twoCol}>
                  <Field
                    label="Tax / VAT"
                    type="number"
                    step="0.01"
                    value={form.taxAmount}
                    onChange={(v) => setField("taxAmount", v)}
                  />
                  <Field
                    label="Discount"
                    type="number"
                    step="0.01"
                    value={form.discountAmount}
                    onChange={(v) => setField("discountAmount", v)}
                  />
                </div>

                <div>
                  <Label>Total Amount</Label>
                  <input
                    value={totalAmount.toFixed(2)}
                    readOnly
                    style={{ ...inputStyle, opacity: 0.7, fontWeight: 600 }}
                  />
                </div>

                <div style={twoCol}>
                  <div>
                    <Label required>Payment Status</Label>
                    <select
                      value={form.paymentStatus}
                      onChange={(e) => setField("paymentStatus", e.target.value)}
                      style={inputStyle}
                    >
                      {PAYMENT_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
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

                <div>
                  <Label>Shipping Address</Label>
                  <textarea
                    value={form.shippingAddress}
                    onChange={(e) => setField("shippingAddress", e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                <div>
                  <Label>Billing Address</Label>
                  <textarea
                    value={form.billingAddress}
                    onChange={(e) => setField("billingAddress", e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                <div style={twoCol}>
                  <div>
                    <Label>Delivery Date</Label>
                    <input
                      type="date"
                      value={form.deliveryDate}
                      onChange={(e) => setField("deliveryDate", e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <Field
                    label="Tracking Number"
                    value={form.trackingNumber}
                    onChange={(v) => setField("trackingNumber", v)}
                  />
                </div>

                <div style={twoCol}>
                  <Field
                    label="Warranty Period"
                    value={form.warrantyPeriod}
                    onChange={(v) => setField("warrantyPeriod", v)}
                  />
                  <Field
                    label="Sales Commission"
                    type="number"
                    step="0.01"
                    value={form.salesCommission}
                    onChange={(v) => setField("salesCommission", v)}
                  />
                </div>

                <div>
                  <Label>Return Status</Label>
                  <select
                    value={form.returnStatus}
                    onChange={(e) => setField("returnStatus", e.target.value)}
                    style={inputStyle}
                  >
                    {RETURN_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
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
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Sale"}
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
            <h3 style={modalTitle}>Request deletion of {deleteTarget.saleId}</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
              An admin will review this request before the sale is removed.
            </p>
            <Label required>Reason</Label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              placeholder="Why should this sale be deleted?"
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

function PaymentBadge({ value }: { value: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    unpaid: { bg: "#fee2e2", fg: "#991b1b" },
    partial: { bg: "#fef3c7", fg: "#92400e" },
    paid: { bg: "#dcfce7", fg: "#166534" },
  };
  const c = colors[value] ?? { bg: "#f3f4f6", fg: "#6b7280" };
  return <span style={badge(c.bg, c.fg)}>{value}</span>;
}

function ReturnBadge({ value }: { value: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    none: { bg: "#f3f4f6", fg: "#6b7280" },
    requested: { bg: "#fef3c7", fg: "#92400e" },
    approved: { bg: "#dbeafe", fg: "#1e40af" },
    completed: { bg: "#dcfce7", fg: "#166534" },
  };
  const c = colors[value] ?? { bg: "#f3f4f6", fg: "#6b7280" };
  return <span style={badge(c.bg, c.fg)}>{value}</span>;
}

function badge(bg: string, fg: string): React.CSSProperties {
  return {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "999px",
    backgroundColor: bg,
    color: fg,
    textTransform: "capitalize",
  };
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
