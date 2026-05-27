"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { RotateCcw, Save, Search, Send, Upload, Zap, CheckCircle, AlertTriangle, Mail, Lock } from "lucide-react";
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
const MAIL_PROVIDERS = ["SMTP", "Amazon SES", "SendGrid", "Mailgun", "Postmark", "Resend", "Custom"];
const ENCRYPTION_OPTIONS = ["None", "TLS", "SSL"];

type Message = { kind: "ok" | "err" | "info"; text: string };

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
  emailHeaderLogoUrl: string;
  brandColor: string;
  invoiceFooter: string;
  currency: string;
  weekStartDay: number;
};

type SmtpState = {
  mailProvider: string;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  encryption: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  enableEmailVerification: boolean;
  enablePasswordResetEmails: boolean;
  enableOrderConfirmationEmails: boolean;
  enableInvoiceEmails: boolean;
  enableStaffInvitationEmails: boolean;
  enableLowStockAlerts: boolean;
  emailFooterText: string;
  supportEmail: string;
  companyAddressFooter: string;
  emailDailySummaryEnabled: boolean;
};

type SmtpToggleKey =
  | "enableEmailVerification"
  | "enablePasswordResetEmails"
  | "enableOrderConfirmationEmails"
  | "enableInvoiceEmails"
  | "enableStaffInvitationEmails"
  | "enableLowStockAlerts";

const MAIL_FEATURE_TOGGLES: { key: SmtpToggleKey; label: string }[] = [
  { key: "enableEmailVerification", label: "Enable Email Verification" },
  { key: "enablePasswordResetEmails", label: "Enable Password Reset Emails" },
  { key: "enableOrderConfirmationEmails", label: "Enable Order Confirmation Emails" },
  { key: "enableInvoiceEmails", label: "Enable Invoice Emails" },
  { key: "enableStaffInvitationEmails", label: "Enable Staff Invitation Emails" },
  { key: "enableLowStockAlerts", label: "Enable Low Stock Alerts" },
];

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
    emailHeaderLogoUrl: s?.emailHeaderLogoUrl ?? "",
    brandColor: s?.brandColor ?? DEFAULT_BRAND,
    invoiceFooter: s?.invoiceFooter ?? "",
    currency: s?.currency ?? "BDT",
    weekStartDay: s?.weekStartDay ?? 0,
  };
}

function smtpDefaults(s: Settings | null): SmtpState {
  const companyAddress = [s?.address, s?.city, s?.state, s?.zipCode, s?.country]
    .filter(Boolean)
    .join(", ");

  return {
    mailProvider: s?.smtpProvider ?? "SMTP",
    smtpHost: s?.smtpHost ?? "",
    smtpPort: String(s?.smtpPort ?? 587),
    smtpUsername: s?.smtpUsername ?? "",
    smtpPassword: "", // Never pre-fill password - always masked on load
    encryption: s?.smtpEncryption ?? "TLS",
    fromEmail: s?.smtpFromEmail ?? s?.email ?? "",
    fromName: s?.smtpFromName ?? s?.businessName ?? "",
    replyToEmail: s?.smtpReplyTo ?? s?.email ?? "",
    enableEmailVerification: s?.emailUserRegistrationEnabled ?? false,
    enablePasswordResetEmails: s?.emailPasswordResetEnabled ?? false,
    enableOrderConfirmationEmails: s?.emailOrderConfirmationEnabled ?? false,
    enableInvoiceEmails: s?.emailInvoiceEnabled ?? false,
    enableStaffInvitationEmails: s?.emailStaffInvitationEnabled ?? false,
    enableLowStockAlerts: s?.emailLowStockEnabled ?? false,
    emailFooterText: s?.emailFooterText ?? s?.invoiceFooter ?? "",
    supportEmail: s?.supportEmail ?? s?.email ?? "",
    companyAddressFooter: s?.companyAddressFooter ?? companyAddress,
    emailDailySummaryEnabled: s?.emailDailySummaryEnabled ?? false,
  };
}

