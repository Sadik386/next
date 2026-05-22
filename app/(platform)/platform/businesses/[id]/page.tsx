"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Package,
  RotateCcw,
  Save,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type PlanOption = {
  id: number;
  name: string;
  label: string;
};

type LimitMetric = {
  used: number;
  planLimit: number;
  override: number | null;
  effectiveLimit: number;
};

type BusinessDetail = {
  business: {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    ownerEmail: string;
    ownerName: string;
  };
  subscription: {
    id: number | null;
    status: string;
    billingCycle: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  plan: {
    code: string;
    label: string;
    description: string;
    badge: string;
    priceMonthly: number;
    priceYearly: number;
  };
  usage: {
    users: LimitMetric;
    products: LimitMetric;
    emails: LimitMetric;
    apiAccessEnabled: boolean;
    smtpAccessEnabled: boolean;
  };
  featureAccess: Array<{
    key: string;
    label: string;
    enabled: boolean;
  }>;
  overrides: {
    userLimitOverride: number | null;
    productLimitOverride: number | null;
    emailLimitOverride: number | null;
    apiAccessOverrideSupported: boolean;
    smtpAccessOverrideSupported: boolean;
  };
  plans: PlanOption[];
  support: {
    numericLimitOverrides: boolean;
    featureOverrides: boolean;
    internalNotes: boolean;
    connectedWebsiteFeature: boolean;
  };
};

type OverrideDraft = {
  userLimitOverride: string;
  productLimitOverride: string;
  emailLimitOverride: string;
};

type BusinessDetailResponse = {
  success?: boolean;
  business?: unknown;
  error?: string;
  message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBusinessDetail(value: unknown): value is BusinessDetail {
  if (!isRecord(value)) return false;

  return (
    isRecord(value.business) &&
    typeof value.business.name === "string" &&
    isRecord(value.plan) &&
    typeof value.plan.code === "string" &&
    isRecord(value.subscription) &&
    isRecord(value.usage) &&
    isRecord(value.overrides) &&
    Array.isArray(value.featureAccess) &&
    Array.isArray(value.plans)
  );
}

function responseError(payload: BusinessDetailResponse, fallback: string) {
  return payload.error || payload.message || fallback;
}

export default function PlatformBusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const businessId = params.id;
  const [detail, setDetail] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [planDraft, setPlanDraft] = useState("");
  const [overrideDraft, setOverrideDraft] = useState<OverrideDraft>({
    userLimitOverride: "",
    productLimitOverride: "",
    emailLimitOverride: "",
  });

  const applyDetail = useCallback((next: BusinessDetail) => {
    setDetail(next);
    setPlanDraft(next.plan.code);
    setOverrideDraft({
      userLimitOverride: formatOverrideInput(next.overrides.userLimitOverride),
      productLimitOverride: formatOverrideInput(next.overrides.productLimitOverride),
      emailLimitOverride: formatOverrideInput(next.overrides.emailLimitOverride),
    });
  }, []);

  const loadDetail = useCallback(() => {
    if (!businessId) {
      setDetail(null);
      setLoadError("Invalid business id");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    fetch(`/api/platform/businesses/${businessId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload: BusinessDetailResponse) => {
        if (!payload.success) {
          throw new Error(responseError(payload, "Failed to load business"));
        }

        if (!isBusinessDetail(payload.business)) {
          throw new Error("Invalid business detail response");
        }

        applyDetail(payload.business);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Connection error";
        setDetail(null);
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [applyDetail, businessId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const patchBusiness = async (body: Record<string, unknown>, savingKey: string, successMessage: string) => {
    setSaving(savingKey);
    try {
      const res = await fetch(`/api/platform/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as BusinessDetailResponse;
      if (!payload.success) throw new Error(responseError(payload, "Update failed"));
      if (!isBusinessDetail(payload.business)) throw new Error("Invalid business detail response");
      applyDetail(payload.business);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(null);
    }
  };

  const savePlan = () => {
    if (!planDraft) return;
    patchBusiness({ action: "plan", planName: planDraft }, "plan", "Plan updated");
  };

  const saveOverrides = () => {
    try {
      patchBusiness(
        {
          action: "overrides",
          overrides: {
            userLimitOverride: parseOverrideInput(overrideDraft.userLimitOverride),
            productLimitOverride: parseOverrideInput(overrideDraft.productLimitOverride),
            emailLimitOverride: parseOverrideInput(overrideDraft.emailLimitOverride),
          },
        },
        "overrides",
        "Overrides saved"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid override");
    }
  };

  const resetOverrides = () => {
    if (!window.confirm("Reset numeric limit overrides for this business?")) return;
    patchBusiness({ action: "reset-overrides" }, "reset-overrides", "Overrides reset");
  };

  const toggleStatus = () => {
    if (!detail) return;
    const isActive = !detail.business.isActive;
    patchBusiness(
      { action: "status", isActive },
      "status",
      isActive ? "Business reactivated" : "Business suspended"
    );
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <Loader2 className="animate-spin" size={28} color="var(--brand)" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div>
        <button type="button" style={backButtonStyle} onClick={() => router.push("/platform/businesses")}>
          <ArrowLeft size={16} />
          Businesses
        </button>
        <div style={emptyStyle}>{loadError || "Business not found"}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1180px" }}>
      <div style={headerStyle}>
        <div>
          <button type="button" style={backButtonStyle} onClick={() => router.push("/platform/businesses")}>
            <ArrowLeft size={16} />
            Businesses
          </button>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginTop: "12px" }}>
            {detail.business.name}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Platform control panel for tenant plan, limits, usage, and safe admin actions
          </p>
        </div>
        <StatusBadge active={detail.business.isActive} />
      </div>

      <section style={cardStyle}>
        <div style={sectionTitleStyle}>
          <Building2 size={16} />
          Business Overview
        </div>
        <div style={overviewGridStyle}>
          <InfoItem label="Business" value={detail.business.name} />
          <InfoItem label="Slug" value={detail.business.slug} mono />
          <InfoItem label="Owner Email" value={detail.business.ownerEmail} />
          <InfoItem label="Status" value={detail.business.isActive ? "Active" : "Suspended"} />
          <InfoItem label="Created" value={formatDate(detail.business.createdAt)} />
          <InfoItem label="Current Plan" value={detail.plan.label} />
          <InfoItem label="Users" value={`${formatCount(detail.usage.users.used)} / ${formatLimit(detail.usage.users.effectiveLimit)}`} />
          <InfoItem label="Products" value={`${formatCount(detail.usage.products.used)} / ${formatLimit(detail.usage.products.effectiveLimit)}`} />
          <InfoItem label="Emails This Month" value={`${formatCount(detail.usage.emails.used)} / ${formatLimit(detail.usage.emails.effectiveLimit)}`} />
        </div>
      </section>

      <div style={twoColumnStyle}>
        <section style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Zap size={16} />
            Subscription / Plan Control
          </div>
          <div style={{ display: "grid", gap: "14px" }}>
            <InfoItem label="Current Plan" value={`${detail.plan.label} (${detail.subscription.status})`} />
            <label style={labelStyle}>
              Change Plan
              <select value={planDraft} onChange={(e) => setPlanDraft(e.target.value)} style={inputStyle}>
                {detail.plans.map((plan) => (
                  <option key={plan.name} value={plan.name}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              style={primaryButtonStyle}
              disabled={saving === "plan" || planDraft === detail.plan.code}
              onClick={savePlan}
            >
              <Save size={14} />
              {saving === "plan" ? "Saving..." : "Save Plan Change"}
            </button>
            <div style={mutedTextStyle}>
              Payment automation is not connected in this foundation. This updates the subscription plan record only.
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={sectionTitleStyle}>
            <RotateCcw size={16} />
            Admin Actions
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            <button
              type="button"
              style={detail.business.isActive ? dangerButtonStyle : primaryButtonStyle}
              disabled={saving === "status"}
              onClick={toggleStatus}
            >
              {detail.business.isActive ? "Suspend Business" : "Reactivate Business"}
            </button>
            <label style={labelStyle}>
              Internal Note
              <textarea
                disabled
                placeholder="Internal note storage is not available in the current schema."
                style={{ ...inputStyle, minHeight: "78px", resize: "vertical" }}
              />
            </label>
            <button type="button" style={secondaryButtonStyle} disabled>
              Save Internal Note
            </button>
          </div>
        </section>
      </div>

      <section style={cardStyle}>
        <div style={sectionTitleStyle}>
          <Users size={16} />
          Limit Override Foundation
        </div>
        <div style={limitGridStyle}>
          <LimitControl
            icon={<Users size={15} />}
            label="User Limit Override"
            metric={detail.usage.users}
            value={overrideDraft.userLimitOverride}
            onChange={(value) => setOverrideDraft((draft) => ({ ...draft, userLimitOverride: value }))}
          />
          <LimitControl
            icon={<Package size={15} />}
            label="Product Limit Override"
            metric={detail.usage.products}
            value={overrideDraft.productLimitOverride}
            onChange={(value) => setOverrideDraft((draft) => ({ ...draft, productLimitOverride: value }))}
          />
          <LimitControl
            icon={<Mail size={15} />}
            label="Email Monthly Limit Override"
            metric={detail.usage.emails}
            value={overrideDraft.emailLimitOverride}
            onChange={(value) => setOverrideDraft((draft) => ({ ...draft, emailLimitOverride: value }))}
          />
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
          <button type="button" style={primaryButtonStyle} disabled={saving === "overrides"} onClick={saveOverrides}>
            <Save size={14} />
            {saving === "overrides" ? "Saving..." : "Save Overrides"}
          </button>
          <button type="button" style={secondaryButtonStyle} disabled={saving === "reset-overrides"} onClick={resetOverrides}>
            <RotateCcw size={14} />
            Reset Overrides
          </button>
        </div>
        <div style={placeholderGridStyle}>
          <PlaceholderToggle label="API Access Override" enabled={detail.usage.apiAccessEnabled} />
          <PlaceholderToggle label="SMTP Access Override" enabled={detail.usage.smtpAccessEnabled} />
        </div>
        <div style={mutedTextStyle}>
          API and SMTP access are currently plan-controlled because feature override storage is not present in the schema.
        </div>
      </section>

      <section style={cardStyle}>
        <div style={sectionTitleStyle}>
          <CheckCircle2 size={16} />
          Feature Access Overview
        </div>
        <div style={featureGridStyle}>
          {detail.featureAccess.map((feature) => (
            <div key={feature.key} style={featureRowStyle}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{feature.label}</span>
              {feature.enabled ? (
                <span style={{ ...featurePillStyle, color: "#16a34a", backgroundColor: "#dcfce7" }}>
                  <CheckCircle2 size={13} />
                  Enabled
                </span>
              ) : (
                <span style={{ ...featurePillStyle, color: "#dc2626", backgroundColor: "#fee2e2" }}>
                  <XCircle size={13} />
                  Disabled
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", color: "var(--text-primary)", marginTop: "4px", fontFamily: mono ? "monospace" : undefined }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 700,
      color: active ? "#16a34a" : "#dc2626",
      backgroundColor: active ? "#dcfce7" : "#fee2e2",
    }}>
      {active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {active ? "Active" : "Suspended"}
    </span>
  );
}

function LimitControl({
  icon,
  label,
  metric,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  metric: LimitMetric;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={limitControlStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)", fontWeight: 600, fontSize: "13px" }}>
        <span style={{ color: "var(--brand)", display: "inline-flex" }}>{icon}</span>
        {label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "10px" }}>
        <MiniMetric label="Used" value={formatCount(metric.used)} />
        <MiniMetric label="Plan" value={formatLimit(metric.planLimit)} />
        <MiniMetric label="Effective" value={formatLimit(metric.effectiveLimit)} />
      </div>
      <label style={{ ...labelStyle, marginTop: "10px" }}>
        Override
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Blank = plan limit, -1 = unlimited"
          style={inputStyle}
        />
      </label>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ backgroundColor: "var(--page-bg)", borderRadius: "8px", padding: "8px" }}>
      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "3px" }}>{value}</div>
    </div>
  );
}

function PlaceholderToggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div style={placeholderStyle}>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Plan controlled</div>
      </div>
      <span style={{ fontSize: "12px", color: enabled ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

function parseOverrideInput(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < -1) {
    throw new Error("Overrides must be whole numbers greater than or equal to -1");
  }
  return parsed;
}

function formatOverrideInput(value: number | null) {
  return value === null ? "" : String(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function formatLimit(value: number) {
  return value === -1 ? "Unlimited" : formatCount(value);
}

const loadingStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "260px",
};

const emptyStyle: React.CSSProperties = {
  padding: "40px",
  textAlign: "center",
  color: "var(--text-muted)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "20px",
};

const backButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  border: "none",
  backgroundColor: "transparent",
  color: "var(--text-secondary)",
  cursor: "pointer",
  fontSize: "13px",
  padding: 0,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "16px",
};

const sectionTitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "var(--text-primary)",
  fontSize: "15px",
  fontWeight: 700,
  marginBottom: "16px",
};

const overviewGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
};

const twoColumnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "16px",
};

const limitGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "12px",
};

const limitControlStyle: React.CSSProperties = {
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  padding: "12px",
  backgroundColor: "var(--input-bg)",
};

const placeholderGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const placeholderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  padding: "12px",
  backgroundColor: "var(--input-bg)",
};

const featureGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "10px",
};

const featureRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 12px",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  backgroundColor: "var(--input-bg)",
};

const featurePillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
  color: "var(--text-secondary)",
  fontSize: "12px",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  padding: "10px 12px",
  fontSize: "13px",
  outline: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "var(--brand)",
  color: "var(--brand-text)",
  padding: "10px 14px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  padding: "10px 14px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  color: "#dc2626",
  borderColor: "#fecaca",
  backgroundColor: "#fff1f2",
};

const mutedTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--text-muted)",
  lineHeight: 1.5,
};
