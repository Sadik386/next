import { prisma } from "@/lib/prisma";
import { activeBusinessMemberStatusWhere } from "@/constants/business-member-status";
import {
  FEATURE_KEYS,
  PLAN_NAMES,
  SUBSCRIPTION_STATUS,
  USAGE_KEYS,
  getPlanBadge,
  getPlanDescription,
  getPlanEmailLimit,
  getPlanPriceMonthly,
  getPlanPriceYearly,
  getPlanProductLimit,
  getPlanUserLimit,
  getPlanPdfPrintLimit,
  isCurrentPlan,
  isFeatureEnabled,
  isUnlimited,
  normalizePlanCode,
  safeJsonParse,
  getPlanDisplayLabel,
  type FeatureKey,
  type LegacyPlanCode,
  type PlanCode,
} from "@/lib/pricing";
import { getAllCurrentUsage, getBusinessSubscription } from "@/lib/usage-service";
import { getEffectiveSubscriptionStatus } from "@/lib/subscription-guard";

const SUBSCRIPTION_FEATURE_KEYS = [
  FEATURE_KEYS.API_ACCESS,
  FEATURE_KEYS.WEBHOOKS,
  FEATURE_KEYS.CUSTOM_SMTP,
  FEATURE_KEYS.MULTI_BRANCH,
  FEATURE_KEYS.WHITE_LABEL,
  FEATURE_KEYS.AUTOMATION,
  FEATURE_KEYS.ADVANCED_REPORTS,
  FEATURE_KEYS.CUSTOM_FIELDS,
] as const;

type SubscriptionFeatureKey = (typeof SUBSCRIPTION_FEATURE_KEYS)[number];
type DashboardPlanCode = PlanCode | LegacyPlanCode;

type PlanRecord = {
  name: string;
  label: string;
  description: string | null;
  priceMonthly: unknown;
  priceYearly: unknown;
  maxUsers: number;
  maxProducts: number;
  features: string;
  usageLimits: string;
  isActive: boolean;
  isTrial: boolean;
};