export default function SettingsPage() {
  const { settings, refreshSettings } = useSettings();
  const [form, setForm] = useState<FormState>(() => fromSettings(null));
  const [smtp, setSmtp] = useState<SmtpState>(() => smtpDefaults(null));
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<{ connected: boolean; fromEmail: string; lastTest: string | null }>({ connected: false, fromEmail: "", lastTest: null });
  const [smtpAccessEnabled, setSmtpAccessEnabled] = useState(false);
  const smtpPasswordRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!settings) return;
    setForm(fromSettings(settings));
    const defaults = smtpDefaults(settings);
    setSmtp({ ...defaults, smtpPassword: "" });
    setSmtpStatus({
      connected: Boolean(settings.smtpHost && settings.smtpUsername),
      fromEmail: settings.smtpFromEmail || settings.email || "",
      lastTest: null,
    });
  }, [settings]);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const res = await fetch("/api/subscription", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSmtpAccessEnabled(data.data?.usage?.smtpAccessEnabled ?? false);
        }
      } catch { /* silently ignore */ }
    }
    loadSubscription();
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setSmtpField<K extends keyof SmtpState>(key: K, value: SmtpState[K]) {
    setSmtp((current) => ({ ...current, [key]: value }));
  }

  async function showSmtpPlaceholder(action: string) {
    if (action === "Test SMTP Connection") {
      setSaving("test-connection");
      setMessage(null);
      try {
        const res = await fetch("/api/email/test-connection", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          setMessage({ kind: "ok", text: "SMTP connection successful. Your mail server is responding correctly." });
          setSmtpStatus(prev => ({ ...prev, connected: true, lastTest: new Date().toLocaleString() }));
        } else {
          setMessage({ kind: "err", text: data.message || "Connection failed" });
          setSmtpStatus(prev => ({ ...prev, connected: false, lastTest: new Date().toLocaleString() }));
        }
      } catch {
        setMessage({ kind: "err", text: "Network error" });
      } finally {
        setSaving(null);
      }
    } else if (action === "Send Test Email") {
      const testEmail = settings?.email || form.email;
      if (!testEmail) {
        setMessage({ kind: "err", text: "No email address found. Please set a business email first." });
        return;
      }
      if (!confirm(`Send test email to ${testEmail}?`)) return;
      setSaving("send-test");
      setMessage(null);
      try {
        const res = await fetch("/api/email/send-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: testEmail }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ kind: "ok", text: "Test email sent successfully. Please check your inbox/spam folder." });
          setSmtpStatus(prev => ({ ...prev, lastTest: new Date().toLocaleString() }));
        } else {
          setMessage({ kind: "err", text: data.message || "Failed to send" });
        }
      } catch {
        setMessage({ kind: "err", text: "Network error" });
      } finally {
        setSaving(null);
      }
    }
  }

  async function patch(section: string, data: Record<string, unknown>) {
    setSaving(section);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...normalize(data), settingsSection: section }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage({ kind: "err", text: err.error ?? "Save failed" });
      } else {
        setMessage({ kind: "ok", text: "Saved" });
        await refreshSettings();
        if (section === "email-smtp") {
          setSmtp((current) => ({ ...current, smtpPassword: "" }));
        }
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

  function normalize(data: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      if (typeof v === "string") {
        if (k === "smtpPassword") {
          if (v.length > 0 && v !== "********") out[k] = v;
          continue;
        }
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
    <div style={{ maxWidth: "1180px", margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Business Settings
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
            border: message.kind === "info" ? "1px solid var(--card-border)" : "none",
            backgroundColor:
              message.kind === "ok" ? "#dcfce7" : message.kind === "err" ? "#fee2e2" : "var(--input-bg)",
            color:
              message.kind === "ok" ? "#166534" : message.kind === "err" ? "#991b1b" : "var(--text-secondary)",
          }}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <div className="lg:col-span-1 xl:col-span-8">
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
            })
          }
        />
        </div>

        <div className="lg:col-span-1 xl:col-span-4">
        <BrandingSection
          form={form}
          set={set}
          saving={saving === "branding"}
          onSave={() =>
            patch("branding", {
              logoUrl: form.logoUrl,
              printLogoUrl: form.printLogoUrl,
              emailHeaderLogoUrl: form.emailHeaderLogoUrl,
              brandColor: form.brandColor,
            })
          }
        />
        </div>

        <div className="lg:col-span-1 xl:col-span-6">
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
        </div>

        <div className="lg:col-span-1 xl:col-span-6">
        <InvoiceSection
          form={form}
          set={set}
          saving={saving === "invoice"}
          onSave={() => patch("invoice", { invoiceFooter: form.invoiceFooter })}
        />
        </div>

        <div className="lg:col-span-2 xl:col-span-12">
        <EmailSmtpSection
          smtp={smtp}
          form={form}
          smtpStatus={smtpStatus}
          smtpAccessEnabled={smtpAccessEnabled}
          passwordRef={smtpPasswordRef}
          setSmtpField={setSmtpField}
          onPlaceholderAction={showSmtpPlaceholder}
          set={set}
          saving={saving}
          onSave={() =>
            patch("email-smtp", {
              emailHeaderLogoUrl: form.emailHeaderLogoUrl,
              smtpProvider: smtp.mailProvider,
              smtpHost: smtp.smtpHost,
              smtpPort: smtp.smtpPort ? parseInt(smtp.smtpPort) || 587 : 587,
              smtpUsername: smtp.smtpUsername,
              smtpPassword: smtp.smtpPassword,
              smtpEncryption: smtp.encryption,
              smtpFromEmail: smtp.fromEmail,
              smtpFromName: smtp.fromName,
              smtpReplyTo: smtp.replyToEmail,
              supportEmail: smtp.supportEmail,
              emailFooterText: smtp.emailFooterText,
              companyAddressFooter: smtp.companyAddressFooter,
              emailOrderConfirmationEnabled: smtp.enableOrderConfirmationEmails,
              emailInvoiceEnabled: smtp.enableInvoiceEmails,
              emailPasswordResetEnabled: smtp.enablePasswordResetEmails,
              emailUserRegistrationEnabled: smtp.enableEmailVerification,
              emailLowStockEnabled: smtp.enableLowStockAlerts,
              emailDailySummaryEnabled: smtp.emailDailySummaryEnabled,
              emailStaffInvitationEnabled: smtp.enableStaffInvitationEmails,
            })
          }
        />
        </div>
      </div>
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
    <Card title="Business Information">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
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
    <Card title="Branding">
      <div className="grid grid-cols-1 gap-3">
        <LogoUploader
          label="Main Logo"
          value={form.logoUrl}
          type="main"
          onChange={(url) => set("logoUrl", url)}
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
    <Card title="Regional Preferences">
      <div>
        <Label>Default Currency</Label>
        <CurrencyPicker value={form.currency} onChange={(v) => set("currency", v)} />
      </div>

      <div style={{ marginTop: "16px" }}>
        <Label>Week Starts On</Label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {WEEK_OPTIONS.map((opt) => {
            const active = form.weekStartDay === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("weekStartDay", opt.value)}
                style={{
                  flex: 1,
                  minWidth: "96px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--input-border)",
                  backgroundColor: active ? brandSoftBackground : "var(--input-bg)",
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
    <Card title="Invoice Settings">
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

/* ---------- Section: Email & SMTP ---------- */

function EmailSmtpSection({
  smtp,
  form,
  smtpStatus,
  smtpAccessEnabled,
  passwordRef,
  setSmtpField,
  onPlaceholderAction,
  set,
  saving,
  onSave,
}: {
  smtp: SmtpState;
  form: FormState;
  smtpStatus: { connected: boolean; fromEmail: string; lastTest: string | null };
  smtpAccessEnabled: boolean;
  passwordRef: React.RefObject<HTMLInputElement | null>;
  setSmtpField: <K extends keyof SmtpState>(k: K, v: SmtpState[K]) => void;
  onPlaceholderAction: (action: string) => void;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  saving: string | null;
  onSave: () => void;
}) {
  return (
    <Card title="Email & SMTP Configuration">
      {!smtpAccessEnabled ? (
        <div style={{ marginBottom: "16px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: "#fef3c7",
            border: "1px solid #fcd34d",
            fontSize: "12px",
            color: "#92400e",
          }}>
            <Lock size={14} style={{ flexShrink: 0 }} />
            <span>Custom SMTP is not available on your current plan. <a href="/system/subscription" style={{ fontWeight: 600, color: "#92400e", textDecoration: "underline" }}>Upgrade</a> to Starter, Business or Custom to configure business email.</span>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", lineHeight: "1.5" }}>
            Upgrade to Starter, Business or Custom plan to unlock custom SMTP configuration for your business.
          </p>
        </div>
      ) : (
        <SmtpStatusCard status={smtpStatus} saving={saving} />
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div style={{ opacity: smtpAccessEnabled ? 1 : 0.5, pointerEvents: smtpAccessEnabled ? "auto" : "none" }}>
          <Subheading>SMTP Connection</Subheading>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px", marginTop: "-6px" }}>
            Configure your mail server to send emails from your business address.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>Mail Driver / Provider</Label>
              <select
                value={smtp.mailProvider}
                onChange={(e) => setSmtpField("mailProvider", e.target.value)}
                style={inputStyle}
              >
                {MAIL_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>
            <Field disabled={!smtpAccessEnabled} label="SMTP Host" value={smtp.smtpHost} onChange={(v) => setSmtpField("smtpHost", v)} />
            <Field disabled={!smtpAccessEnabled} label="SMTP Port" type="number" value={smtp.smtpPort} onChange={(v) => setSmtpField("smtpPort", v)} />
            <Field disabled={!smtpAccessEnabled} label="SMTP Username" value={smtp.smtpUsername} onChange={(v) => setSmtpField("smtpUsername", v)} />
            <div>
              <Label>SMTP Password</Label>
              <input
                ref={passwordRef}
                type="password"
                autoComplete="new-password"
                value={smtp.smtpPassword}
                onChange={(e) => setSmtpField("smtpPassword", e.target.value)}
                style={inputStyle}
                disabled
              />
            </div>
            <div>
              <Label>Encryption</Label>
              <select
                value={smtp.encryption}
                onChange={(e) => setSmtpField("encryption", e.target.value)}
                style={inputStyle}
              >
                {ENCRYPTION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <Field disabled={!smtpAccessEnabled} label="From Email" type="email" value={smtp.fromEmail} onChange={(v) => setSmtpField("fromEmail", v)} />
            <Field disabled={!smtpAccessEnabled} label="From Name" value={smtp.fromName} onChange={(v) => setSmtpField("fromName", v)} />
            <Field disabled={!smtpAccessEnabled} label="Reply-To Email" type="email" value={smtp.replyToEmail} onChange={(v) => setSmtpField("replyToEmail", v)} />
          </div>
        </div>

        <div>
          <Subheading>Mail Feature Toggles</Subheading>
          <div style={{ ...togglePanelStyle, opacity: smtpAccessEnabled ? 1 : 0.5, pointerEvents: smtpAccessEnabled ? "auto" : "none" }}>
            {MAIL_FEATURE_TOGGLES.map((toggle) => (
              <label key={toggle.key} style={toggleRowStyle}>
                <input
                  type="checkbox"
                  checked={smtp[toggle.key]}
                  onChange={(e) => setSmtpField(toggle.key, e.target.checked)}
                  style={{ accentColor: "var(--brand)" }}
                  disabled={!smtpAccessEnabled}
                />
                <span>{toggle.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(220px,0.75fr)_minmax(0,1.25fr)]">
        <div>
          <Subheading>Email Header Logo</Subheading>
          <div style={{ opacity: smtpAccessEnabled ? 1 : 0.5, pointerEvents: smtpAccessEnabled ? "auto" : "none" }}>
            <LogoUploader
              label="Email Header Logo"
              value={form.emailHeaderLogoUrl}
              type="email-header"
              onChange={(url) => set("emailHeaderLogoUrl", url)}
              disabled={!smtpAccessEnabled}
            />
          </div>
        </div>

        <div>
          <Subheading>Email Branding & Footer</Subheading>
          <div
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
            style={{ opacity: smtpAccessEnabled ? 1 : 0.5, pointerEvents: smtpAccessEnabled ? "auto" : "none" }}
          >
            <Field
              label="Support Email"
              type="email"
              value={smtp.supportEmail}
              onChange={(v) => setSmtpField("supportEmail", v)}
              disabled={!smtpAccessEnabled}
            />
            <div>
              <Label>Template Accent Color</Label>
              <div style={accentPreviewStyle}>
                <span style={accentSwatchStyle} />
                <span style={{ fontFamily: "ui-monospace, monospace" }}>
                  {form.brandColor || "var(--brand)"}
                </span>
              </div>
            </div>
            <div className="md:col-span-2" style={{ marginBottom: "12px" }}>
              <Label>Email Footer Text</Label>
              <textarea
                value={smtp.emailFooterText}
                onChange={(e) => setSmtpField("emailFooterText", e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Company Address in Footer</Label>
              <textarea
                value={smtp.companyAddressFooter}
                onChange={(e) => setSmtpField("companyAddressFooter", e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={smtpActionsStyle}>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginRight: "auto" }}>
          <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>Test SMTP Connection:</span> Checks whether your mail server credentials are valid.
          {" "}<span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>Send Test Email:</span> Sends a real email to verify delivery is working.
        </p>
        <button type="button" onClick={onSave} disabled={!!saving || !smtpAccessEnabled} style={{ ...btnPrimary, opacity: (!!saving || !smtpAccessEnabled) ? 0.6 : 1, minWidth: "180px", justifyContent: "center" }}>
          <Save size={13} /> {saving === "email-smtp" ? "Saving..." : "Save Email & SMTP Settings"}
        </button>
        <button type="button" onClick={() => onPlaceholderAction("Test SMTP Connection")} disabled={!!saving || !smtpAccessEnabled} style={{ ...smtpButtonStyle, opacity: !!saving || !smtpAccessEnabled ? 0.5 : 1 }}>
          <Zap size={13} /> {saving === "test-connection" ? "Testing..." : "Test SMTP Connection"}
        </button>
        <button type="button" onClick={() => onPlaceholderAction("Send Test Email")} disabled={!!saving || !smtpAccessEnabled} style={{ ...smtpButtonStyle, opacity: !!saving || !smtpAccessEnabled ? 0.5 : 1 }}>
          <Send size={13} /> {saving === "send-test" ? "Sending..." : "Send Test Email"}
        </button>
      </div>
    </Card>
  );
}

/* ---------- SMTP Status Card ---------- */

function SmtpStatusCard({ status }: { status: { connected: boolean; fromEmail: string; lastTest: string | null }; saving: string | null }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      borderRadius: "10px",
      border: "1px solid var(--card-border)",
      backgroundColor: status.connected ? "#dcfce7" : "var(--input-bg)",
      marginBottom: "16px",
      minHeight: "72px",
    }}>
      {status.connected ? (
        <CheckCircle size={20} color="#166534" />
      ) : (
        <AlertTriangle size={20} color="#92400e" />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: status.connected ? "#166534" : "#92400e" }}>
          {status.connected ? "SMTP Connected" : "SMTP Not Connected"}
        </div>
        <div style={{ fontSize: "11px", color: status.connected ? "#166534" : "#92400e", opacity: 0.8 }}>
          From: {status.fromEmail || "—"}
          {status.lastTest && <span style={{ marginLeft: "8px" }}>· Last tested: {status.lastTest}</span>}
        </div>
      </div>
      {!status.connected && (
        <div style={{ fontSize: "11px", color: "#92400e", display: "flex", alignItems: "center", gap: "4px" }}>
          <Mail size={12} />
          <span>Configure SMTP below</span>
        </div>
      )}
    </div>
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
        <span style={{ color: "var(--text-secondary)" }}>- {selected.name}</span>
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
                    background: c.code === value ? brandSoftBackground : "transparent",
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
  disabled,
}: {
  label: string;
  value: string;
  type: "main" | "print" | "email-header";
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    if (disabled) return;
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
          PNG, JPG, SVG - Max 2MB
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
          disabled={uploading || disabled}
          style={{ ...btnSecondary, opacity: (uploading || disabled) ? 0.6 : 1 }}
        >
          <Upload size={13} />
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {value && !disabled && (
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
        marginBottom: 0,
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

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "12px",
        fontWeight: 700,
        color: "var(--text-secondary)",
        marginBottom: "10px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, opacity: disabled ? 0.5 : 1 }}
        disabled={disabled}
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

const brandSoftBackground = "color-mix(in srgb, var(--brand) 12%, transparent)";

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
  color: "var(--brand-text)",
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

const togglePanelStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--input-bg)",
};

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  minHeight: "34px",
  color: "var(--text-primary)",
  fontSize: "13px",
  cursor: "pointer",
};

const accentPreviewStyle: React.CSSProperties = {
  ...inputStyle,
  display: "flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: brandSoftBackground,
  color: "var(--text-primary)",
};

const accentSwatchStyle: React.CSSProperties = {
  width: "18px",
  height: "18px",
  borderRadius: "999px",
  backgroundColor: "var(--brand)",
  border: "1px solid var(--card-border)",
  flexShrink: 0,
};

const smtpActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const smtpButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 14px",
  borderRadius: "7px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  minWidth: "150px",
  justifyContent: "center",
  transition: "opacity 0.15s ease",
};
