"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X, Search, Eye, Trash2, Pencil, ScanLine, FileText, Truck } from "lucide-react";
import BarcodeDisplay from "@/components/ui/BarcodeDisplay";
import { usePDF } from "@/hooks/usePDF";
import { FloatingPopover } from "@/components/ui/FloatingPopover";

type OrderListItem = {
  id: number;
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  totalAmount: string;
  paidAmount: string;
  createdAt: string;
  customer: { id: number; customerId: string; name: string; email: string | null; mobile: string };
  _count: { items: number };
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

const STATUS_OPTIONS = ["pending", "confirmed", "delivered", "cancelled"] as const;
const PAYMENT_STATUS_OPTIONS = ["unpaid", "partial", "paid"] as const;
const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Upay", "Bank", "Card"] as const;

type OrderItemDraft = {
  key: string;
  productId: number | null;
  quantity: number;
  unitPrice: string;
};

const newItem = (): OrderItemDraft => ({
  key: Math.random().toString(36).slice(2),
  productId: null,
  quantity: 1,
  unitPrice: "",
});

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const { downloadPDF, printPDF, isLoading } = usePDF();

  const [createOpen, setCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItemDraft[]>([newItem()]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<OrderListItem | null>(null);
  const [editStatus, setEditStatus] = useState<string>("pending");
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>("unpaid");
  const [editPaidAmount, setEditPaidAmount] = useState<string>("0");
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OrderListItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [barcodeTarget, setBarcodeTarget] = useState<OrderListItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (paymentFilter) params.set("paymentStatus", paymentFilter);
    const res = await fetch(`/api/orders?${params}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.items ?? []);
    }
    setLoading(false);
  }, [search, statusFilter, paymentFilter]);

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
    setCustomerId(null);
    setItems([newItem()]);
    setPaymentMethod("");
    setShippingAddress("");
    setBillingAddress("");
    setNotes("");
    setTaxRate("0");
    setDiscountAmount("0");
    setPaidAmount("0");
    setError(null);
    setCreateOpen(true);
    loadOptions();
  }

  function onCustomerChange(id: number) {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (c) {
      setShippingAddress(c.shippingAddress ?? c.streetAddress ?? "");
      setBillingAddress(c.billingAddress ?? c.streetAddress ?? "");
    }
  }

  function updateItem(key: string, patch: Partial<OrderItemDraft>) {
    setItems((rows) =>
      rows.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (patch.productId !== undefined && patch.productId !== null) {
          const p = products.find((x) => x.id === patch.productId);
          if (p && (!r.unitPrice || r.productId !== patch.productId)) {
            next.unitPrice = p.salePrice;
          }
        }
        return next;
      })
    );
  }

  function removeItem(key: string) {
    setItems((rows) => (rows.length === 1 ? rows : rows.filter((r) => r.key !== key)));
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, r) => {
      const qty = Number(r.quantity) || 0;
      const price = Number(r.unitPrice) || 0;
      return acc + qty * price;
    }, 0);
    const tax = subtotal * (Number(taxRate) || 0) / 100;
    const discount = Number(discountAmount) || 0;
    const total = Math.max(0, subtotal + tax - discount);
    return { subtotal, tax, discount, total };
  }, [items, taxRate, discountAmount]);

  async function submitOrder() {
    setError(null);
    if (!customerId) return setError("Select a customer");
    const cleanItems = items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (cleanItems.length === 0) return setError("Add at least one item");
    for (const i of cleanItems) {
      if (!i.unitPrice || Number(i.unitPrice) < 0) return setError("Unit price is required for all items");
    }

    setSaving(true);
    const body = {
      customerId,
      paymentMethod: paymentMethod || null,
      shippingAddress: shippingAddress || null,
      billingAddress: billingAddress || null,
      notes: notes || null,
      taxRate: Number(taxRate) || 0,
      discountAmount: Number(discountAmount) || 0,
      paidAmount: Number(paidAmount) || 0,
      items: cleanItems.map((i) => ({
        productId: i.productId!,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      })),
    };
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Save failed");
      return;
    }
    setCreateOpen(false);
    load();
  }

  function openEdit(o: OrderListItem) {
    setEditTarget(o);
    setEditStatus(o.status);
    setEditPaymentStatus(o.paymentStatus);
    setEditPaidAmount(o.paidAmount);
  }

  async function submitEdit() {
    if (!editTarget) return;
    setEditSaving(true);
    if (editStatus !== editTarget.status) {
      await fetch(`/api/orders/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });
    }
    if (
      editPaymentStatus !== editTarget.paymentStatus ||
      Number(editPaidAmount) !== Number(editTarget.paidAmount)
    ) {
      await fetch(`/api/orders/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: editPaymentStatus,
          paidAmount: Number(editPaidAmount) || 0,
        }),
      });
    }
    setEditSaving(false);
    setEditTarget(null);
    load();
  }

  async function submitDeleteRequest() {
    if (!deleteTarget) return;
    if (!deleteReason.trim()) return;
    setDeleteSubmitting(true);
    const res = await fetch(`/api/orders/${deleteTarget.id}/delete-request`, {
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
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>Orders</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Manage customer orders, payments, and fulfillment
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <Plus size={14} /> New Order
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div style={searchBox}>
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order or customer"
            style={searchInput}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={selectFilter}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
      </div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)" }}>
              <Th>Order ID</Th>
              <Th>Customer</Th>
              <Th align="right">Amount</Th>
              <Th align="right">Paid</Th>
              <Th>Status</Th>
              <Th>Payment</Th>
              <Th>Date</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={emptyCell}>
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={emptyCell}>
                  No orders yet. Click &ldquo;New Order&rdquo; to create one.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <Td mono>{o.orderId}</Td>
                  <Td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{o.customer.name}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {o.customer.customerId}
                      </span>
                    </div>
                  </Td>
                  <Td align="right">{formatMoney(o.totalAmount)}</Td>
                  <Td align="right">{formatMoney(o.paidAmount)}</Td>
                  <Td>
                    <StatusBadge value={o.status} />
                  </Td>
                  <Td>
                    <PaymentBadge value={o.paymentStatus} />
                  </Td>
                  <Td>{new Date(o.createdAt).toLocaleDateString()}</Td>
                  <Td align="right">
                    <div style={{ display: "inline-flex", gap: "4px" }}>
                      <Link href={`/orders/${o.id}`} style={{ textDecoration: "none" }}>
                        <IconBtn title="View">
                          <Eye size={13} />
                        </IconBtn>
                      </Link>
                      <IconBtn onClick={() => setBarcodeTarget(o)} title="Show barcode">
                        <ScanLine size={13} />
                      </IconBtn>
                      <IconBtn onClick={() => openEdit(o)} title="Edit">
                        <Pencil size={13} />
                      </IconBtn>
                      <FloatingPopover
                        trigger={
                          <IconBtn title="Invoice" disabled={isLoading(`inv-dl-${o.id}`) || isLoading(`inv-print-${o.id}`)}>
                            <FileText size={13} />
                          </IconBtn>
                        }
                        items={[
                          {
                            label: "Download Invoice",
                            icon: (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            ),
                            onClick: () => downloadPDF(`/api/pdf/invoice/${o.id}`, `invoice-${o.orderId}.pdf`, `inv-dl-${o.id}`),
                            disabled: isLoading(`inv-dl-${o.id}`),
                          },
                          {
                            label: "Print Invoice",
                            icon: (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 6 2 18 2 18 9"/>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                <rect x="6" y="14" width="12" height="8"/>
                              </svg>
                            ),
                            onClick: () => printPDF(`/api/pdf/invoice/${o.id}`, `inv-print-${o.id}`),
                            disabled: isLoading(`inv-print-${o.id}`),
                          },
                        ]}
                      />
                      <FloatingPopover
                        trigger={
                          <IconBtn title="Delivery Slip" disabled={isLoading(`del-dl-${o.id}`) || isLoading(`del-print-${o.id}`)}>
                            <Truck size={13} />
                          </IconBtn>
                        }
                        items={[
                          {
                            label: "Download Slip",
                            icon: (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            ),
                            onClick: () => downloadPDF(`/api/pdf/delivery-slip/${o.id}`, `delivery-${o.orderId}.pdf`, `del-dl-${o.id}`),
                            disabled: isLoading(`del-dl-${o.id}`),
                          },
                          {
                            label: "Print Slip",
                            icon: (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 6 2 18 2 18 9"/>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                <rect x="6" y="14" width="12" height="8"/>
                              </svg>
                            ),
                            onClick: () => printPDF(`/api/pdf/delivery-slip/${o.id}`, `del-print-${o.id}`),
                            disabled: isLoading(`del-print-${o.id}`),
                          },
                        ]}
                      />
                      <IconBtn
                        onClick={() => {
                          setDeleteTarget(o);
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

      {createOpen && (
        <>
          <div onClick={() => setCreateOpen(false)} style={overlay} />
          <aside style={drawer}>
            <div style={drawerHeader}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                New Order
              </h2>
              <button onClick={() => setCreateOpen(false)} style={iconButton}>
                <X size={16} />
              </button>
            </div>
            <div style={drawerBody}>
              <div>
                <Label required>Customer</Label>
                <select
                  value={customerId ?? ""}
                  onChange={(e) => onCustomerChange(Number(e.target.value))}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <Label required>Order Items</Label>
                  <button
                    type="button"
                    onClick={() => setItems((r) => [...r, newItem()])}
                    style={btnGhost}
                  >
                    <Plus size={12} /> Add Item
                  </button>
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {items.map((row) => {
                    const product = products.find((p) => p.id === row.productId);
                    const lineTotal = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
                    return (
                      <div key={row.key} style={itemRow}>
                        <select
                          value={row.productId ?? ""}
                          onChange={(e) =>
                            updateItem(row.key, {
                              productId: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          style={{ ...inputStyle, gridColumn: "span 2" }}
                        >
                          <option value="">Select product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.productId})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) =>
                            updateItem(row.key, { quantity: Math.max(1, Number(e.target.value) || 1) })
                          }
                          placeholder="Qty"
                          style={inputStyle}
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={row.unitPrice}
                          onChange={(e) => updateItem(row.key, { unitPrice: e.target.value })}
                          placeholder="Unit price"
                          style={inputStyle}
                        />
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            fontSize: "13px",
                            color: "var(--text-primary)",
                            fontWeight: 500,
                          }}
                        >
                          {lineTotal.toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(row.key)}
                          style={iconButton}
                          title="Remove"
                          disabled={items.length === 1}
                        >
                          <X size={14} />
                        </button>
                        {product && (
                          <p
                            style={{
                              gridColumn: "1 / -1",
                              fontSize: "11px",
                              color: "var(--text-muted)",
                              marginTop: "-2px",
                            }}
                          >
                            Unit: {product.unit}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <Label>Payment Method</Label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">—</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Paid Amount"
                  type="number"
                  value={paidAmount}
                  onChange={setPaidAmount}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="Tax %" type="number" value={taxRate} onChange={setTaxRate} />
                <Field
                  label="Discount"
                  type="number"
                  value={discountAmount}
                  onChange={setDiscountAmount}
                />
              </div>

              <div>
                <Label>Shipping Address</Label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
              <div>
                <Label>Billing Address</Label>
                <textarea
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={summaryBox}>
                <SummaryRow label="Subtotal" value={totals.subtotal} />
                <SummaryRow label={`Tax (${taxRate || 0}%)`} value={totals.tax} />
                <SummaryRow label="Discount" value={-totals.discount} />
                <SummaryRow label="Total" value={totals.total} bold />
              </div>

              {error && <div style={errorBox}>{error}</div>}
            </div>
            <div style={drawerFooter}>
              <button type="button" onClick={() => setCreateOpen(false)} style={btnSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={submitOrder}
                disabled={saving}
                style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Creating..." : "Create Order"}
              </button>
            </div>
          </aside>
        </>
      )}

      {editTarget && (
        <>
          <div onClick={() => setEditTarget(null)} style={modalOverlay} />
          <div style={modalBox}>
            <h3 style={modalTitle}>Update Order {editTarget.orderId}</h3>
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <Label>Order Status</Label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={inputStyle}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Payment Status</Label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                  style={inputStyle}
                >
                  {PAYMENT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {editPaymentStatus === "partial" && (
                <Field
                  label="Paid Amount"
                  type="number"
                  value={editPaidAmount}
                  onChange={setEditPaidAmount}
                />
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button onClick={() => setEditTarget(null)} style={btnSecondary}>
                Cancel
              </button>
              <button
                onClick={submitEdit}
                disabled={editSaving}
                style={{ ...btnPrimary, opacity: editSaving ? 0.6 : 1 }}
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </>
      )}

      {barcodeTarget && (
        <>
          <div onClick={() => setBarcodeTarget(null)} style={modalOverlay} />
          <div style={modalBox}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3 style={modalTitle}>Order Barcode</h3>
              <button onClick={() => setBarcodeTarget(null)} style={iconButton}>
                <X size={16} />
              </button>
            </div>
            <BarcodeDisplay
              value={barcodeTarget.orderId}
              label={`${barcodeTarget.orderId} — ${barcodeTarget.customer.name}`}
            />
          </div>
        </>
      )}

      {deleteTarget && (
        <>
          <div onClick={() => setDeleteTarget(null)} style={modalOverlay} />
          <div style={modalBox}>
            <h3 style={modalTitle}>Request deletion of {deleteTarget.orderId}</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
              An admin will review this request before the order is removed.
            </p>
            <Label required>Reason</Label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              placeholder="Why should this order be deleted?"
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

function StatusBadge({ value }: { value: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    pending: { bg: "#fef3c7", fg: "#92400e" },
    confirmed: { bg: "#dbeafe", fg: "#1e40af" },
    delivered: { bg: "#dcfce7", fg: "#166534" },
    cancelled: { bg: "#fee2e2", fg: "#991b1b" },
  };
  const c = colors[value] ?? { bg: "#f3f4f6", fg: "#6b7280" };
  return <span style={badge(c.bg, c.fg)}>{value}</span>;
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

function SummaryRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
        padding: "4px 0",
        fontWeight: bold ? 700 : 400,
        color: bold ? "var(--text-primary)" : "var(--text-secondary)",
        borderTop: bold ? "1px solid var(--card-border)" : "none",
        marginTop: bold ? "4px" : 0,
        paddingTop: bold ? "8px" : "4px",
      }}
    >
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
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

const btnGhost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 8px",
  borderRadius: "6px",
  border: "1px dashed var(--input-border)",
  backgroundColor: "transparent",
  color: "var(--text-secondary)",
  fontSize: "12px",
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
  width: "560px",
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

const itemRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 80px 100px 90px 28px",
  gap: "6px",
  alignItems: "center",
};

const summaryBox: React.CSSProperties = {
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  padding: "10px 14px",
  backgroundColor: "var(--input-bg)",
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}
