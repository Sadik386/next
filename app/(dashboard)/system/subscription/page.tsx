"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  GitBranch,
  List,
  Mail,
  MessageSquare,
  Package,
  Palette,
  Send,
  Users,
  Webhook,
  Workflow,
  X,
  XCircle,
  Zap,
  FileText,
} from "lucide-react";
import {
  FEATURE_KEYS,
  getPlanBadge,
  getPlanDescription,
  getPlanEmailLimit,
  getPlanPriceMonthly,
  getPlanPriceYearly,
  getPlanProductLimit,
  getPlanUserLimit,
  getPlanPdfPrintLimit,
  isUnlimited,
  PLAN_DISPLAY_ORDER,
  PLAN_PRICES_BDT,
  type PlanCode,
} from "@/lib/pricing";
import type { FeatureKey, LegacyPlanCode } from "@/lib/pricing";
import { useSettings } from "@/contexts/SettingsContext";

type DashboardPlanCode = PlanCode | LegacyPlanCode;

interface UsageLimit {
  used: number;
  limit: number;
}

interface SubscriptionData {
  plan: {
    code: LegacyPlanCode | PlanCode;
    label: string;
    description: string;
    badge: string;
    status: string;
    billingCycle: string;
    priceMonthly: number;
    priceYearly: number;
    isActive: boolean;
    isTrial: boolean;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    users: UsageLimit;
    products: UsageLimit;
    emails: UsageLimit & { isUnlimited: boolean };
    pdfPrint: UsageLimit & { isUnlimited: boolean };
    apiAccessEnabled: boolean;
    smtpAccessEnabled: boolean;
  };
  features: Record<string, boolean>;
  usageLimits: Record<string, number>;
}

const STATUS_LABELS: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  paused: "Paused",
  canceled: "Canceled",
  expired: "Expired",
};

const STATUS_COLORS: Record<string, string> = {
  trialing: "#f59e0b",
  active: "#22c55e",
  paused: "#6b7280",
  canceled: "#ef4444",
  expired: "#dc2626",
};

const FEATURE_DEFINITIONS: Array<{
  key: FeatureKey;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  { key: FEATURE_KEYS.API_ACCESS, label: "API", icon: Zap, description: "External API access" },
  { key: FEATURE_KEYS.WEBHOOKS, label: "Webhooks", icon: Webhook, description: "Webhook integrations" },
  { key: FEATURE_KEYS.CUSTOM_SMTP, label: "Custom SMTP", icon: Mail, description: "Business SMTP access" },
  { key: FEATURE_KEYS.MULTI_BRANCH, label: "Multi-Branch", icon: GitBranch, description: "Multiple branch support" },
  { key: FEATURE_KEYS.WHITE_LABEL, label: "White Label", icon: Palette, description: "Custom branding support" },
  { key: FEATURE_KEYS.AUTOMATION, label: "Automation", icon: Workflow, description: "Workflow automation" },
  { key: FEATURE_KEYS.ADVANCED_REPORTS, label: "Advanced Reports", icon: BarChart3, description: "Expanded analytics" },
  { key: FEATURE_KEYS.CUSTOM_FIELDS, label: "Custom Fields", icon: List, description: "Custom data fields" },
];

const UPGRADE_PLAN_CODES: PlanCode[] = ['starter', 'growth', 'custom'];

const CONTACT_REASONS = [
  "Plan consultation",
  "Usage limit discussion",
  "Billing question",
  "Custom pricing",
  "Managed plan support",
  "Technical support",
];

export default function SubscriptionPage() {
  const { settings } = useSettings();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscription", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load");
        return response.json();
      })
      .then((payload) => {
        setData(payload.data);
        setError(null);
      })
      .catch(() => setError("Unable to load subscription data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "40px 0", textAlign: "center" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "40px 0", textAlign: "center" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>{error ?? "No data"}</div>
      </div>
    );
  }

  const isCustom = data.plan.code === "custom";
  const businessName = settings.businessName?.trim() || "Current business";

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Subscription & Billing
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
          Manage your plan, usage limits, and billing preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <div className="lg:col-span-1 xl:col-span-8">
          <CurrentPlanCard plan={data.plan} isCustom={isCustom} />
          <UsageSection data={data} />
          <FeatureAccessSection features={data.features} />
        </div>

        <div className="lg:col-span-1 xl:col-span-4">
          <UpgradeActions plan={data.plan} businessName={businessName} isCustom={isCustom} />
          <PlanOverview data={data} isCustom={isCustom} />
        </div>
      </div>
    </div>
  );
}

