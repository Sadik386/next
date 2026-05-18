"use client";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { COUNTRIES } from "@/constants/countries";
import { normalizePhoneString } from "@/lib/normalize";

type Supplier = {
  id: number;
  supplierId: string;
  companyName: string;
  contactName: string;
  email: string | null;
  mobile: string | null;
  website: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  currency: string;
  bankName: string | null;
  bankAccount: string | null;
  accountName: string | null;
  branchName: string | null;
  routingNumber: string | null;
  swiftCode: string | null;
  bkash: string | null;
  nagad: string | null;
  rocket: string | null;
  upay: string | null;
  category: string | null;
  deliveryMethod: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  status: string;
  createdAt: string;
};

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/suppliers/${id}`);
      if (!active) return;
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSupplier(data.supplier);
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
  if (notFound || !supplier) {
    return (
      <div>
        <Link href="/suppliers" style={backLink}>
          <ArrowLeft size={14} /> Back to suppliers
        </Link>
        <p style={{ marginTop: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
          Supplier not found.
        </p>
      </div>
    );
  }

  const countryName = COUNTRIES.find((c) => c.code === supplier.country)?.name ?? supplier.country ?? "—";

  return (
    <div>
      <Link href="/suppliers" style={backLink}>
        <ArrowLeft size={14} /> Back to suppliers
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
            {supplier.supplierId}
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
            {supplier.companyName}
          </h1>
          <span
            style={{
              display: "inline-block",
              marginTop: "6px",
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "999px",
              backgroundColor: supplier.status === "active" ? "#dcfce7" : "#f3f4f6",
              color: supplier.status === "active" ? "#166534" : "#6b7280",
            }}
          >
            {supplier.status}
          </span>
        </div>
        <Link href={`/suppliers?edit=${supplier.id}`} style={{ textDecoration: "none" }}>
          <button style={btnPrimary}>
            <Pencil size={13} /> Edit Supplier
          </button>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card title="Contact Information">
          <Row label="Contact Name" value={supplier.contactName} />
          <Row label="Email" value={supplier.email ?? "—"} />
          <Row label="Mobile" value={normalizePhoneString(supplier.mobile) ?? "—"} />
          <Row label="Website" value={supplier.website ?? "—"} />
        </Card>

        <Card title="Payment & Banking">
          <Row label="Payment Terms" value={supplier.paymentTerms ?? "—"} />
          <Row label="Currency" value={supplier.currency} />
          <Row label="Tax ID / VAT" value={supplier.taxId ?? "—"} />
          <Row label="Bank Name" value={supplier.bankName ?? "—"} />
          <Row label="Bank Account" value={supplier.bankAccount ?? "—"} />
          <Row label="Account Name" value={supplier.accountName ?? "—"} />
          <Row label="Branch Name" value={supplier.branchName ?? "—"} />
          <Row label="Routing Number" value={supplier.routingNumber ?? "—"} />
          <Row label="SWIFT / BIC" value={supplier.swiftCode ?? "—"} />
          <Row label="bKash" value={supplier.bkash ?? "—"} />
          <Row label="Nagad" value={supplier.nagad ?? "—"} />
          <Row label="Rocket" value={supplier.rocket ?? "—"} />
          <Row label="Upay" value={supplier.upay ?? "—"} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <Card title="Address">
          <Row label="Street" value={supplier.streetAddress ?? "—"} />
          <Row label="City" value={supplier.city ?? "—"} />
          <Row label="State" value={supplier.state ?? "—"} />
          <Row label="ZIP Code" value={supplier.zipCode ?? "—"} />
          <Row label="Country" value={countryName} />
        </Card>

        <Card title="Business Details">
          <Row label="Category" value={supplier.category ?? "—"} />
          <Row label="Delivery Method" value={supplier.deliveryMethod ?? "—"} />
          <Row label="Created" value={new Date(supplier.createdAt).toLocaleDateString()} />
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
