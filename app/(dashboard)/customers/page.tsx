"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, Plus, X, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES } from "@/constants/countries";
import { normalizePhoneString, normalizeCountryValue } from "@/lib/normalize";
import { readErrorMessage } from "@/lib/read-error-message";

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
};

const emptyForm = {
  name: "",
  email: "",
  mobile: "",
  country: "BD",
  state: "",
  zipCode: "",
  city: "",
  streetAddress: "",
  billingAddress: "",
  shippingAddress: "",
  status: "active",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [billingSame, setBillingSame] = useState(true);
  const [shippingSame, setShippingSame] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/customers?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCustomers(data.items ?? []);
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
    setBillingSame(true);
    setShippingSame(true);
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email ?? "",
      mobile: normalizePhoneString(c.mobile),
      country: normalizeCountryValue(c.country) || "BD",
      state: c.state ?? "",
      zipCode: c.zipCode ?? "",
      city: c.city ?? "",
      streetAddress: c.streetAddress ?? "",
      billingAddress: c.billingAddress ?? "",
      shippingAddress: c.shippingAddress ?? "",
      status: c.status,
    });
    setBillingSame(!c.billingAddress || c.billingAddress === c.streetAddress);
    setShippingSame(!c.shippingAddress || c.shippingAddress === c.streetAddress);
    setError(null);
    setDrawerOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (!form.mobile.trim()) return setError("Mobile is required");
    if (!form.country) return setError("Country is required");
    if (!form.city.trim()) return setError("City is required");
    if (!form.streetAddress.trim()) return setError("Street address is required");

    const wasEditing = Boolean(editing);
    setSaving(true);
    const body = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      mobile: normalizePhoneString(form.mobile.trim()),
      country: form.country,
      state: form.state.trim() || null,
      zipCode: form.zipCode.trim() || null,
      city: form.city.trim() || null,
      streetAddress: form.streetAddress.trim() || null,
      billingAddress: billingSame
        ? form.streetAddress.trim() || null
        : form.billingAddress.trim() || null,
      shippingAddress: shippingSame
        ? form.streetAddress.trim() || null
        : form.shippingAddress.trim() || null,
      status: form.status,
    };
    const url = editing ? `/api/customers/${editing.id}` : "/api/customers";
    const method = editing ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res, "Save failed"));
        return;
      }
      setDrawerOpen(false);
      toast.success(wasEditing ? "Customer updated" : "Customer created");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function submitDeleteRequest() {
    if (!deleteTarget) return;
    if (!deleteReason.trim()) return;
    const targetName = deleteTarget.name;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}/delete-request`, {
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
      <div
        className="acc-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Customers
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Manage your customer directory
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <Plus size={14} /> New Customer
        </button>
      </div>

      <div
        className="acc-filters"
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
          placeholder="Search by name, ID, email, mobile"
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
        className="acc-table-wrap"
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
              <Th>Customer ID</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Mobile</Th>
              <Th>City</Th>
              <Th>Country</Th>
              <Th>Status</Th>
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
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={8} style={emptyCell}>
                  No customers yet. Click &ldquo;New Customer&rdquo; to add one.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <Td mono>{c.customerId}</Td>
                  <Td>{c.name}</Td>
                  <Td>{c.email ?? "—"}</Td>
                  <Td>{c.mobile}</Td>
                  <Td>{c.city ?? "—"}</Td>
                  <Td>{countryName(c.country)}</Td>
                  <Td>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        backgroundColor: c.status === "active" ? "#dcfce7" : "#f3f4f6",
                        color: c.status === "active" ? "#166534" : "#6b7280",
                      }}
                    >
                      {c.status}
                    </span>
                  </Td>
                  <Td align="right">
                    <div style={{ display: "inline-flex", gap: "4px" }}>
                      <Link href={`/customers/${c.id}`} style={{ textDecoration: "none" }}>
                        <IconBtn title="View">
                          <Eye size={13} />
                        </IconBtn>
                      </Link>
                      <IconBtn onClick={() => openEdit(c)} title="Edit">
                        <Pencil size={13} />
                      </IconBtn>
                      <IconBtn
                        onClick={() => {
                          setDeleteTarget(c);
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
                {editing ? "Edit Customer" : "New Customer"}
              </h2>
              <button onClick={() => setDrawerOpen(false)} style={iconButton}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={drawerBody}>
              <Field
                label="Name"
                required
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <Field
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <Field
                label="Mobile"
                required
                value={form.mobile}
                onChange={(v) => setForm((f) => ({ ...f, mobile: v }))}
              />
              <div>
                <Label required>Country</Label>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field
                  label="State"
                  value={form.state}
                  onChange={(v) => setForm((f) => ({ ...f, state: v }))}
                />
                <Field
                  label="ZIP Code"
                  value={form.zipCode}
                  onChange={(v) => setForm((f) => ({ ...f, zipCode: v }))}
                />
              </div>
              <Field
                label="City"
                required
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              />
              <div>
                <Label required>Street Address</Label>
                <textarea
                  value={form.streetAddress}
                  onChange={(e) => setForm((f) => ({ ...f, streetAddress: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
              <div>
                <label style={checkboxRow}>
                  <input
                    type="checkbox"
                    checked={billingSame}
                    onChange={(e) => setBillingSame(e.target.checked)}
                  />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Billing address same as main address
                  </span>
                </label>
                {!billingSame && (
                  <textarea
                    value={form.billingAddress}
                    onChange={(e) => setForm((f) => ({ ...f, billingAddress: e.target.value }))}
                    rows={2}
                    placeholder="Billing address"
                    style={{ ...inputStyle, resize: "vertical", marginTop: "6px" }}
                  />
                )}
              </div>
              <div>
                <label style={checkboxRow}>
                  <input
                    type="checkbox"
                    checked={shippingSame}
                    onChange={(e) => setShippingSame(e.target.checked)}
                  />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Shipping address same as main address
                  </span>
                </label>
                {!shippingSame && (
                  <textarea
                    value={form.shippingAddress}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
                    rows={2}
                    placeholder="Shipping address"
                    style={{ ...inputStyle, resize: "vertical", marginTop: "6px" }}
                  />
                )}
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
                {saving ? "Saving..." : editing ? "Save Changes" : "Create Customer"}
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
              Request deletion of {deleteTarget.name}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
              An admin will review this request before the customer is removed.
            </p>
            <Label required>Reason</Label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              placeholder="Why should this customer be deleted?"
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

function countryName(code: string | null): string {
  if (!code) return "—";
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
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

const checkboxRow: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
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