function CurrentPlanCard({
  plan,
  isCustom,
}: {
  plan: SubscriptionData["plan"];
  isCustom: boolean;
}) {
  const statusColor = plan.isActive ? STATUS_COLORS[plan.status] ?? "#6b7280" : "#ef4444";
  const statusLabel = plan.isActive ? STATUS_LABELS[plan.status] ?? plan.status : "Inactive";
  const isYearly = plan.billingCycle === "yearly";
  const price = isYearly ? plan.priceYearly : plan.priceMonthly;
  const period = isYearly ? "/year" : "/month";

  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>{plan.label}</h2>
            {plan.badge && (
              <span style={badgeStyle}>
                {plan.badge}
              </span>
            )}
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
            {plan.description}
          </p>
        </div>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: 600,
          backgroundColor: `${statusColor}18`,
          color: statusColor,
          border: `1px solid ${statusColor}40`,
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "999px", backgroundColor: statusColor }} />
          {statusLabel}
        </span>
      </div>

      <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "var(--input-bg)", borderRadius: "10px" }}>
        {isCustom ? (
          <div>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>Managed Plan</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>Flexible custom terms</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Pricing, limits, and support are managed for this business.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>
                {price === 0 ? "Free" : `৳${formatAmount(price)}`}
              </span>
              {price > 0 && (
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{period}</span>
              )}
            </div>
            {plan.priceMonthly > 0 && plan.priceYearly > 0 && (
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                ৳{formatAmount(plan.priceMonthly)}/month or ৳{formatAmount(plan.priceYearly)}/year
              </div>
            )}
          </div>
        )}
        {plan.currentPeriodEnd && !isCustom && (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
            {plan.cancelAtPeriodEnd ? "Ends on " : "Next billing on "}
            {formatDate(plan.currentPeriodEnd)}
          </div>
        )}
        {plan.cancelAtPeriodEnd && (
          <div style={{ marginTop: "6px", fontSize: "12px", color: "#f59e0b" }}>
            Canceling at period end
          </div>
        )}
      </div>
    </section>
  );
}

function UsageSection({ data }: { data: SubscriptionData }) {
  const userPercent = getUsagePercent(data.usage.users.used, data.usage.users.limit);
  const productPercent = getUsagePercent(data.usage.products.used, data.usage.products.limit);
  const emailPercent = data.usage.emails.isUnlimited
    ? 0
    : getUsagePercent(data.usage.emails.used, data.usage.emails.limit);
  const pdfPrintPercent = data.usage.pdfPrint.isUnlimited
    ? 0
    : getUsagePercent(data.usage.pdfPrint.used, data.usage.pdfPrint.limit);

  return (
    <section style={{ ...cardStyle, marginTop: "16px" }}>
      <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
        Usage & Limits
      </h2>
      <div style={{ display: "grid", gap: "16px" }}>
        <UsageMetric
          icon={<Users size={16} />}
          label="Team Members"
          used={data.usage.users.used}
          limit={data.usage.users.limit}
          percent={userPercent}
          description="Active users"
        />
        <UsageMetric
          icon={<Package size={16} />}
          label="Products"
          used={data.usage.products.used}
          limit={data.usage.products.limit}
          percent={productPercent}
          description="Total product capacity/history"
        />
        <UsageMetric
          icon={<Mail size={16} />}
          label="Emails This Month"
          used={data.usage.emails.used}
          limit={data.usage.emails.limit}
          percent={emailPercent}
          description="Monthly email quota"
        />
        <UsageMetric
          icon={<FileText size={16} />}
          label="PDF/Print This Month"
          used={data.usage.pdfPrint.used}
          limit={data.usage.pdfPrint.limit}
          percent={pdfPrintPercent}
          description="Monthly PDF/Print quota"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "16px" }}>
        <AccessStatus
          icon={<Zap size={15} />}
          label="API Access"
          enabled={data.usage.apiAccessEnabled}
        />
        <AccessStatus
          icon={<Mail size={15} />}
          label="SMTP Access"
          enabled={data.usage.smtpAccessEnabled}
        />
      </div>
    </section>
  );
}

