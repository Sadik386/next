"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Check,
  Info,
  Zap,
  Clock,
  X,
  Star,
  Users,
  Package,
  Mail,
  Globe,
  BarChart3,
  Workflow,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import {
  getPlanEmailLimit,
  getPlanDuration,
  getPlanBadge,
  PLAN_DISPLAY_ORDER,
  PLAN_EXTERNAL_API,
  safeJsonParse,
} from "@/lib/pricing";

type Plan = {
  id: number;
  name: string;
  label: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number;
  maxProducts: number;
  emailLimit: number;
  duration: string;
  badge: string;
  apiEnabled: boolean;
  features: string;
  isActive: boolean;
  isTrial: boolean;
};

type FeatureGroup = {
  group: string;
  icon: React.ReactNode;
  items: { label: string; enabled: boolean }[];
};

const FEATURE_LABELS: Record<string, string> = {
  customSmtp: "Custom SMTP",
  apiAccess: "External API",
  webhooks: "Webhooks",
  whiteLabel: "White Label",
  advancedReports: "Advanced Reports",
  multiBranch: "Multi-Branch",
  customFields: "Custom Fields",
  automation: "Automation",
  twoFactorAuth: "Two-Factor Auth",
  auditLog: "Audit Log",
};

const FEATURE_GROUPS: Record<string, { group: string; icon: React.ReactNode; keys: string[] }> = {
  core: {
    group: "Core",
    icon: <Package size={12} />,
    keys: ["twoFactorAuth", "auditLog"],
  },
  advanced: {
    group: "Advanced",
    icon: <BarChart3 size={12} />,
    keys: ["advancedReports", "customFields", "automation"],
  },
  integrations: {
    group: "Integrations",
    icon: <Globe size={12} />,
    keys: ["customSmtp", "apiAccess", "webhooks"],
  },
  enterprise: {
    group: "Enterprise",
    icon: <Building2 size={12} />,
    keys: ["multiBranch", "whiteLabel"],
  },
};

function buildFeatureGroups(features: Record<string, boolean>): FeatureGroup[] {
  return Object.entries(FEATURE_GROUPS).map(([, config]) => ({
    group: config.group,
    icon: config.icon,
    items: config.keys.map(key => ({
      label: FEATURE_LABELS[key] || key,
      enabled: !!features[key],
    })),
  })).filter(g => g.items.length > 0);
}

export default function PlatformPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/platform/plans")
      .then(res => res.json())
      .then(res => {
        if (res.success) setPlans(res.plans);
        else toast.error(res.error || "Failed to load plans");
      })
      .catch(() => toast.error("Connection error"))
      .finally(() => setLoading(false));
  }, []);

  const sortedPlans = [...plans].sort((a, b) => {
    const aIdx = PLAN_DISPLAY_ORDER.indexOf(a.name as any);
    const bIdx = PLAN_DISPLAY_ORDER.indexOf(b.name as any);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
        <Loader2 className="animate-spin" size={32} color="var(--brand)" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Subscription Plans</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Available plans, limits, and pricing for V1</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {sortedPlans.map((plan) => {
          const features = (safeJsonParse(plan.features) ?? {}) as Record<string, boolean>;
          const emailLimit = plan.emailLimit;
          const duration = plan.duration;
          const apiEnabled = plan.apiEnabled;
          const badge = plan.badge;
          const isPopular = plan.name === "pro";
          const isTrial = plan.name === "trial";
          const isFree = plan.name === "free";
          const isBusiness = plan.name === "business";
          const featureGroups = buildFeatureGroups(features);

          return (
            <div key={plan.id} style={{
              backgroundColor: "var(--card-bg)",
              border: `1px solid ${isPopular ? "var(--brand)" : "var(--card-border)"}`,
              borderRadius: "12px",
              padding: "0",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
              boxShadow: isPopular ? "0 4px 20px rgba(var(--brand-rgb, 196, 151, 58), 0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              {isPopular && (
                <div style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  backgroundColor: "var(--brand)",
                  color: "white",
                  borderRadius: "20px",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  <Star size={10} />
                  Popular
                </div>
              )}
              {badge && !isPopular && (
                <div style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  padding: "4px 10px",
                  backgroundColor: isTrial ? "#fef3c7" : isFree ? "#dcfce7" : "var(--brand-light)",
                  color: isTrial ? "#92400e" : isFree ? "#166534" : "var(--brand)",
                  borderRadius: "20px",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  {badge}
                </div>
              )}
              {!plan.isActive && (
                <div style={{
                  position: "absolute",
                  top: "12px",
                  right: "-24px",
                  backgroundColor: "var(--text-muted)",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 30px",
                  transform: "rotate(45deg)",
                  zIndex: 10,
                }}>INACTIVE</div>
              )}

              <div style={{ padding: "24px 20px 16px" }}>
                <div style={{ marginBottom: "12px", marginTop: isPopular || badge ? "20px" : "0" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: isPopular ? "var(--brand)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>
                    {plan.name}
                  </div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{plan.label}</h2>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>{plan.description}</p>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
                      ${Number(plan.priceMonthly).toFixed(0)}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>/mo</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {plan.priceYearly > 0 ? `$${Number(plan.priceYearly).toFixed(0)}/yr` : "Free"}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 10px", backgroundColor: "var(--page-bg)", borderRadius: "6px", marginBottom: "12px" }}>
                  {isTrial ? (
                    <Clock size={12} color="#d97706" />
                  ) : isFree ? (
                    <Zap size={12} color="#16a34a" />
                  ) : (
                    <Zap size={12} color="var(--brand)" />
                  )}
                  <span style={{ fontSize: "11px", fontWeight: 600, color: isTrial ? "#92400e" : isFree ? "#166534" : "var(--text-primary)" }}>
                    {duration}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Users size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{plan.maxUsers === -1 ? "Unlimited" : plan.maxUsers} user{plan.maxUsers !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Package size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{plan.maxProducts === -1 ? "Unlimited" : plan.maxProducts} products</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Mail size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{emailLimit.toLocaleString()}/mo</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Globe size={11} color={apiEnabled ? "#16a34a" : "var(--text-muted)"} />
                    <span style={{ fontSize: "11px", color: apiEnabled ? "#16a34a" : "var(--text-muted)" }}>
                      {apiEnabled ? "API enabled" : "API disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--card-border)", backgroundColor: "var(--page-bg)" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Features
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {featureGroups.map(group => (
                    <div key={group.group}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px", color: "var(--text-muted)" }}>
                        {group.icon}
                        <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{group.group}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", paddingLeft: "16px" }}>
                        {group.items.map(item => (
                          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            {item.enabled ? (
                              <Check size={11} color="#16a34a" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                            ) : (
                              <X size={11} color="#d1d5db" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                            )}
                            <span style={{ fontSize: "11px", color: item.enabled ? "var(--text-secondary)" : "var(--text-muted)" }}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: "8px",
        padding: "20px",
        backgroundColor: "var(--brand-light)",
        borderRadius: "12px",
        border: "1px solid var(--brand-border)",
        display: "flex",
        gap: "12px",
      }}>
        <Info size={20} color="var(--brand)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          <strong>Note:</strong> Subscription plans are read-only in V1. Pricing and limits are managed via database seed files. Email limits are enforced by plan quotas.
        </div>
      </div>
    </div>
  );
}