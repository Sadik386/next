"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, Plus, X, Search, Eye, Trash } from "lucide-react";
import { COUNTRIES, CURRENCIES } from "@/constants/countries";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar } from "@/components/ui/BulkActionBar";
import { toast } from "sonner";
import { normalizePhoneString, normalizeCountryValue } from "@/lib/normalize";
import { readErrorMessage } from "@/lib/read-error-message";

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
  paymentMethods: SupplierPaymentMethod[] | null;
};

const PAYMENT_TERMS = ["Net 7", "Net 15", "Net 30", "Net 45", "Net 60", "Net 90", "Cash on Delivery", "Advance Payment"];
const MFS_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"] as const;

type PaymentType = "BANK" | "MFS";
type MfsProvider = (typeof MFS_PROVIDERS)[number];

type SupplierPaymentMethod =
  | {
      type: "MFS";
      provider: MfsProvider;
      accountNumber: string;
    }
  | {
      type: "BANK";
      bankName: string;
      accountName: string;
      accountNumber: string;
      branchName: string;
      routingNumber: string;
      swiftCode: string;
    };

type PaymentMethodForm = {
  id: string;
  type: PaymentType;
  provider: "" | MfsProvider;
  accountNumber: string;
  bankName: string;
  accountName: string;
  branchName: string;
  routingNumber: string;
  swiftCode: string;
};

type SupplierForm = {
  companyName: string;
  contactName: string;
  email: string;
  mobile: string;
  paymentTerms: string;
  currency: string;
  taxId: string;
  website: string;
  category: string;
  deliveryMethod: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  status: string;
  paymentMethods: PaymentMethodForm[];
};

type PaymentMethodsPayloadResult =
  | { paymentMethods: SupplierPaymentMethod[]; error?: undefined }
  | { paymentMethods?: undefined; error: string };

const createEmptyForm = (): SupplierForm => ({
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
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  country: "BD",
  status: "active",
  paymentMethods: [],
});

function createPaymentMethod(type: PaymentType = "MFS"): PaymentMethodForm {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    provider: "",
    accountNumber: "",
    bankName: "",
    accountName: "",
    branchName: "",
    routingNumber: "",
    swiftCode: "",
  };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isMfsProvider(value: string): value is MfsProvider {
  return MFS_PROVIDERS.includes(value as MfsProvider);
}

function paymentMethodFromValue(value: unknown): PaymentMethodForm | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const method = value as Record<string, unknown>;
  const type = method.type === "BANK" || method.type === "MFS" ? method.type : null;
  if (!type) return null;

  if (type === "MFS") {
    const provider = stringValue(method.provider);
    if (!isMfsProvider(provider)) return null;
    return {
      ...createPaymentMethod("MFS"),
      provider,
      accountNumber: stringValue(method.accountNumber),
    };
  }

  return {
    ...createPaymentMethod("BANK"),
    bankName: stringValue(method.bankName),
    accountName: stringValue(method.accountName),
    accountNumber: stringValue(method.accountNumber),
    branchName: stringValue(method.branchName),
    routingNumber: stringValue(method.routingNumber),
    swiftCode: stringValue(method.swiftCode),
  };
}

function legacyPaymentMethodsFromSupplier(supplier: Supplier): PaymentMethodForm[] {
  const methods: PaymentMethodForm[] = [];

  if (supplier.bankName || supplier.bankAccount) {
    methods.push({
      ...createPaymentMethod("BANK"),
      bankName: supplier.bankName ?? "",
      accountName: supplier.accountName ?? "",
      accountNumber: supplier.bankAccount ?? "",
      branchName: supplier.branchName ?? "",
      routingNumber: supplier.routingNumber ?? "",
      swiftCode: supplier.swiftCode ?? "",
    });
  }

  const legacyMfs: Array<[MfsProvider, string | null]> = [
    ["bKash", supplier.bkash],
    ["Nagad", supplier.nagad],
    ["Rocket", supplier.rocket],
    ["Upay", supplier.upay],
  ];

  legacyMfs.forEach(([provider, accountNumber]) => {
    if (accountNumber) {
      methods.push({
        ...createPaymentMethod("MFS"),
        provider,
        accountNumber,
      });
    }
  });

  return methods;
}

