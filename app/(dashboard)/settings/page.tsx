"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Upload, RotateCcw, Search } from "lucide-react";
import { COUNTRIES } from "@/constants/countries";
import { CURRENCIES } from "@/constants/currencies";
import { useSettings, type Settings } from "@/contexts/SettingsContext";

const DEFAULT_BRAND = "#C4973A";
const PRESET_COLORS = ["#C4973A", "#6366F1", "#8B5CF6", "#10B981", "#0EA5E9", "#EF4444"];
const WEEK_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 6, label: "Saturday" },
];

type FormState = {
  businessName: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  logoUrl: string;
  printLogoUrl: string;
  brandColor: string;
  invoiceFooter: string;
  currency: string;
  weekStartDay: number;
};

function fromSettings(s: Settings | null): FormState {
  return {
    businessName: s?.businessName ?? "",
    tagline: s?.tagline ?? "",
    email: s?.email ?? "",
    phone: s?.phone ?? "",
    website: s?.website ?? "",
    taxId: s?.taxId ?? "",
    address: s?.address ?? "",
    city: s?.city ?? "",
    state: s?.state ?? "",
    zipCode: s?.zipCode ?? "",
    country: s?.country ?? "",
    logoUrl: s?.logoUrl ?? "",
    printLogoUrl: s?.printLogoUrl ?? "",
    brandColor: s?.brandColor ?? DEFAULT_BRAND,
    invoiceFooter: s?.invoiceFooter ?? "",
    currency: s?.currency ?? "BDT",
    weekStartDay: s?.weekStartDay ?? 0,
  };
}

export default function SettingsPage() {
  const { settings, refreshSettings } = useSettings();
  const [form, setForm] = useState<FormState>(() => fromSettings(null));
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (settings) setForm(fromSettings(settings));
  }, [settings]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function patch(section: string, data: Partial<FormState>) {
    setSaving(section);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalize(data)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage({ kind: "err", text: err.error ?? "Save failed" });
      } else {
        setMessage({ kind: "ok", text: "Saved" });
        await refreshSettings();
        if (data.brandColor !== undefined) {
          window.dispatchEvent(new CustomEvent("brandColorChanged"));
        }
      }
    } catch {
      setMessage({ kind: "err", text: "Network error" });
    } finally {
      setSaving(null);
    }
  }

  function normalize(data: Partial<FormState>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      if (typeof v === "string") {
        const trimmed = v.trim();
        out[k] = trimmed.length === 0 ? null : trimmed;
      } else {
        out[k] = v;
      }
    }
    if ("businessName" in out && !out.businessName) {
      out.businessName = "My Business";
    }
    return out;
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Settings
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
          Manage your business profile and preferences
        </p>
      </div>

      {message && (
        <div
          style={{
            marginBottom: "12px",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            backgroundColor: message.kind === "ok" ? "#dcfce7" : "#fee2e2",
            color: message.kind === "ok" ? "#166534" : "#991b1b",
          }}
        >
          {message.text}
        </div>
      )}

      <BusinessInfoSection
        form={form}
        set={set}
        saving={saving === "business"}
        onSave={() =>
          patch("business", {
            businessName: form.businessName,
            tagline: form.tagline,
            email: form.email,
            phone: form.phone,
            website: form.website,
            taxId: form.taxId,
            address: form.address,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            country: form.country,
            currency: form.currency,
          })
        }
      />

      <BrandingSection
        form={form}
        set={set}
        saving={saving === "branding"}
        onSave={() =>
          patch("branding", {
            logoUrl: form.logoUrl,
            printLogoUrl: form.printLogoUrl,
            brandColor: form.brandColor,
          })
        }
      />

      <RegionalSection
        form={form}
        set={set}
        saving={saving === "regional"}
        onSave={() =>
          patch("regional", {
            currency: form.currency,
            weekStartDay: form.weekStartDay,
          })
        }
      />

      <InvoiceSection
        form={form}
        set={set}
        saving={saving === "invoice"}
        onSave={() => patch("invoice", { invoiceFooter: form.invoiceFooter })}
      />
    </div>
  );
}

/* ---------- Section: Business Info ---------- */

function BusinessInfoSection({
  form,
  set,
  saving,
  onSave,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Card title="🏢 Business Information">
      <div style={grid2}>
        <Field label="Business Name" required value={form.businessName} onChange={(v) => set("businessName", v)} />
        <Field label="Tagline / Slogan" value={form.tagline} onChange={(v) => set("tagline", v)} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
        <Field label="Phone" type="tel" value={form.phone} onChange={(v) => set("phone", v)} />
        <Field label="Website" type="url" value={form.website} onChange={(v) => set("website", v)} />
        <Field label="Tax ID / VAT Number" value={form.taxId} onChange={(v) => set("taxId", v)} />
      </div>

      <div style={{ marginTop: "12px" }}>
        <Label>Street Address</Label>
        <input value={form.address} onChange={(e) => set("address", e.target.value)} style={inputStyle} />
      </div>

      <div style={{ ...grid2, marginTop: "12px" }}>
        <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
        <Field label="State / Division" value={form.state} onChange={(v) => set("state", v)} />
        <Field label="ZIP / Postal Code" value={form.zipCode} onChange={(v) => set("zipCode", v)} />
        <div>
          <Label>Country</Label>
          <select value={form.country} onChange={(e) => set("country", e.target.value)} style={inputStyle}>
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: "12px" }}>
        <Label>Default Currency</Label>
        <CurrencyPicker value={form.currency} onChange={(v) => set("currency", v)} />
      </div>

      <SaveBar onSave={onSave} saving={saving} label="Save Business Info" />
    </Card>
  );
}

/* ---------- Section: Branding ---------- */

