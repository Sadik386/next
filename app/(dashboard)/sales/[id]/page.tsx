"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, use } from "react";
import { ArrowLeft, Receipt, Printer, FileDown, ExternalLink, Mail, Loader2, Check, X } from "lucide-react";
import { usePDF } from "@/hooks/usePDF";
import { FloatingPopover } from "@/components/ui/FloatingPopover";

type SaleItem = {
  id: number;
  productId: number;
  productVariantId: number | null;
  productName: string;
  variantLabel: string | null;
  skuSnapshot: string | null;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  product?: { id: number; productId: string; name: string; unit: string };
};

type SaleDetail = {
  id: number;
  saleId: string;
  orderId: number | null;
  customerId: number | null;
  productId: number | null;
  productVariantId: number | null;
  productName: string | null;
  variantLabel: string | null;
  skuSnapshot: string | null;
  date: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  taxAmount: string;
  discountAmount: string;
  paymentStatus: string;
  paymentMethod: string | null;
  shippingAddress: string | null;
  billingAddress: string | null;
  deliveryDate: string | null;
  trackingNumber: string | null;
  warrantyPeriod: string | null;
  salesCommission: string;
  returnStatus: string;
  notes: string | null;
  createdAt: string;
  customer: {
    id: number;
    customerId: string;
    name: string;
    email: string | null;
    mobile: string;
    streetAddress: string | null;
  } | null;
  order: {
    id: number;
    orderId: string;
    paidAmount: string;
    paymentStatus: string;
    totalAmount: string;
  } | null;
  createdByUser: { id: number; name: string; email: string };
  siblings: SaleItem[];
};

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sendEmailState, setSendEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendEmailMsg, setSendEmailMsg] = useState("");
  const { downloadPDF, printPDF, isLoading } = usePDF();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSale(data.sale);
      }
    } catch (err) {
      console.error("Failed to load sale:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendReceiptEmail() {
    if (!sale?.customer?.email) {
      setSendEmailState("error");
      setSendEmailMsg("Customer has no email address.");
      return;
    }
    setSendEmailState("sending");
    setSendEmailMsg("");
    try {
      const res = await fetch(`/api/email/receipt/${sale.saleId}`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSendEmailState("sent");
        setSendEmailMsg("Receipt email sent successfully.");
      } else {
        setSendEmailState("error");
        setSendEmailMsg(data.message || "Failed to send receipt email.");
      }
    } catch {
      setSendEmailState("error");
      setSendEmailMsg("Network error.");
    }
  }

  if (loading) {
    return <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "20px" }}>Loading...</div>;
  }

  if (notFound || !sale) {
    return (
      <div style={{ padding: "20px" }}>
        <Link href="/sales" style={backLink}>
          <ArrowLeft size={14} /> Back to sales
        </Link>
        <p style={{ marginTop: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
          Sale not found.
        </p>
      </div>
    );
  }

  const items = sale.siblings && sale.siblings.length > 0 ? sale.siblings : [];
  
  // Totals logic
  const subtotal = items.reduce((acc, it) => acc + Number(it.totalAmount), 0);
  const totalTax = Number(sale.taxAmount);
  const totalDiscount = Number(sale.discountAmount);
  const totalAmount = subtotal + totalTax - totalDiscount;
  const paidAmount = sale.order ? Number(sale.order.paidAmount) : totalAmount;
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  return (
    <div style={{ paddingBottom: "40px" }}>
      <Link href="/sales" style={backLink}>
        <ArrowLeft size={14} /> Back to sales
      </Link>

      <div style={topRow}>
        <div>
          <p style={mono}>{sale.saleId}</p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
            Sale Details
          </h1>
          <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
            <PaymentBadge value={sale.order?.paymentStatus ?? sale.paymentStatus} />
            {sale.returnStatus !== "none" && <ReturnBadge value={sale.returnStatus} />}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <FloatingPopover
            trigger={
              <button
                disabled={isLoading(`rec-dl-${sale.id}`) || isLoading(`rec-print-${sale.id}`)}
                style={btnPrimary}
              >
                <Receipt size={14} /> Receipt Actions
              </button>
            }
            items={[
              {
                label: "Download Receipt",
                icon: <FileDown size={14} />,
                onClick: () => downloadPDF(`/api/pdf/receipt/${sale.saleId}`, `receipt-${sale.saleId}.pdf`, `rec-dl-${sale.id}`),
                disabled: isLoading(`rec-dl-${sale.id}`),
              },
              {
                label: "Print Receipt",
                icon: <Printer size={14} />,
                onClick: () => printPDF(`/api/pdf/receipt/${sale.saleId}`, `rec-print-${sale.id}`),
                disabled: isLoading(`rec-print-${sale.id}`),
              },
            ]}
          />
          {sale.customer?.email && (
            <button
              onClick={sendReceiptEmail}
              disabled={sendEmailState === "sending"}
              style={{ ...btnSecondary, minWidth: "140px" }}
              title="Send receipt to customer email"
            >
              {sendEmailState === "sending" ? (
                <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Sending...</>
              ) : sendEmailState === "sent" ? (
                <><Check size={14} /> Sent</>
              ) : sendEmailState === "error" ? (
                <><X size={14} /> Failed</>
              ) : (
                <><Mail size={14} /> Send Receipt</>
              )}
            </button>
          )}
        </div>
        {sendEmailMsg && (
          <div style={{
            marginTop: "6px",
            fontSize: "11px",
            color: sendEmailState === "error" ? "#991b1b" : sendEmailState === "sent" ? "#166534" : "#92400e",
            backgroundColor: sendEmailState === "error" ? "#fee2e2" : sendEmailState === "sent" ? "#dcfce7" : "#fef3c7",
            padding: "5px 10px",
            borderRadius: "6px",
          }}>
            {sendEmailMsg}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card title="Sale Info">
          <Row label="Sale ID" value={sale.saleId} />
          <Row label="Date" value={new Date(sale.date).toLocaleString()} />
          <Row label="Payment Status" value={<PaymentBadge value={sale.order?.paymentStatus ?? sale.paymentStatus} />} />
          <Row label="Payment Method" value={sale.paymentMethod ?? "—"} />
          <Row label="Created By" value={sale.createdByUser?.name ?? "—"} />
          {sale.order && (
            <Row 
              label="Linked Order" 
              value={
                <Link href={`/orders/${sale.order.id}`} style={linkText}>
                  {sale.order.orderId} <ExternalLink size={12} style={{ marginLeft: "2px", display: "inline" }} />
                </Link>
              } 
            />
          )}
        </Card>
        <Card title="Customer">
          {sale.customer ? (
            <>
              <Row label="Name" value={sale.customer.name} />
              <Row label="Customer ID" value={sale.customer.customerId} />
              <Row label="Mobile" value={sale.customer.mobile} />
              <Row label="Email" value={sale.customer.email ?? "—"} />
              <Row label="Address" value={sale.customer.streetAddress ?? "—"} />
            </>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Walk-in Customer</p>
          )}
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
                <Th align="right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <Td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 500 }}>{it.productName}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {it.product?.productId}
                        {it.variantLabel ? ` / ${it.variantLabel}` : ""}
                        {it.skuSnapshot ? ` · ${it.skuSnapshot}` : ""}
                      </span>
                    </div>
                  </Td>
                  <Td align="right">{it.quantity} {it.product?.unit ?? ""}</Td>
                  <Td align="right">{formatMoney(it.unitPrice)}</Td>
                  <Td align="right">{formatMoney(it.totalAmount)}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <FooterRow label="Subtotal" value={subtotal} />
              <FooterRow label="Tax" value={totalTax} />
              <FooterRow label="Discount" value={`-${formatMoney(totalDiscount)}`} raw />
              <FooterRow label="Total" value={totalAmount} bold />
            </tfoot>
          </table>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <Card title="Payment Details">
          <Row label="Method" value={sale.paymentMethod ?? "—"} />
          <Row label="Total Amount" value={formatMoney(totalAmount)} />
          <Row label="Paid Amount" value={formatMoney(paidAmount)} />
          <Row label="Balance Due" value={formatMoney(balanceDue)} />
        </Card>
        <Card title="Shipping & Warranty">
          <Row label="Shipping Address" value={sale.shippingAddress ?? "—"} />
          <Row label="Delivery Date" value={sale.deliveryDate ? new Date(sale.deliveryDate).toLocaleDateString() : "—"} />
          <Row label="Tracking #" value={sale.trackingNumber ?? "—"} />
          <Row label="Warranty Period" value={sale.warrantyPeriod ?? "—"} />
        </Card>
      </div>

      {sale.notes && (
        <div style={{ marginTop: "16px" }}>
          <Card title="Notes">
            <p style={{ fontSize: "13px", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {sale.notes}
            </p>
          </Card>
        </div>
      )}
    </div>
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
        gridTemplateColumns: "130px 1fr",
        gap: "12px",
        padding: "7px 0",
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

function Td({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
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

function FooterRow({ label, value, bold, raw }: { label: string; value: string | number; bold?: boolean; raw?: boolean }) {
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
  fontWeight: 500,
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 16px",
  borderRadius: "8px",
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
  gap: "8px",
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};
