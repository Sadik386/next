"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, Plus, X, Search, Eye } from "lucide-react";
import { COUNTRIES, CURRENCIES } from "@/constants/countries";

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
  category: string | null;
  deliveryMethod: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  status: string;
};

const PAYMENT_TERMS = ["Net 7", "Net 15", "Net 30", "Net 45", "Net 60", "Net 90", "Cash on Delivery", "Advance Payment"];

const emptyForm = {
  companyName: "",
  contactName: "",
  email: "",
  mobile: "",
  paymentTerms: "Net 30",
  currency: "BDT",
  taxId: "",
  website: "",
  category: "",
  deliveryMethod: "",
  bankName: "",
  bankAccount: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  country: "BD",
  status: "active",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/suppliers?${params}`);
    if (res.ok) {
      const data = await res.json();
      setSuppliers(data.items ?? []);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      companyName: s.companyName,
      contactName: s.contactName,
      email: s.email ?? "",
      mobile: s.mobile ?? "",
      paymentTerms: s.paymentTerms ?? "Net 30",
      currency: s.currency,
      taxId: s.taxId ?? "",
      website: s.website ?? "",
      category: s.category ?? "",
      deliveryMethod: s.deliveryMethod ?? "",
      bankName: s.bankName ?? "",
      bankAccount: s.bankAccount ?? "",
      streetAddress: s.streetAddress ?? "",
      city: s.city ?? "",
      state: s.state ?? "",
      zipCode: s.zipCode ?? "",
      country: s.country ?? "BD",
      status: s.status,
    });
    setError(null);
    setDrawerOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.companyName.trim()) return setError("Company name is required");
    if (!form.contactName.trim()) return setError("Contact name is required");
    if (!form.paymentTerms) return setError("Payment terms is required");
    if (!form.currency) return setError("Currency is required");

    setSaving(true);
    const body = {
      companyName: form.companyName.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim() || null,
      mobile: form.mobile.trim() || null,
      paymentTerms: form.paymentTerms,
      currency: form.currency,
      taxId: form.taxId.trim() || null,
      website: form.website.trim() || null,
      category: form.category.trim() || null,
      deliveryMethod: form.deliveryMethod.trim() || null,
      bankName: form.bankName.trim() || null,
      bankAccount: form.bankAccount.trim() || null,
      streetAddress: form.streetAddress.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zipCode: form.zipCode.trim() || null,
      country: form.country || null,
      status: form.status,
    };
    const url = editing ? `/api/suppliers/${editing.id}` : "/api/suppliers";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
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
    if (!deleteTarget) return;
    if (!deleteReason.trim()) return;
    setDeleteSubmitting(true);
    const res = await fetch(`/api/suppliers/${deleteTarget.id}/delete-request`, {
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
            Suppliers
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Manage your supplier directory
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <Plus size={14} /> New Supplier
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "8px",
          padding: "8px 12px",
          marginBottom: "12px",
          maxWidth: "360px",
        }}
      >
        <Search size={14} color="var(--text-muted)" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, contact, ID, email"
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
              <Th>Supplier ID</Th>
              <Th>Company Name</Th>
              <Th>Contact Name</Th>
              <Th>Email</Th>
              <Th>Mobile</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={emptyCell}>
                  Loading...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} style={emptyCell}>
                  No suppliers yet. Click &ldquo;New Supplier&rdquo; to add one.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <Td mono>{s.supplierId}</Td>
                  <Td>{s.companyName}</Td>
                  <Td>{s.contactName}</Td>
                  <Td>{s.email ?? "—"}</Td>
                  <Td>{s.mobile ?? "—"}</Td>
                  <Td>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        backgroundColor: s.status === "active" ? "#dcfce7" : "#f3f4f6",
                        color: s.status === "active" ? "#166534" : "#6b7280",
                      }}
                    >
                      {s.status}
                    </span>
                  </Td>
                  <Td align="right">
                    <div style={{ display: "inline-flex", gap: "4px" }}>
                      <Link href={`/suppliers/${s.id}`} style={{ textDecoration: "none" }}>
                        <IconBtn title="View">
                          <Eye size={13} />
                        </IconBtn>
                      </Link>
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
                {editing ? "Edit Supplier" : "New Supplier"}
              </h2>
              <button onClick={() => setDrawerOpen(false)} style={iconButton}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={drawerBody}>
              <Field
                label="Company Name"
                required
                value={form.companyName}
                onChange={(v) => setForm((f) => ({ ...f, companyName: v }))}
              />
              <Field
                label="Contact Name"
                required
                value={form.contactName}
                onChange={(v) => setForm((f) => ({ ...f, contactName: v }))}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                />
                <Field
                  label="Mobile"
                  value={form.mobile}
                  onChange={(v) => setForm((f) => ({ ...f, mobile: v }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <Label required>Payment Terms</Label>
                  <select
                    value={form.paymentTerms}
                    onChange={(e) => setForm((f) => ({ ...f, paymentTerms: e.target.value }))}
                    style={inputStyle}
                  >
                    {PAYMENT_TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label required>Currency</Label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    style={inputStyle}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field
                  label="Tax ID / VAT Number"
                  value={form.taxId}
                  onChange={(v) => setForm((f) => ({ ...f, taxId: v }))}
                />
                <Field
                  label="Website"
                  value={form.website}
                  onChange={(v) => setForm((f) => ({ ...f, website: v }))}
                  placeholder="https://"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field
                  label="Category / Industry"
                  value={form.category}
                  onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                />
                <Field
                  label="Delivery Method"
                  value={form.deliveryMethod}
                  onChange={(v) => setForm((f) => ({ ...f, deliveryMethod: v }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field
                  label="Bank Name"
                  value={form.bankName}
                  onChange={(v) => setForm((f) => ({ ...f, bankName: v }))}
                />
                <Field
                  label="Bank Account"
                  value={form.bankAccount}
                  onChange={(v) => setForm((f) => ({ ...f, bankAccount: v }))}
                />
              </div>

              <div>
                <Label>Street Address</Label>
                <textarea
                  value={form.streetAddress}
                  onChange={(e) => setForm((f) => ({ ...f, streetAddress: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                />
                <Field
                  label="State"
                  value={form.state}
                  onChange={(v) => setForm((f) => ({ ...f, state: v }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field
                  label="ZIP Code"
                  value={form.zipCode}
                  onChange={(v) => setForm((f) => ({ ...f, zipCode: v }))}
                />
                <div>
                  <Label>Country</Label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    style={inputStyle}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["active", "inactive"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: s }))}
                      style={statusBtn(form.status === s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {error && <div style={errorBox}>{error}</div>}
            </form>
            <div style={drawerFooter}>
              <button type="button" onClick={() => setDrawerOpen(false)} style={btnSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Create Supplier"}
              </button>
            </div>
          </aside>
        </>
      )}

      {deleteTarget && (
        <>
          <div onClick={() => setDeleteTarget(null)} style={modalOverlay} />
          <div style={modalBox}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              Request deletion of {deleteTarget.companyName}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
              An admin will review this request before the supplier is removed.
            </p>
            <Label required>Reason</Label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              placeholder="Why should this supplier be deleted?"
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

const emptyCell: React.CSSProperties = {
  padding: "32px",
  textAlign: "center",
  color: "var(--text-muted)",
};

function statusBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid var(--input-border)",
    backgroundColor: active ? "var(--brand-light)" : "var(--input-bg)",
    color: active ? "var(--brand)" : "var(--text-secondary)",
    fontWeight: active ? 600 : 400,
    fontSize: "13px",
    cursor: "pointer",
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
  danger?: boolean;
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
        color: danger ? "#dc2626" : "var(--text-secondary)",
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}
