"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { PLAN_NAMES } from "@/lib/pricing";

type SubscriptionEffective = {
  isActive: boolean;
  isExpired: boolean;
  isEffectiveFree: boolean;
  effectivePlan: string;
  effectiveStatus: string;
  reason: string;
};

type SubscriptionPlan = {
  code: string;
  label: string;
  status: string;
  isTrial: boolean;
  currentPeriodEnd: string | null;
};

type SubscriptionResponse = {
  data?: {
    plan: SubscriptionPlan;
    effective: SubscriptionEffective;
  };
  error?: string;
};

interface CachedSubscriptionData {
  plan: SubscriptionPlan;
  effective: SubscriptionEffective;
}

export default function SubscriptionStatusBanner() {
  const [cache, setCache] = useState<CachedSubscriptionData | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchSubscription() {
      try {
        const res = await fetch("/api/subscription", { cache: "no-store" });
        const json: SubscriptionResponse = await res.json();
        if (!ignore && json.data) {
          setCache(json.data);
        }
      } catch {
        // Silently fail — banner just won't show
      }
    }

    fetchSubscription();
    return () => { ignore = true; };
  }, []);

  if (!cache) return null;

  const { plan, effective } = cache;

  if (effective.isActive) return null;

  if (plan.code === PLAN_NAMES.FREE) return null;

  return (
    <div style={bannerStyle}>
      <div style={bannerInnerStyle}>
        <div style={bannerLeftStyle}>
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
          <span style={bannerTextStyle}>
            Your subscription is not active. Your business is currently in read-only mode.{" "}
            {effective.reason ? `${effective.reason}. ` : ""}
            Renew your plan to continue creating or updating records.
          </span>
        </div>
        <Link
          href="/system/subscription"
          style={ctaStyle}
        >
          View Subscription
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}

const bannerStyle: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  borderBottom: "1px solid #fde68a",
  padding: "10px 16px",
  position: "sticky",
  top: 0,
  zIndex: 50,
};

const bannerInnerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  maxWidth: "1200px",
  margin: "0 auto",
  flexWrap: "wrap",
};

const bannerLeftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  flex: 1,
  minWidth: 0,
};

const bannerTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#78350f",
  lineHeight: 1.5,
};

const ctaStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "6px 12px",
  backgroundColor: "#d97706",
  color: "#fff",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 700,
  textDecoration: "none",
  whiteSpace: "nowrap",
  flexShrink: 0,
};