function paymentMethodsFromSupplier(supplier: Supplier): PaymentMethodForm[] {
  const fromJson = Array.isArray(supplier.paymentMethods)
    ? supplier.paymentMethods
        .map((method) => paymentMethodFromValue(method))
        .filter((method): method is PaymentMethodForm => Boolean(method))
    : [];

  return fromJson.length ? fromJson : legacyPaymentMethodsFromSupplier(supplier);
}

function buildPaymentMethodsPayload(methods: PaymentMethodForm[]): PaymentMethodsPayloadResult {
  const paymentMethods: SupplierPaymentMethod[] = [];

  for (const [index, method] of methods.entries()) {
    if (method.type === "MFS") {
      const provider = method.provider;
      const accountNumber = method.accountNumber.trim();
      if (!provider && !accountNumber) continue;
      if (!provider) return { error: `Payment method #${index + 1} needs an MFS provider.` };
      if (!accountNumber) return { error: `Payment method #${index + 1} account number is required.` };
      paymentMethods.push({ type: "MFS", provider, accountNumber });
      continue;
    }

    const bankName = method.bankName.trim();
    const accountName = method.accountName.trim();
    const accountNumber = method.accountNumber.trim();
    const branchName = method.branchName.trim();
    const routingNumber = method.routingNumber.trim();
    const swiftCode = method.swiftCode.trim();
    const hasAnyBankDetail = Boolean(bankName || accountName || accountNumber || branchName || routingNumber || swiftCode);
    if (!hasAnyBankDetail) continue;
    if (!bankName && !accountNumber) {
      return { error: `Bank payment method #${index + 1} requires bank name or account number.` };
    }

    paymentMethods.push({
      type: "BANK",
      bankName,
      accountName,
      accountNumber,
      branchName,
      routingNumber,
      swiftCode,
    });
  }

  return { paymentMethods };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(() => createEmptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const { selectedIds, selectedCount, isAllSelected, toggle, selectAll, clearSelection, isSelected } = useBulkSelection({ items: suppliers });

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
    setForm(createEmptyForm());
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      companyName: s.companyName,
      contactName: s.contactName,
      email: s.email ?? "",
      mobile: normalizePhoneString(s.mobile ?? ""),
      paymentTerms: s.paymentTerms ?? "Net 30",
      currency: s.currency,
      taxId: s.taxId ?? "",
      website: s.website ?? "",
      category: s.category ?? "",
      deliveryMethod: s.deliveryMethod ?? "",
      streetAddress: s.streetAddress ?? "",
      city: s.city ?? "",
      state: s.state ?? "",
      zipCode: s.zipCode ?? "",
      country: normalizeCountryValue(s.country) || "BD",
      status: s.status,
      paymentMethods: paymentMethodsFromSupplier(s),
    });
    setError(null);
    setDrawerOpen(true);
  }

  async function handleSubmit(e?: React.FormEvent | React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault();
    setError(null);
    if (!form.companyName.trim()) return setError("Company name is required.");
    if (!form.contactName.trim()) return setError("Contact name is required.");
    if (!form.mobile.trim()) return setError("Mobile number is required.");
    if (!form.paymentTerms.trim()) return setError("Payment terms is required.");
    if (!form.currency.trim()) return setError("Currency is required.");
    if (!form.country.trim()) return setError("Country is required.");
    if (!form.status.trim()) return setError("Status is required.");

    const paymentMethodsResult = buildPaymentMethodsPayload(form.paymentMethods);
    if (paymentMethodsResult.error) return setError(paymentMethodsResult.error);

    const wasEditing = Boolean(editing);
    setSaving(true);
    const body = {
      companyName: form.companyName.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim() || null,
      mobile: normalizePhoneString(form.mobile.trim()) || null,
      paymentTerms: form.paymentTerms,
      currency: form.currency,
      taxId: form.taxId.trim() || null,
      website: form.website.trim() || null,
      category: form.category.trim() || null,
      deliveryMethod: form.deliveryMethod.trim() || null,
      paymentMethods: paymentMethodsResult.paymentMethods,
      streetAddress: form.streetAddress.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zipCode: form.zipCode.trim() || null,
      country: form.country || null,
      status: form.status,
    };
    const url = editing ? `/api/suppliers/${editing.id}` : "/api/suppliers";
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
      toast.success(wasEditing ? "Supplier updated" : "Supplier created");
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
    const targetName = deleteTarget.companyName;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/suppliers/${deleteTarget.id}/delete-request`, {
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

  async function submitBulkDelete() {
    if (!bulkReason.trim()) return;
    setBulkSubmitting(true);
    try {
      const res = await fetch("/api/suppliers/bulk/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, reason: bulkReason.trim() }),
      });
      const data = res.ok ? await res.json() : null;
      if (res.ok) {
        toast.success(`Delete requests created: ${data.created}, failed: ${data.failed}`);
        clearSelection();
        setBulkModalOpen(false);
        setBulkReason("");
        load();
      } else {
        toast.error(await readErrorMessage(res, "Bulk request failed"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk request failed");
    } finally {
      setBulkSubmitting(false);
    }
  }

  function addPaymentMethod() {
    setForm((current) => ({
      ...current,
      paymentMethods: [...current.paymentMethods, createPaymentMethod()],
    }));
  }

  function updatePaymentMethod(id: string, changes: Partial<PaymentMethodForm>) {
    setForm((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.map((method) =>
        method.id === id ? { ...method, ...changes } : method
      ),
    }));
  }

  function removePaymentMethod(id: string) {
    setForm((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.filter((method) => method.id !== id),
    }));
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
              <Th style={{ width: "40px" }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={selectAll}
                  style={{ cursor: "pointer", width: "16px", height: "16px" }}
                />
              </Th>
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
                <td colSpan={8} style={emptyCell}>
                  Loading...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={8} style={emptyCell}>
                  No suppliers yet. Click &ldquo;New Supplier&rdquo; to add one.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--card-border)", backgroundColor: isSelected(s.id) ? "rgba(37,99,235,0.04)" : undefined }}>
                  <Td>
                    <input
                      type="checkbox"
                      checked={isSelected(s.id)}
                      onChange={() => toggle(s.id)}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                  </Td>
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

      <BulkActionBar selectedCount={selectedCount} onClear={clearSelection}>
        <button
          onClick={() => setBulkModalOpen(true)}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "6px",
            padding: "5px 12px",
            cursor: "pointer",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <Trash size={13} /> Request Delete
        </button>
      </BulkActionBar>

      {bulkModalOpen && (
        <>
          <div onClick={() => setBulkModalOpen(false)} style={modalOverlay} />
          <div style={modalBox}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              Request deletion of {selectedCount} suppliers
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
              An admin will review these requests before the suppliers are removed.
            </p>
            <Label required>Reason</Label>
            <textarea
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              rows={3}
              placeholder="Why should these suppliers be deleted?"
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button onClick={() => setBulkModalOpen(false)} style={btnSecondary}>Cancel</button>
              <button
                onClick={submitBulkDelete}
                disabled={!bulkReason.trim() || bulkSubmitting}
                style={{ ...btnPrimary, backgroundColor: "#dc2626", opacity: !bulkReason.trim() || bulkSubmitting ? 0.6 : 1 }}
              >
                {bulkSubmitting ? "Submitting..." : "Submit Requests"}
              </button>
            </div>
          </div>
        </>
      )}

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
                  required
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
                    required
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
                    required
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

              <PaymentMethodsSection
                methods={form.paymentMethods}
                onAdd={addPaymentMethod}
                onRemove={removePaymentMethod}
                onChange={updatePaymentMethod}
              />

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
                  <Label required>Country</Label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    required
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
                <Label required>Status</Label>
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

const btnCompactSecondary: React.CSSProperties = {
  ...btnSecondary,
  padding: "6px 10px",
  fontSize: "12px",
};

const btnRemovePayment: React.CSSProperties = {
  ...btnCompactSecondary,
  color: "#dc2626",
  borderColor: "rgba(220,38,38,0.3)",
};

const paymentSection: React.CSSProperties = {
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  padding: "12px",
  display: "grid",
  gap: "10px",
};

const paymentSectionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

const paymentEntryStyle: React.CSSProperties = {
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  padding: "10px",
  display: "grid",
  gap: "10px",
  backgroundColor: "var(--input-bg)",
};

const paymentEntryHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};

const twoColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const paymentEmptyState: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: "12px",
  padding: "8px 0",
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
  width: "min(480px, 100vw)",
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

function PaymentMethodsSection({
  methods,
  onAdd,
  onRemove,
  onChange,
}: {
  methods: PaymentMethodForm[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, changes: Partial<PaymentMethodForm>) => void;
}) {
  return (
    <section style={paymentSection}>
      <div style={paymentSectionHeader}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
          Payment Methods
        </h3>
        <button type="button" onClick={onAdd} style={btnCompactSecondary}>
          <Plus size={13} /> Add Payment Method
        </button>
      </div>

      {methods.length === 0 ? (
        <div style={paymentEmptyState}>No payment methods added.</div>
      ) : (
        methods.map((method, index) => (
          <div key={method.id} style={paymentEntryStyle}>
            <div style={paymentEntryHeader}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                Method {index + 1}
              </span>
              <button type="button" onClick={() => onRemove(method.id)} style={btnRemovePayment}>
                <Trash2 size={13} /> Remove
              </button>
            </div>

            <div style={twoColumnGrid}>
              <div>
                <Label>Payment Type</Label>
                <select
                  value={method.type}
                  onChange={(e) =>
                    onChange(method.id, {
                      ...createPaymentMethod(e.target.value as PaymentType),
                      id: method.id,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="MFS">MFS</option>
                  <option value="BANK">Bank</option>
                </select>
              </div>

              {method.type === "MFS" && (
                <div>
                  <Label>MFS Provider</Label>
                  <select
                    value={method.provider}
                    onChange={(e) =>
                      onChange(method.id, {
                        provider: e.target.value as "" | MfsProvider,
                        accountNumber: "",
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="">Select provider</option>
                    {MFS_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {method.type === "MFS" && method.provider && (
              <Field
                label={`${method.provider} Number`}
                value={method.accountNumber}
                onChange={(value) => onChange(method.id, { accountNumber: value })}
              />
            )}

            {method.type === "BANK" && (
              <>
                <div style={twoColumnGrid}>
                  <Field
                    label="Bank Name"
                    value={method.bankName}
                    onChange={(value) => onChange(method.id, { bankName: value })}
                  />
                  <Field
                    label="Account Name"
                    value={method.accountName}
                    onChange={(value) => onChange(method.id, { accountName: value })}
                  />
                </div>
                <div style={twoColumnGrid}>
                  <Field
                    label="Account Number"
                    value={method.accountNumber}
                    onChange={(value) => onChange(method.id, { accountNumber: value })}
                  />
                  <Field
                    label="Branch Name"
                    value={method.branchName}
                    onChange={(value) => onChange(method.id, { branchName: value })}
                  />
                </div>
                <div style={twoColumnGrid}>
                  <Field
                    label="Routing Number"
                    value={method.routingNumber}
                    onChange={(value) => onChange(method.id, { routingNumber: value })}
                  />
                  <Field
                    label="SWIFT / BIC Code"
                    value={method.swiftCode}
                    onChange={(value) => onChange(method.id, { swiftCode: value })}
                  />
                </div>
              </>
            )}
          </div>
        ))
      )}
    </section>
  );
}

function Th({ children, align, style }: { children: React.ReactNode; align?: "left" | "right"; style?: React.CSSProperties }) {
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
        ...style,
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
        required={required}
        style={inputStyle}
      />
    </div>
  );
}
