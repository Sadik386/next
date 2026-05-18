"use client";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { COUNTRIES } from "@/constants/countries";
import { normalizePhoneString } from "@/lib/normalize";

type Customer = {
  id: number;
  customerId: string;
  name: string;
  email: string | null;
  mobile: string;
  country: string | null;
  state: string | null;
  zipCode: string | null;
  city: string | null;
  streetAddress: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  status: string;
  createdAt: string;
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/customers/${id}`);
      if (!active) return;
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading...</div>;
  }
  if (notFound || !customer) {
    return (
      <div>
        <Link href="/customers" style={backLink}>
          <ArrowLeft size={14} /> Back to customers
        </Link>
        <p style={{ marginTop: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
          Customer not found.
        </p>
      </div>
    );
  }

  const countryName = COUNTRIES.find((c) => c.code === customer.country)?.name ?? customer.country ?? "—";
  const memberSince = new Date(customer.createdAt).toLocaleDateString();

  return (
    <div>
      <Link href="/customers" style={backLink}>
        <ArrowLeft size={14} /> Back to customers
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginTop: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.05em", fontFamily: "ui-monospace, monospace" }}>
            {customer.customerId}
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
            {customer.name}
          </h1>
          <span
            style={{
              display: "inline-block",
              marginTop: "6px",
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "999px",
              backgroundColor: customer.status === "active" ? "#dcfce7" : "#f3f4f6",
              color: customer.status === "active" ? "#166534" : "#6b7280",
            }}
          >
            {customer.status}
          </span>
        </div>
        <Link href={`/customers?edit=${customer.id}`} style={{ textDecoration: "none" }}>
          <button style={btnPrimary}>
            <Pencil size={13} /> Edit Customer
          </button>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card title="Contact Information">
          <Row label="Email" value={customer.email ?? "—"} />
          <Row label="Mobile" value={normalizePhoneString(customer.mobile)} />
          <Row label="Street Address" value={customer.streetAddress ?? "—"} />
          <Row label="City" value={customer.city ?? "—"} />
          <Row label="State" value={customer.state ?? "—"} />
          <Row label="ZIP Code" value={customer.zipCode ?? "—"} />
          <Row label="Country" value={countryName} />
        </Card>

        <Card title="Stats">
          <Row label="Total Orders" value="0" />
          <Row label="Total Spent" value="—" />
          <Row label="Last Order Date" value="—" />
          <Row label="Member Since" value={memberSince} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <Card title="Billing Address">
          <p style={addressText}>{customer.billingAddress ?? customer.streetAddress ?? "—"}</p>
        </Card>
        <Card title="Shipping Address">
          <p style={addressText}>{customer.shippingAddress ?? customer.streetAddress ?? "—"}</p>
        </Card>
      </div>

      <div style={{ marginTop: "16px" }}>
        <Card title="Order History">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--input-bg)" }}>
                <Th>Order ID</Th>
                <Th>Date</Th>
                <Th align="right">Amount</Th>
                <Th>Status</Th>
                <Th>Payment</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                  No orders yet.
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </div>
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

const addressText: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--text-primary)",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};

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
      <h3
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "12px",
        }}
      >
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
