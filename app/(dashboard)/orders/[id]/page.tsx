"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, use } from "react";
import { ArrowLeft, ChevronDown, Trash2, Check, Circle, FileText, Truck } from "lucide-react";
import { toast } from "sonner";
import { BarcodePopup } from "@/components/ui/BarcodePopup";
import { usePDF } from "@/hooks/usePDF";
import { FloatingPopover } from "@/components/ui/FloatingPopover";
import { readErrorMessage } from "@/lib/read-error-message";

type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  product: { id: number; productId: string; name: string; unit: string; imageUrl: string | null };
};

type Order = {
  id: number;
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;
  shippingAddress: string | null;
  billingAddress: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    customerId: string;
    name: string;
    email: string | null;
    mobile: string;
    streetAddress: string | null;
    city: string | null;
  };
  createdByUser: { id: number; name: string; email: string };
  items: OrderItem[];
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState("0");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const { downloadPDF, printPDF, isLoading } = usePDF();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/orders/${id}`);
    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function setStatus(status: string) {
    setStatusOpen(false);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error(await readErrorMessage(res, "Status update failed"));
        return;
      }
      toast.success("Order status updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function setPayment(paymentStatus: string, paidAmount?: number) {
    setPaymentOpen(false);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus, paidAmount }),
      });
      if (!res.ok) {
        toast.error(await readErrorMessage(res, "Payment update failed"));
        return;
      }
      toast.success("Payment updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment update failed");
    }
  }

  async function submitPartial() {
    const amount = Number(partialAmount);
    if (!Number.isFinite(amount) || amount < 0) return;
    setPartialOpen(false);
    await setPayment("partial", amount);
  }

  async function submitDeleteRequest() {
    if (!deleteReason.trim()) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${id}/delete-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason.trim() }),
      });
      if (!res.ok) {
        toast.error(await readErrorMessage(res, "Delete request failed"));
        return;
      }
      setDeleteOpen(false);
      setDeleteReason("");
      toast.success(`Delete request submitted for ${order?.orderId ?? "order"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete request failed");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  if (loading) {
    return <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading...</div>;
  }
  if (notFound || !order) {
    return (
      <div>
        <Link href="/orders" style={backLink}>
          <ArrowLeft size={14} /> Back to orders
        </Link>
        <p style={{ marginTop: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
          Order not found.
        </p>
      </div>
    );
  }

  const total = Number(order.totalAmount);
  const paid = Number(order.paidAmount);
  const balance = Math.max(0, total - paid);

  return (
    <div>
      <Link href="/orders" style={backLink}>
        <ArrowLeft size={14} /> Back to orders
      </Link>

      <div style={topRow}>
        <div>
          <p style={mono}>{order.orderId}</p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
            Order Details
          </h1>
          <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
            <StatusBadge value={order.status} />
            <PaymentBadge value={order.paymentStatus} />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Dropdown
            open={statusOpen}
            onToggle={() => {
              setStatusOpen((s) => !s);
              setPaymentOpen(false);
            }}
            label="Update Status"
          >
            {order.status !== "confirmed" && (
              <DropItem onClick={() => setStatus("confirmed")}>Mark Confirmed</DropItem>
            )}
            {order.status !== "delivered" && (
              <DropItem onClick={() => setStatus("delivered")}>Mark Delivered</DropItem>
            )}
            {order.status !== "cancelled" && (
              <DropItem onClick={() => setStatus("cancelled")} danger>
                Cancel Order
              </DropItem>
            )}
          </Dropdown>
          <Dropdown
            open={paymentOpen}
            onToggle={() => {
              setPaymentOpen((s) => !s);
              setStatusOpen(false);
            }}
            label="Update Payment"
          >
            <DropItem onClick={() => setPayment("paid")}>Mark Paid</DropItem>
            <DropItem
              onClick={() => {
                setPaymentOpen(false);
                setPartialAmount(order.paidAmount);
                setPartialOpen(true);
              }}
            >
              Mark Partial
            </DropItem>
            <DropItem onClick={() => setPayment("unpaid")}>Mark Unpaid</DropItem>
          </Dropdown>
          <button onClick={() => setDeleteOpen(true)} style={btnDanger}>
            <Trash2 size={13} /> Request Delete
          </button>
          <FloatingPopover
              trigger={
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "7px",
                    border: "1px solid var(--input-border)",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <FileText size={13} /> Invoice
                </button>
              }
              items={[
                {
                  label: "Download PDF",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  ),
                  onClick: () => downloadPDF(`/api/pdf/invoice/${order.id}`, `invoice-${order.orderId}.pdf`, `inv-dl-${order.id}`),
                  disabled: isLoading(`inv-dl-${order.id}`),
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
                  onClick: () => printPDF(`/api/pdf/invoice/${order.id}`, `inv-print-${order.id}`),
                  disabled: isLoading(`inv-print-${order.id}`),
                },
              ]}
              width={180}
            />
            <FloatingPopover
              trigger={
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "7px",
                    border: "1px solid var(--input-border)",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <Truck size={13} /> Delivery Slip
                </button>
              }
              items={[
                {
                  label: "Download PDF",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  ),
                  onClick: () => downloadPDF(`/api/pdf/delivery-slip/${order.id}`, `delivery-${order.orderId}.pdf`, `del-dl-${order.id}`),
                  disabled: isLoading(`del-dl-${order.id}`),
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
                  onClick: () => printPDF(`/api/pdf/delivery-slip/${order.id}`, `del-print-${order.id}`),
                  disabled: isLoading(`del-print-${order.id}`),
                },
              ]}
              width={180}
            />
            <BarcodePopup
              trigger={
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "7px",
                    border: "1px solid var(--input-border)",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="7" y1="8" x2="7" y2="16" />
                    <line x1="11" y1="8" x2="11" y2="16" />
                    <line x1="15" y1="8" x2="15" y2="16" />
                    <line x1="19" y1="8" x2="19" y2="16" />
                  </svg>
                  Barcode
                </button>
              }
              value={order.orderId}
              label={order.orderId}
              filename={`barcode-${order.orderId}`}
              size="md"
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card title="Order Info">
          <Row label="Order ID" value={order.orderId} />
          <Row label="Date" value={new Date(order.createdAt).toLocaleString()} />
          <Row label="Status" value={<StatusBadge value={order.status} />} />
          <Row label="Payment" value={<PaymentBadge value={order.paymentStatus} />} />
          <Row label="Method" value={order.paymentMethod ?? "—"} />
          <Row label="Created By" value={order.createdByUser?.name ?? "—"} />
        </Card>
        <Card title="Customer">
          <Row
            label="Name"
            value={
              <Link href={`/customers/${order.customer.id}`} style={linkText}>
                {order.customer.name}
              </Link>
            }
          />
          <Row label="ID" value={order.customer.customerId} />
          <Row label="Email" value={order.customer.email ?? "—"} />
          <Row label="Mobile" value={order.customer.mobile} />
          <Row label="Address" value={order.customer.streetAddress ?? "—"} />
          <Row label="City" value={order.customer.city ?? "—"} />
        </Card>
      </div>

      <div style={{ marginTop: "16px" }}>
        <Card title="Items">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--input-bg)" }}>
                <Th>Product</Th>
                <Th align="right">Qty</Th>
                <Th align="right">Unit Price</Th>
                <Th align="right">Subtotal</Th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <Td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{it.productName}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {it.product?.productId}
                      </span>
                    </div>
                  </Td>
                  <Td align="right">
                    {it.quantity} {it.product?.unit ?? ""}
                  </Td>
                  <Td align="right">{formatMoney(it.unitPrice)}</Td>
                  <Td align="right">{formatMoney(it.totalPrice)}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <FooterRow label="Subtotal" value={order.subtotal} />
              <FooterRow label="Tax" value={order.taxAmount} />
              <FooterRow label="Discount" value={`-${formatMoney(order.discountAmount)}`} raw />
              <FooterRow label="Total" value={order.totalAmount} bold />
            </tfoot>
          </table>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <Card title="Payment">
          <Row label="Method" value={order.paymentMethod ?? "—"} />
          <Row label="Total" value={formatMoney(order.totalAmount)} />
          <Row label="Paid" value={formatMoney(order.paidAmount)} />
          <Row label="Balance Due" value={formatMoney(balance)} />
        </Card>
        <Card title="Addresses">
          <Row label="Shipping" value={order.shippingAddress ?? "—"} />
          <Row label="Billing" value={order.billingAddress ?? "—"} />
        </Card>
      </div>

      {order.notes && (
        <div style={{ marginTop: "16px" }}>
          <Card title="Notes">
            <p style={{ fontSize: "13px", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {order.notes}
            </p>
          </Card>
        </div>
      )}

      <div style={{ marginTop: "16px" }}>
        <Card title="Timeline">
          <Timeline status={order.status} />
        </Card>
      </div>

      {partialOpen && (
        <>
          <div onClick={() => setPartialOpen(false)} style={modalOverlay} />
          <div style={modalBox}>
            <h3 style={modalTitle}>Mark as Partially Paid</h3>
            <Label>Paid Amount</Label>
            <input
              type="number"
              step="0.01"
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button onClick={() => setPartialOpen(false)} style={btnSecondary}>
                Cancel
              </button>
              <button onClick={submitPartial} style={btnPrimary}>
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {deleteOpen && (
        <>
          <div onClick={() => setDeleteOpen(false)} style={modalOverlay} />
          <div style={modalBox}>
            <h3 style={modalTitle}>Request deletion of {order.orderId}</h3>
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
              <button onClick={() => setDeleteOpen(false)} style={btnSecondary}>
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

function Timeline({ status }: { status: string }) {
  const steps =
    status === "cancelled"
      ? [
          { key: "created", label: "Created", done: true },
          { key: "cancelled", label: "Cancelled", done: true, danger: true },
        ]
      : [
          { key: "created", label: "Created", done: true },
          { key: "confirmed", label: "Confirmed", done: ["confirmed", "delivered"].includes(status) },
          { key: "delivered", label: "Delivered", done: status === "delivered" },
        ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      {steps.map((s, idx) => (
        <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "999px",
              backgroundColor: s.done
                ? s.danger
                  ? "#dc2626"
                  : "var(--brand)"
                : "var(--input-bg)",
              border: "1px solid var(--card-border)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: s.done ? "white" : "var(--text-muted)",
            }}
          >
            {s.done ? <Check size={12} /> : <Circle size={10} />}
          </div>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: s.done ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {s.label}
          </span>
          {idx < steps.length - 1 && (
            <span
              style={{
                width: "32px",
                height: "1px",
                backgroundColor: "var(--card-border)",
                display: "inline-block",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FooterRow({
  label,
  value,
  bold,
  raw,
}: {
  label: string;
  value: string | number;
  bold?: boolean;
  raw?: boolean;
}) {
  const display = raw ? (value as string) : formatMoney(value);
  return (
    <tr style={{ borderTop: "1px solid var(--card-border)" }}>
      <td colSpan={3} style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-secondary)", fontWeight: bold ? 700 : 400, fontSize: "13px" }}>
        {label}
      </td>
      <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-primary)", fontWeight: bold ? 700 : 500, fontSize: bold ? "14px" : "13px" }}>
        {display}
      </td>
    </tr>
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

function Dropdown({
  open,
  onToggle,
  label,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative" }}>
      <button onClick={onToggle} style={btnSecondary}>
        {label} <ChevronDown size={13} />
      </button>
      {open && (
        <div style={dropMenu}>
          {children}
        </div>
      )}
    </div>
  );
}

function DropItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "8px 12px",
        fontSize: "13px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: danger ? "#dc2626" : "var(--text-primary)",
      }}
    >
      {children}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "10px",
        padding: "16px 18px",
      }}
    >
      <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: "12px",
        padding: "6px 0",
        fontSize: "13px",
        borderBottom: "1px solid var(--card-border)",
      }}
    >
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
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
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      style={{
        padding: "10px 12px",
        textAlign: align ?? "left",
        color: "var(--text-primary)",
      }}
    >
      {children}
    </td>
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

const backLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px",
  color: "var(--text-secondary)",
  textDecoration: "none",
};

const topRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginTop: "12px",
  marginBottom: "20px",
  gap: "16px",
};

const mono: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--text-muted)",
  letterSpacing: "0.05em",
  fontFamily: "ui-monospace, monospace",
};

const linkText: React.CSSProperties = {
  color: "var(--brand)",
  textDecoration: "none",
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

const btnDanger: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "7px",
  border: "1px solid #fecaca",
  backgroundColor: "#fef2f2",
  color: "#dc2626",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const dropMenu: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  right: 0,
  minWidth: "180px",
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  zIndex: 50,
  overflow: "hidden",
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