function UsageMetric({
  icon,
  label,
  used,
  limit,
  percent,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  used: number;
  limit: number;
  percent: number;
  description?: string;
}) {
  const isUnlimitedVal = isUnlimited(limit);
  const isWarning = !isUnlimitedVal && percent >= 80;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        backgroundColor: "var(--input-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{label}</span>
          <span style={{ fontSize: "13px", color: isWarning ? "#f59e0b" : "var(--text-secondary)", whiteSpace: "nowrap" }}>
            {formatCount(used)}{isUnlimitedVal ? "" : ` / ${formatCount(limit)}`}
            {isUnlimitedVal && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}> (unlimited)</span>}
          </span>
        </div>
        {!isUnlimitedVal && (
          <div style={{
            height: "6px",
            borderRadius: "999px",
            backgroundColor: "var(--input-bg)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${percent}%`,
              borderRadius: "999px",
              backgroundColor: isWarning ? "#f59e0b" : "var(--brand)",
              transition: "width 0.3s ease",
            }} />
          </div>
        )}
        {description && (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{description}</div>
        )}
      </div>
    </div>
  );
}

function AccessStatus({
  icon,
  label,
  enabled,
}: {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      padding: "10px 12px",
      borderRadius: "8px",
      backgroundColor: "var(--input-bg)",
      border: "1px solid var(--card-border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        <span style={{ color: enabled ? "var(--brand)" : "var(--text-muted)", display: "inline-flex" }}>{icon}</span>
        <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{
        fontSize: "12px",
        fontWeight: 600,
        color: enabled ? "#16a34a" : "#dc2626",
      }}>
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

function FeatureAccessSection({ features }: { features: Record<string, boolean> }) {
  return (
    <section style={{ ...cardStyle, marginTop: "16px" }}>
      <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
        Feature Access
      </h2>
      <div style={{ display: "grid", gap: "8px" }}>
        {FEATURE_DEFINITIONS.map((feature) => {
          const isEnabled = !!features[feature.key];
          const Icon = feature.icon;

          return (
            <div
              key={feature.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: "var(--input-bg)",
                border: "1px solid var(--card-border)",
              }}
            >
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isEnabled ? "color-mix(in srgb, var(--brand) 12%, transparent)" : "transparent",
                color: isEnabled ? "var(--brand)" : "var(--text-muted)",
                flexShrink: 0,
              }}>
                <Icon size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                  {feature.label}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{feature.description}</div>
              </div>
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isEnabled ? "#dcfce7" : "#fee2e2",
                flexShrink: 0,
              }}>
                {isEnabled ? (
                  <CheckCircle2 size={14} color="#16a34a" />
                ) : (
                  <XCircle size={14} color="#dc2626" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UpgradeActions({
  plan,
  businessName,
  isCustom,
}: {
  plan: SubscriptionData["plan"];
  businessName: string;
  isCustom: boolean;
}) {
  const [activeModal, setActiveModal] = useState<"upgrade" | "contact" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [upgradeRequested, setUpgradeRequested] = useState(false);
  const [contactReason, setContactReason] = useState(CONTACT_REASONS[0]);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const planCode = plan.code as string;
  const hasUpgrade = planCode !== "custom";
  const nextPlans = getAvailableNextPlans(planCode as LegacyPlanCode | PlanCode);

  function openUpgradeModal() {
    setSelectedPlan(nextPlans[0]?.code ?? null);
    setUpgradeRequested(false);
    setSubmitError(null);
    setActiveModal("upgrade");
  }

  function openContactModal() {
    setContactReason(isCustom ? "Managed plan support" : CONTACT_REASONS[0]);
    setContactMessage("");
    setContactSubmitted(false);
    setSubmitError(null);
    setActiveModal("contact");
  }

  function closeModal() {
    setActiveModal(null);
  }

  async function submitUpgradeRequest() {
    if (!selectedPlan || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/subscription/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "upgrade",
          requestedPlan: selectedPlan,
          reason: "User requested upgrade from dashboard",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit request");
      }

      setUpgradeRequested(true);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitContactRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/subscription/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact_sales",
          reason: contactReason,
          message: contactMessage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit request");
      }

      setContactSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section style={{ ...cardStyle, marginTop: "16px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
          Plan Actions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {hasUpgrade && !isCustom && (
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={openUpgradeModal}
            >
              <ArrowUpRight size={14} />
              Upgrade Plan
            </button>
          )}
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={openContactModal}
          >
            <MessageSquare size={14} />
            {isCustom ? "Contact Support" : "Contact Sales"}
          </button>
        </div>
        {isCustom && (
          <div style={noticeStyle}>
            Managed plan limits can be adjusted by support.
          </div>
        )}
        {!hasUpgrade && !isCustom && (
          <div style={noticeStyle}>
            You are on the highest available plan.
          </div>
        )}
      </section>

      {activeModal === "upgrade" && (
        <ActionModal title="Request Upgrade" onClose={closeModal}>
          {upgradeRequested ? (
            <SuccessState
              title="Upgrade request submitted"
              message="Your request has been received. Our team will review it and contact you soon regarding the next steps."
            />
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              <SummaryRows
                rows={[
                  ["Current Plan", plan.label],
                  ["Billing Cycle", titleize(plan.billingCycle)],
                  ["Payment Status", "Manual billing follow-up"],
                ]}
              />

              <div>
                <div style={modalSectionTitleStyle}>Available Next Plans</div>
                {nextPlans.length > 0 ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {nextPlans.map((option) => (
                      <button
                        type="button"
                        key={option.code}
                        onClick={() => setSelectedPlan(option.code)}
                        style={{
                          ...planOptionStyle,
                          borderColor: selectedPlan === option.code ? "var(--brand)" : "var(--card-border)",
                          backgroundColor: selectedPlan === option.code ? "color-mix(in srgb, var(--brand) 8%, var(--card-bg))" : "var(--card-bg)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{option.label}</span>
                            {option.badge && <span style={smallBadgeStyle}>{option.badge}</span>}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                            {option.description}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                            {option.limits}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{option.price}</div>
                          {option.yearlyPrice && (
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{option.yearlyPrice}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={emptyModalStateStyle}>No self-service upgrade plans are available for this plan.</div>
                )}
              </div>

              {submitError && (
                <div style={{ fontSize: "12px", color: "#ef4444", padding: "8px", backgroundColor: "#fee2e2", borderRadius: "8px" }}>
                  {submitError}
                </div>
              )}

              <div style={modalNoticeStyle}>
                Your request will be sent to the platform administrators. They will review your account and contact you to finalize the upgrade.
              </div>

              <div style={modalActionsStyle}>
                <button type="button" style={secondaryActionButtonStyle} onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="button"
                  style={{ ...primaryActionButtonStyle, opacity: (selectedPlan && !submitting) ? 1 : 0.6 }}
                  onClick={submitUpgradeRequest}
                  disabled={!selectedPlan || submitting}
                >
                  {submitting ? "Submitting..." : <><Send size={14} /> Request Upgrade</>}
                </button>
              </div>
            </div>
          )}
        </ActionModal>
      )}

      {activeModal === "contact" && (
        <ActionModal title={isCustom ? "Contact Support" : "Contact Sales"} onClose={closeModal}>
          {contactSubmitted ? (
            <SuccessState
              title="Request submitted"
              message="Thank you for your message. Our team will get back to you shortly."
            />
          ) : (
            <form onSubmit={submitContactRequest} style={{ display: "grid", gap: "14px" }}>
              <ReadOnlyField label="Business Name" value={businessName} />
              <ReadOnlyField label="Current Plan" value={plan.label} />

              <label style={fieldLabelStyle}>
                Contact Reason
                <select
                  value={contactReason}
                  onChange={(event) => setContactReason(event.target.value)}
                  style={fieldControlStyle}
                  disabled={submitting}
                >
                  {CONTACT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </label>

              <label style={fieldLabelStyle}>
                Message
                <textarea
                  value={contactMessage}
                  onChange={(event) => setContactMessage(event.target.value)}
                  rows={5}
                  placeholder="Share what you need help with."
                  style={{ ...fieldControlStyle, resize: "vertical", lineHeight: 1.5 }}
                  required
                  disabled={submitting}
                />
              </label>

              {submitError && (
                <div style={{ fontSize: "12px", color: "#ef4444", padding: "8px", backgroundColor: "#fee2e2", borderRadius: "8px" }}>
                  {submitError}
                </div>
              )}

              <div style={modalNoticeStyle}>
                Our team will review your message and contact you at the email address associated with your account.
              </div>

              <div style={modalActionsStyle}>
                <button type="button" style={secondaryActionButtonStyle} onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" style={primaryActionButtonStyle} disabled={submitting}>
                  {submitting ? "Submitting..." : <><Send size={14} /> Submit</>}
                </button>
              </div>
            </form>
          )}
        </ActionModal>
      )}
    </>
  );
}

function PlanOverview({ data, isCustom }: { data: SubscriptionData; isCustom: boolean }) {
  const items = [
    `${formatLimit(data.usage.users.limit)} team members`,
    `${formatLimit(data.usage.products.limit)} products`,
    `${formatLimit(data.usage.emails.limit)} emails/month`,
    `${formatLimit(data.usage.pdfPrint.limit)} PDF/print/month`,
    data.usage.apiAccessEnabled ? "API access enabled" : "API access disabled",
  ];

  return (
    <section style={{ ...cardStyle, marginTop: "16px" }}>
      <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
        {isCustom ? "Managed Plan" : "Plan Includes"}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.map((item) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={14} color="var(--brand)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      style={modalBackdropStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="subscription-action-title" style={modalDialogStyle}>
        <div style={modalHeaderStyle}>
          <h2 id="subscription-action-title" style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>
            {title}
          </h2>
          <button type="button" style={iconButtonStyle} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SuccessState({ title, message }: { title: string; message: string }) {
  return (
    <div style={successStateStyle}>
      <div style={successIconStyle}>
        <CheckCircle2 size={22} />
      </div>
      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginTop: "12px" }}>{title}</h3>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginTop: "6px" }}>
        {message}
      </p>
    </div>
  );
}

function SummaryRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div style={summaryRowsStyle}>
      {rows.map(([label, value]) => (
        <div key={label} style={summaryRowStyle}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
          <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600, textAlign: "right" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      <input value={value} readOnly style={{ ...fieldControlStyle, color: "var(--text-secondary)" }} />
    </label>
  );
}

function getAvailableNextPlans(currentCode: LegacyPlanCode | PlanCode) {
  const planCode = currentCode as string;
  const allPlans = PLAN_DISPLAY_ORDER;
  const currentIndex = allPlans.indexOf(planCode as PlanCode);
  if (currentIndex === -1) {
    return UPGRADE_PLAN_CODES.map(code => ({
      code,
      label: formatPlanName(code),
      badge: getPlanBadge(code),
      description: (getPlanDescription as (code: any) => string)(code),
      price: PLAN_PRICES_BDT[code]?.monthly ? `৳${PLAN_PRICES_BDT[code].monthly}/mo` : "Custom pricing",
      yearlyPrice: PLAN_PRICES_BDT[code]?.yearly ? `৳${PLAN_PRICES_BDT[code].yearly}/year` : "",
      limits: `${formatLimit(getPlanUserLimit(code))} users, ${formatLimit(getPlanProductLimit(code))} products`,
    }));
  }
  return allPlans
    .slice(currentIndex + 1)
    .map((code) => ({
      code,
      label: formatPlanName(code),
      badge: getPlanBadge(code),
      description: (getPlanDescription as (code: any) => string)(code),
      price: PLAN_PRICES_BDT[code as PlanCode]?.monthly ? `৳${PLAN_PRICES_BDT[code as PlanCode].monthly}/mo` : "Custom pricing",
      yearlyPrice: PLAN_PRICES_BDT[code as PlanCode]?.yearly ? `৳${PLAN_PRICES_BDT[code as PlanCode].yearly}/year` : "",
      limits: `${formatLimit(getPlanUserLimit(code))} users, ${formatLimit(getPlanProductLimit(code))} products`,
    }));
}

function getPlanUpgradeRank(code: string): number {
  if (code === "free") return 0;
  if (code === "starter") return 1;
  if (code === "growth") return 2;
  if (code === "custom") return 3;
  if (code === "basic") return 0;
  if (code === "pro" || code === "professional") return 1;
  if (code === "business" || code === "enterprise") return 2;
  return -1;
}

function getUsagePercent(used: number, limit: number): number {
  if (isUnlimited(limit) || limit < 0) return 0;
  if (limit === 0) return used > 0 ? 100 : 0;
  return Math.min((used / limit) * 100, 100);
}

function formatAmount(value: number, currency: 'USD' | 'BDT' = 'BDT'): string {
  if (currency === 'BDT') {
    return value.toLocaleString('en-US');
  }
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function formatLimit(value: number): string {
  return isUnlimited(value) ? "Unlimited" : formatCount(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatPlanName(code: string): string {
  return code
    .split("_")
    .map((part) => titleize(part))
    .join(" ");
}

function titleize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  padding: "20px",
};

const badgeStyle: React.CSSProperties = {
  padding: "2px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 600,
  backgroundColor: "var(--brand)",
  color: "var(--brand-text)",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 16px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "var(--brand-text)",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 16px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  width: "100%",
};

const noticeStyle: React.CSSProperties = {
  marginTop: "12px",
  padding: "10px",
  borderRadius: "8px",
  backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)",
  fontSize: "12px",
  color: "var(--text-secondary)",
  textAlign: "center",
};

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  backgroundColor: "rgba(17, 19, 24, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const modalDialogStyle: React.CSSProperties = {
  width: "min(560px, 100%)",
  maxHeight: "calc(100vh - 40px)",
  overflowY: "auto",
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.18)",
  padding: "20px",
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "16px",
};

const iconButtonStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-secondary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const modalSectionTitleStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--text-primary)",
  marginBottom: "8px",
};

const planOptionStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  padding: "12px",
  cursor: "pointer",
  textAlign: "left",
};

const smallBadgeStyle: React.CSSProperties = {
  padding: "2px 7px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
  backgroundColor: "color-mix(in srgb, var(--brand) 12%, transparent)",
  color: "var(--brand)",
};

const modalNoticeStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  backgroundColor: "var(--input-bg)",
  border: "1px solid var(--card-border)",
  fontSize: "12px",
  color: "var(--text-secondary)",
  lineHeight: 1.5,
};

const modalActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryActionButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  width: "auto",
  minWidth: "150px",
};

const secondaryActionButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  width: "auto",
  minWidth: "96px",
};

const successStateStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "18px 8px 8px",
};

const successIconStyle: React.CSSProperties = {
  width: "46px",
  height: "46px",
  borderRadius: "999px",
  backgroundColor: "color-mix(in srgb, var(--brand) 12%, transparent)",
  color: "var(--brand)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const summaryRowsStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "8px",
  backgroundColor: "var(--input-bg)",
  border: "1px solid var(--card-border)",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
};

const fieldLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const fieldControlStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--input-border)",
  borderRadius: "8px",
  backgroundColor: "var(--input-bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontWeight: 400,
  padding: "10px 12px",
  outline: "none",
};

const emptyModalStateStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: "8px",
  backgroundColor: "var(--input-bg)",
  color: "var(--text-secondary)",
  fontSize: "13px",
};