export interface SubscriptionDashboardData {
  plan: {
    code: DashboardPlanCode;
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
    users: { used: number; limit: number };
    products: { used: number; limit: number };
    emails: { used: number; limit: number; isUnlimited: boolean };
    pdfPrint: { used: number; limit: number; isUnlimited: boolean };
    apiAccessEnabled: boolean;
    smtpAccessEnabled: boolean;
  };
  features: Record<SubscriptionFeatureKey, boolean>;
  usageLimits: Record<string, number>;
  effective: {
    isActive: boolean;
    isExpired: boolean;
    isEffectiveFree: boolean;
    effectivePlan: string;
    effectiveStatus: string;
    reason: string;
  };
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function getNormalizedLabel(code: string): string {
  return getPlanDisplayLabel(code);
}

function getPlanMonthlyPrice(code: DashboardPlanCode, plan: PlanRecord | null): number {
  const normalizedCode = normalizePlanCode(code);
  if (isCurrentPlan(normalizedCode)) return getPlanPriceMonthly(normalizedCode as PlanCode);
  return toNumber(plan?.priceMonthly, 0);
}

function getPlanYearlyPrice(code: DashboardPlanCode, plan: PlanRecord | null): number {
  const normalizedCode = normalizePlanCode(code);
  if (isCurrentPlan(normalizedCode)) return getPlanPriceYearly(normalizedCode as PlanCode);
  return toNumber(plan?.priceYearly, 0);
}

function getPlanFeatures(featuresRaw: unknown): Record<string, boolean> {
  return safeJsonParse<Record<string, boolean>>(featuresRaw, {}) ?? {};
}

function getDashboardFeatures(features: Record<string, boolean>) {
  const dashboardFeatures = {} as Record<SubscriptionFeatureKey, boolean>;

  for (const key of SUBSCRIPTION_FEATURE_KEYS) {
    dashboardFeatures[key] = isFeatureEnabled(features, key as FeatureKey);
  }

  return dashboardFeatures;
}

export async function getSubscriptionDashboardData(
  businessId: number
): Promise<SubscriptionDashboardData> {
  const [subscription, effStatus] = await Promise.all([
    getBusinessSubscription(businessId),
    getEffectiveSubscriptionStatus(businessId),
  ]);

  const fallbackPlan = subscription?.plan
    ? null
    : await prisma.subscriptionPlan.findUnique({ where: { name: PLAN_NAMES.FREE } });
  const plan = (subscription?.plan ?? fallbackPlan) as PlanRecord | null;

  const [usageRecords, userCount, productCount] = await Promise.all([
    getAllCurrentUsage(businessId),
    prisma.businessMember.count({
      where: { businessId, status: activeBusinessMemberStatusWhere() },
    }),
    prisma.product.count({ where: { businessId } }),
  ]);

  const assignedPlanCode = normalizePlanCode(plan?.name ?? PLAN_NAMES.FREE);
  const effectivePlanCode = normalizePlanCode(effStatus.effectivePlan);

  const rawFeatures = effStatus.isActive
    ? getPlanFeatures(plan?.features)
    : getPlanFeatures(fallbackPlan?.features ?? null);
  const features = getDashboardFeatures(rawFeatures);
  const usageLimits = effStatus.isActive
    ? safeJsonParse<Record<string, number>>(plan?.usageLimits, {}) ?? {}
    : safeJsonParse<Record<string, number>>(fallbackPlan?.usageLimits ?? "{}", {}) ?? {};

  const userLimit = effStatus.isActive
    ? (plan?.maxUsers ?? getPlanUserLimit(effectivePlanCode))
    : getPlanUserLimit(effectivePlanCode);
  const productLimit = effStatus.isActive
    ? (plan?.maxProducts ?? getPlanProductLimit(effectivePlanCode))
    : getPlanProductLimit(effectivePlanCode);
  const emailLimit = getPlanEmailLimit(effectivePlanCode);
  const pdfPrintLimit = getPlanPdfPrintLimit(effectivePlanCode);
  const emailUsage =
    usageRecords.find((record) => record.key === USAGE_KEYS.EMAILS_SENT)?.value ?? 0;
  const pdfPrintUsage =
    usageRecords.find((record) => record.key === USAGE_KEYS.PDF_PRINT_COUNT)?.value ?? 0;

  const planDescription = isCurrentPlan(assignedPlanCode)
    ? getPlanDescription(assignedPlanCode as PlanCode)
    : plan?.description || "";

  const apiAccessEnabled = effStatus.isActive
    ? (features[FEATURE_KEYS.API_ACCESS] ?? false)
    : false;
  const smtpAccessEnabled = effStatus.isActive
    ? (features[FEATURE_KEYS.CUSTOM_SMTP] ?? false)
    : false;

  return {
    plan: {
      code: assignedPlanCode,
      label: getNormalizedLabel(assignedPlanCode),
      description: planDescription,
      badge: getPlanBadge(assignedPlanCode),
      status: subscription?.status ?? SUBSCRIPTION_STATUS.ACTIVE,
      billingCycle: subscription?.billingCycle ?? "monthly",
      priceMonthly: getPlanMonthlyPrice(assignedPlanCode, plan),
      priceYearly: getPlanYearlyPrice(assignedPlanCode, plan),
      isActive: plan?.isActive ?? true,
      isTrial: plan?.isTrial ?? false,
      currentPeriodStart: toIso(subscription?.currentPeriodStart),
      currentPeriodEnd: toIso(subscription?.currentPeriodEnd),
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    },
    usage: {
      users: { used: userCount, limit: userLimit },
      products: { used: productCount, limit: productLimit },
      emails: {
        used: emailUsage,
        limit: emailLimit,
        isUnlimited: isUnlimited(emailLimit),
      },
      pdfPrint: {
        used: pdfPrintUsage,
        limit: pdfPrintLimit,
        isUnlimited: isUnlimited(pdfPrintLimit),
      },
      apiAccessEnabled,
      smtpAccessEnabled,
    },
    features,
    usageLimits,
    effective: {
      isActive: effStatus.isActive,
      isExpired: effStatus.isExpired,
      isEffectiveFree: !effStatus.isActive,
      effectivePlan: effStatus.effectivePlan,
      effectiveStatus: effStatus.rawStatus,
      reason: effStatus.reason,
    },
  };
}