function BrandingSection({
  form,
  set,
  saving,
  onSave,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Card title="🎨 Branding">
      <div style={grid2}>
        <LogoUploader
          label="Main Logo"
          value={form.logoUrl}
          type="main"
          onChange={(url) => set("logoUrl", url)}
        />
        <LogoUploader
          label="Print Logo"
          value={form.printLogoUrl}
          type="print"
          onChange={(url) => set("printLogoUrl", url)}
        />
      </div>

      <div style={{ marginTop: "16px" }}>
        <Label>Brand Color</Label>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: form.brandColor,
              border: "1px solid var(--card-border)",
              flexShrink: 0,
            }}
          />
          <input
            value={form.brandColor}
            onChange={(e) => {
              const v = e.target.value;
              set("brandColor", v);
              if (/^#[0-9A-Fa-f]{6}$/.test(v) && typeof document !== "undefined") {
                document.documentElement.style.setProperty("--brand", v);
              }
            }}
            placeholder="#C4973A"
            style={{ ...inputStyle, maxWidth: "140px", fontFamily: "ui-monospace, monospace" }}
          />
          <button
            type="button"
            onClick={() => {
              set("brandColor", DEFAULT_BRAND);
              if (typeof document !== "undefined") {
                document.documentElement.style.setProperty("--brand", DEFAULT_BRAND);
              }
            }}
            style={btnSecondary}
          >
            <RotateCcw size={13} /> Reset to Default
          </button>
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                set("brandColor", c);
                if (typeof document !== "undefined") {
                  document.documentElement.style.setProperty("--brand", c);
                }
              }}
              title={c}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "999px",
                border:
                  form.brandColor.toLowerCase() === c.toLowerCase()
                    ? "2px solid var(--text-primary)"
                    : "2px solid var(--card-border)",
                backgroundColor: c,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      <SaveBar onSave={onSave} saving={saving} label="Save Branding" />
    </Card>
  );
}

/* ---------- Section: Regional Preferences ---------- */

function RegionalSection({
  form,
  set,
  saving,
  onSave,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Card title="🌍 Regional Preferences">
      <div>
        <Label>Default Currency</Label>
        <CurrencyPicker value={form.currency} onChange={(v) => set("currency", v)} />
      </div>

      <div style={{ marginTop: "16px" }}>
        <Label>Week Starts On</Label>
        <div style={{ display: "flex", gap: "8px" }}>
          {WEEK_OPTIONS.map((opt) => {
            const active = form.weekStartDay === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("weekStartDay", opt.value)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--input-border)",
                  backgroundColor: active ? "var(--brand-light)" : "var(--input-bg)",
                  color: active ? "var(--brand)" : "var(--text-secondary)",
                  fontWeight: active ? 600 : 400,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <SaveBar onSave={onSave} saving={saving} label="Save Preferences" />
    </Card>
  );
}

/* ---------- Section: Invoice Settings ---------- */

function InvoiceSection({
  form,
  set,
  saving,
  onSave,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Card title="📄 Invoice Settings">
      <Label>Invoice Footer Text</Label>
      <textarea
        value={form.invoiceFooter}
        onChange={(e) => set("invoiceFooter", e.target.value)}
        placeholder="Thank you for your business..."
        rows={4}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
        Appears at the bottom of printed invoices.
      </p>
      <SaveBar onSave={onSave} saving={saving} label="Save Invoice Settings" />
    </Card>
  );
}

/* ---------- Building Blocks ---------- */

function CurrencyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0],
    [value]
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...inputStyle,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "16px" }}>{selected.flag}</span>
        <span style={{ fontWeight: 600 }}>{selected.code}</span>
        <span style={{ color: "var(--text-secondary)" }}>· {selected.name}</span>
        <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>{selected.symbol}</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 50,
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "8px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
            maxHeight: "320px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 10px",
              borderBottom: "1px solid var(--card-border)",
            }}
          >
            <Search size={13} color="var(--text-muted)" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search currency"
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
          <div style={{ overflowY: "auto", maxHeight: "260px" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                No matches
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    border: "none",
                    background: c.code === value ? "var(--brand-light)" : "transparent",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{c.flag}</span>
                  <span style={{ fontWeight: 600, minWidth: "40px" }}>{c.code}</span>
                  <span style={{ color: "var(--text-secondary)", flex: 1 }}>{c.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{c.symbol}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LogoUploader({
  label,
  value,
  type,
  onChange,
}: {
  label: string;
  value: string;
  type: "main" | "print";
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed");
      return;
    }
    const data = await res.json();
    if (data.url) onChange(data.url);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div>
      <Label>{label}</Label>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        style={{
          border: "1px dashed var(--input-border)",
          borderRadius: "8px",
          padding: "16px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: "var(--input-bg)",
          minHeight: "120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {value ? (
          <Image
            src={value}
            alt={label}
            width={120}
            height={60}
            style={{ maxHeight: "60px", width: "auto", objectFit: "contain" }}
            unoptimized
          />
        ) : (
          <Upload size={20} color="var(--text-muted)" />
        )}
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {value ? "Click or drop to replace" : "Click or drop image here"}
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
          PNG, JPG, SVG · Max 2MB
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ ...btnSecondary, opacity: uploading ? 0.6 : 1 }}
        >
          <Upload size={13} />
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} style={btnSecondary}>
            Remove
          </button>
        )}
      </div>
      {error && (
        <div
          style={{
            marginTop: "6px",
            padding: "6px 8px",
            borderRadius: "6px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            fontSize: "11px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}
    >
      <h2
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "16px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function SaveBar({ onSave, saving, label }: { onSave: () => void; saving: boolean; label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Saving..." : label}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
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

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "12px",
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
  padding: "8px 14px",
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
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
};
