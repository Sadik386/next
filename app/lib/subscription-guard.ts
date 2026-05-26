import { prisma } from "./prisma";
import { activeBusinessMemberStatusWhere } from "@/constants/business-member-status";
import {
  FEATURE_KEYS,
  PLAN_NAMES,
  SUBSCRIPTION_STATUS,
  USAGE_KEYS,
  getPlanEmailLimit,
  getPlanUserLimit,
  getPlanProductLimit,
  getPlanPdfPrintLimit,
  normalizePlanCode,
  isUnlimited,
} from "./pricing";
import { getBusinessSubscription } from "./usage-service";
import { safeJsonParse } from "./pricing";

/**
 * PDF usage deduplication cache.
 * Tracks which documents have already counted against quota per business per day.
 * Key format: businessId:docType:docId → "YYYY-MM-DD"
 * Entries auto-expire via TTL check.
 */
const pdfUsageCache = new Map<string, { date: string; timestamp: number }>();
const PDF_CACHE_TTL_MS = 86_400_000; // 24 hours

function getDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function buildPdfCacheKey(businessId: number, docType: string, docId: string): string {
  return `${businessId}:${docType}:${docId}`;
}

function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of pdfUsageCache.entries()) {
    if (now - entry.timestamp > PDF_CACHE_TTL_MS) {
      pdfUsageCache.delete(key);
    }
  }
}

function isPdfUsageAlreadyCounted(businessId: number, docType: string, docId: string): boolean {
  const key = buildPdfCacheKey(businessId, docType, docId);
  const entry = pdfUsageCache.get(key);
  if (!entry) return false;
  if (entry.date !== getDateKey()) {
    pdfUsageCache.delete(key);
    return false;
  }
  return true;
}

function markPdfUsageCounted(businessId: number, docType: string, docId: string): void {
  const key = buildPdfCacheKey(businessId, docType, docId);
  pdfUsageCache.set(key, { date: getDateKey(), timestamp: Date.now() });
  if (pdfUsageCache.size > 50_000) cleanExpiredCache();
}

export type PdfDocType = "invoice" | "receipt" | "expense" | "delivery";

/**
 * Check if this PDF access should count against quota.
 * Returns { counted: true } if this is a fresh document access (count it).
 * Returns { counted: false } if already counted today (skip counting).
 */
export function checkPdfUsageCount(
  businessId: number,
  docType: PdfDocType,
  docId: string
): { counted: boolean } {
  cleanExpiredCache();
  if (isPdfUsageAlreadyCounted(businessId, docType, docId)) {
    return { counted: false };
  }
  markPdfUsageCounted(businessId, docType, docId);
  return { counted: true };
}

/**
 * Get current period boundaries
 */
function getCurrentPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export interface SubscriptionGuardResult {
  allowed: boolean;
  reason?: string;
  code?: string;
}

export class SubscriptionGuardError extends Error {
  status = 403;

  constructor(message: string, public code?: string) {
    super(message);
    this.name = "SubscriptionGuardError";
  }
}

export type SubscriptionStatusResult = {
  rawStatus: string;
  isExpired: boolean;
  isActive: boolean;
  effectivePlan: string;
  reason: string;
};

export async function getEffectiveSubscriptionStatus(
  businessId: number
): Promise<SubscriptionStatusResult> {
  const subscription = await getBusinessSubscription(businessId);
  const now = new Date();

  if (!subscription) {
    return {
      rawStatus: "none",
      isExpired: false,
      isActive: false,
      effectivePlan: PLAN_NAMES.FREE,
      reason: "No subscription — Free plan",
    };
  }

  const isPeriodExpired =
    subscription.currentPeriodEnd instanceof Date &&
    subscription.currentPeriodEnd < now;

  const isEffectiveActive =
    (subscription.status === SUBSCRIPTION_STATUS.ACTIVE ||
      subscription.status === SUBSCRIPTION_STATUS.TRIALING) &&
    !isPeriodExpired;

  if (!isEffectiveActive) {
    let reason: string;
    if (subscription.status === SUBSCRIPTION_STATUS.TRIALING && isPeriodExpired) {
      reason = "Trial period expired";
    } else if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE && isPeriodExpired) {
      reason = "Subscription period expired";
    } else if (subscription.status === SUBSCRIPTION_STATUS.EXPIRED) {
      reason = "Subscription expired";
    } else if (subscription.status === SUBSCRIPTION_STATUS.CANCELED) {
      reason = "Subscription canceled";
    } else if (subscription.status === SUBSCRIPTION_STATUS.PAUSED) {
      reason = "Subscription paused";
    } else {
      reason = `Subscription status: ${subscription.status}`;
    }
    return {
      rawStatus: subscription.status,
      isExpired: isPeriodExpired,
      isActive: false,
      effectivePlan: PLAN_NAMES.FREE,
      reason,
    };
  }

  return {
    rawStatus: subscription.status,
    isExpired: false,
    isActive: true,
    effectivePlan: subscription.plan.name,
    reason: "Subscription active",
  };
}

export async function isEffectivePlanActive(businessId: number): Promise<boolean> {
  const status = await getEffectiveSubscriptionStatus(businessId);
  return status.isActive;
}

const READ_ONLY_MESSAGE = "Your subscription is not active. Please renew or update your plan to continue.";
const READ_ONLY_CODE = "SUBSCRIPTION_READ_ONLY";

/**
 * Guard that blocks core transactional writes when subscription is not effectively active.
 *
 * Rule:
 * - No subscription record → Free/lifetime user → ALLOW
 * - Subscription exists AND is effectively active (ACTIVE/TRIALING + period not expired) → ALLOW
 * - Subscription exists AND is NOT effectively active (expired/canceled/paused/period ended) → BLOCK
 *
 * This ensures Free plan lifetime users are never blocked, only paid subscribers
 * whose subscription has lapsed are restricted.
 */
export async function guardReadOnlyWrite(businessId: number): Promise<void> {
  const subscription = await getBusinessSubscription(businessId);

  if (!subscription) {
    return;
  }

  const effStatus = await getEffectiveSubscriptionStatus(businessId);
  if (!effStatus.isActive) {
    throw new SubscriptionGuardError(READ_ONLY_MESSAGE, READ_ONLY_CODE);
  }
}

interface CheckLimitOptions {
  businessId: number;
  usageKey: string;
}

/**
 * Check if subscription is active and not expired.
 * Uses effective status: ACTIVE/TRIALING must also have currentPeriodEnd >= now.
 */
export async function isSubscriptionActive(businessId: number): Promise<boolean> {
  return isEffectivePlanActive(businessId);
}

/**
 * Check if trial is still valid (not expired)
 */
export async function isTrialValid(businessId: number): Promise<boolean> {
  const subscription = await getBusinessSubscription(businessId);
  if (!subscription) return false;
  
  if (subscription.status !== SUBSCRIPTION_STATUS.TRIALING) {
    return false;
  }
  
  const now = new Date();
  return subscription.currentPeriodEnd > now;
}

/**
 * Check if subscription is expired (specifically trial expired)
 */
export async function isTrialExpired(businessId: number): Promise<boolean> {
  const subscription = await getBusinessSubscription(businessId);
  if (!subscription) return false;
  
  if (subscription.status !== SUBSCRIPTION_STATUS.TRIALING) {
    return false;
  }
  
  const now = new Date();
  return subscription.currentPeriodEnd <= now;
}

/**
 * Check if business has access to a specific feature.
 * Uses effective status to determine the applicable plan.
 */
export async function hasFeatureAccess(businessId: number, featureKey: string): Promise<boolean> {
  const effStatus = await getEffectiveSubscriptionStatus(businessId);
  if (!effStatus.isActive) return false;

  const subscription = await getBusinessSubscription(businessId);
  if (!subscription) return false;

  const planFeatures = safeJsonParse<Record<string, boolean>>(subscription.plan.features, {}) ?? {};
  return planFeatures[featureKey] ?? false;
}

/**
 * Check if business has exceeded a usage limit.
 * Uses effective status: ACTIVE/TRIALING must also have currentPeriodEnd >= now.
 * Falls back to Free plan limits when subscription is not effective.
 */
export async function checkLimitExceeded(options: CheckLimitOptions): Promise<{ exceeded: boolean; current: number; limit: number }> {
  const { businessId, usageKey } = options;

  const effStatus = await getEffectiveSubscriptionStatus(businessId);
  const currentUsage = await getCurrentUsage(businessId, usageKey);

  if (!effStatus.isActive) {
    const defaultLimit = getDefaultLimit(usageKey);
    return {
      exceeded: currentUsage >= defaultLimit && defaultLimit !== -1,
      current: currentUsage,
      limit: defaultLimit,
    };
  }

  const subscription = await getBusinessSubscription(businessId);
  if (!subscription) {
    const defaultLimit = getDefaultLimit(usageKey);
    return {
      exceeded: currentUsage >= defaultLimit && defaultLimit !== -1,
      current: currentUsage,
      limit: defaultLimit,
    };
  }

  const planLimits = safeJsonParse<Record<string, number>>(subscription.plan.usageLimits, {}) ?? {};
  const planLimit = planLimits[usageKey] ?? getDefaultLimit(usageKey);

  return {
    exceeded: currentUsage >= planLimit && planLimit !== -1,
    current: currentUsage,
    limit: planLimit,
  };
}

/**
 * Get default limit for a usage key (free plan equivalent)
 */
function getDefaultLimit(usageKey: string): number {
  const defaults: Record<string, number> = {
    [USAGE_KEYS.ORDERS_CREATED]: 10,
    [USAGE_KEYS.SALES_CREATED]: 20,
    [USAGE_KEYS.PRODUCTS_CREATED]: -1,
    [USAGE_KEYS.USERS_CREATED]: -1,
    [USAGE_KEYS.CUSTOMERS_CREATED]: 10,
    [USAGE_KEYS.SUPPLIERS_CREATED]: 5,
    [USAGE_KEYS.EXPENSES_CREATED]: 5,
    [USAGE_KEYS.INVOICES_CREATED]: 5,
    [USAGE_KEYS.POS_SESSIONS]: -1,
    [USAGE_KEYS.API_CALLS]: 50,
    [USAGE_KEYS.API_KEYS_CREATED]: -1,
    [USAGE_KEYS.EMAILS_SENT]: 100,
    [USAGE_KEYS.STORAGE_MB]: 50,
  };
  return defaults[usageKey] ?? -1;
}

/**
 * Get current usage for a key
 */
async function getCurrentUsage(businessId: number, usageKey: string): Promise<number> {
  const usage = await prisma.usage.findFirst({
    where: {
      businessId,
      key: usageKey,
      periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59),
    },
  });
  
  return usage?.value ?? 0;
}

/**
 * Increment usage for a specific key
 */
export async function incrementUsage(
  businessId: number,
  usageKey: string,
  amount: number = 1
): Promise<number> {
  const { start, end } = getCurrentPeriod();

  const existing = await prisma.usage.findFirst({
    where: {
      businessId,
      key: usageKey,
      periodStart: start,
      periodEnd: end,
    },
  });

  if (existing) {
    const updated = await prisma.usage.update({
      where: { id: existing.id },
      data: { value: existing.value + amount },
    });
    return updated.value;
  }

  const created = await prisma.usage.create({
    data: {
      businessId,
      key: usageKey,
      value: amount,
      periodStart: start,
      periodEnd: end,
    },
  });

  return created.value;
}

/**
 * Increment usage without failing an already-successful business action.
 */
export async function incrementUsageSafely(
  businessId: number,
  usageKey: string,
  amount: number = 1
): Promise<number | null> {
  try {
    return await incrementUsage(businessId, usageKey, amount);
  } catch (error) {
    console.error("Usage increment failed:", { businessId, usageKey, amount, error });
    return null;
  }
}

/**
 * Guard for product creation - checks product limit and effective subscription status.
 * Uses effective status: ACTIVE/TRIALING must also have currentPeriodEnd >= now.
 */
export async function guardProductCreation(businessId: number): Promise<SubscriptionGuardResult> {
  const effStatus = await getEffectiveSubscriptionStatus(businessId);

  if (effStatus.rawStatus === SUBSCRIPTION_STATUS.TRIALING && effStatus.isExpired) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }

  let productLimit: number;
  if (effStatus.isActive) {
    const subscription = await getBusinessSubscription(businessId);
    productLimit = subscription?.plan.maxProducts ?? getPlanProductLimit(normalizePlanCode(effStatus.effectivePlan));
  } else {
    productLimit = getPlanProductLimit(PLAN_NAMES.FREE);
  }

  const currentProductCount = await prisma.product.count({
    where: {
      businessId,
      deletedAt: null,
    }
  });

  if (productLimit !== -1 && currentProductCount >= productLimit) {
    return {
      allowed: false,
      reason: `Product limit reached for your current plan.`,
      code: "PRODUCT_LIMIT_EXCEEDED"
    };
  }

  return { allowed: true };
}

/**
 * Guard for user creation - checks user/team limit and effective subscription status.
 * Uses effective status: ACTIVE/TRIALING must also have currentPeriodEnd >= now.
 */
export async function guardUserCreation(businessId: number): Promise<SubscriptionGuardResult> {
  const effStatus = await getEffectiveSubscriptionStatus(businessId);

  if (effStatus.rawStatus === SUBSCRIPTION_STATUS.TRIALING && effStatus.isExpired) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }

  let userLimit: number;
  if (effStatus.isActive) {
    const subscription = await getBusinessSubscription(businessId);
    userLimit = subscription?.plan.maxUsers ?? getPlanUserLimit(normalizePlanCode(effStatus.effectivePlan));
  } else {
    userLimit = getPlanUserLimit(PLAN_NAMES.FREE);
  }

  const currentUserCount = await prisma.businessMember.count({
    where: {
      businessId,
      status: activeBusinessMemberStatusWhere()
    }
  });

  if (userLimit !== -1 && currentUserCount >= userLimit) {
    return {
      allowed: false,
      reason: `User limit reached for your current plan.`,
      code: "USER_LIMIT_EXCEEDED"
    };
  }

  return { allowed: true };
}

/**
 * Guard for API key creation - checks API access feature and effective subscription status.
 * Uses effective status: ACTIVE/TRIALING must also have currentPeriodEnd >= now.
 */
export async function guardApiKeyCreation(businessId: number): Promise<SubscriptionGuardResult> {
  const effStatus = await getEffectiveSubscriptionStatus(businessId);

  if (effStatus.rawStatus === SUBSCRIPTION_STATUS.TRIALING && effStatus.isExpired) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }

  const hasApiAccess = await hasFeatureAccess(businessId, FEATURE_KEYS.API_ACCESS);

  if (!hasApiAccess) {
    return {
      allowed: false,
      reason: `API access is not available on your current plan.`,
      code: "API_ACCESS_DENIED"
    };
  }

  return { allowed: true };
}

/**
 * Guard for email sending - checks email quota and effective subscription status.
 * Uses effective status: ACTIVE/TRIALING must also have currentPeriodEnd >= now.
 */
export async function guardEmailSend(businessId: number): Promise<SubscriptionGuardResult> {
  const effStatus = await getEffectiveSubscriptionStatus(businessId);

  if (effStatus.rawStatus === SUBSCRIPTION_STATUS.TRIALING && effStatus.isExpired) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }

  let emailLimit: number;
  if (effStatus.isActive) {
    emailLimit = getPlanEmailLimit(normalizePlanCode(effStatus.effectivePlan));
  } else {
    emailLimit = getPlanEmailLimit(PLAN_NAMES.FREE);
  }

  const emailUsage = await getCurrentUsage(businessId, USAGE_KEYS.EMAILS_SENT);

  if (emailLimit !== -1 && emailUsage >= emailLimit) {
    return {
      allowed: false,
      reason: `Email quota exceeded for your current plan.`,
      code: "EMAIL_QUOTA_EXCEEDED"
    };
  }

  return { allowed: true };
}

/**
 * Guard for webhook creation - checks webhook feature access and effective subscription status.
 * Uses effective status: ACTIVE/TRIALING must also have currentPeriodEnd >= now.
 */
export async function guardWebhookCreation(businessId: number): Promise<SubscriptionGuardResult> {
  const effStatus = await getEffectiveSubscriptionStatus(businessId);

  if (effStatus.rawStatus === SUBSCRIPTION_STATUS.TRIALING && effStatus.isExpired) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }

  const hasWebhookAccess = await hasFeatureAccess(businessId, FEATURE_KEYS.WEBHOOKS);

  if (!hasWebhookAccess) {
    return {
      allowed: false,
      reason: `Webhooks are not available on your current plan.`,
      code: "WEBHOOK_ACCESS_DENIED"
    };
  }

  return { allowed: true };
}

/**
 * Guard for PDF/Print usage - checks PDF quota and effective subscription status.
 * Uses effective status: ACTIVE/TRIALING must also have currentPeriodEnd >= now.
 */
export async function guardPdfPrintUsage(businessId: number): Promise<SubscriptionGuardResult> {
  const effStatus = await getEffectiveSubscriptionStatus(businessId);

  if (effStatus.rawStatus === SUBSCRIPTION_STATUS.TRIALING && effStatus.isExpired) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }

  let pdfLimit: number;
  if (effStatus.isActive) {
    pdfLimit = getPlanPdfPrintLimit(normalizePlanCode(effStatus.effectivePlan));
  } else {
    pdfLimit = getPlanPdfPrintLimit(PLAN_NAMES.FREE);
  }

  if (pdfLimit === -1) {
    return { allowed: true };
  }

  const pdfUsage = await getCurrentUsage(businessId, USAGE_KEYS.PDF_PRINT_COUNT);

  if (pdfUsage >= pdfLimit) {
    return {
      allowed: false,
      reason: `PDF/Print limit reached for your current plan.`,
      code: "PDF_PRINT_LIMIT_EXCEEDED"
    };
  }

  return { allowed: true };
}

/**
 * Guard for API usage - checks API access feature, effective subscription status, and API call limits.
 * Uses effective status: ACTIVE/TRIALING must also have currentPeriodEnd >= now.
 */
export async function guardApiUsage(businessId: number): Promise<SubscriptionGuardResult> {
  const effStatus = await getEffectiveSubscriptionStatus(businessId);

  if (effStatus.rawStatus === SUBSCRIPTION_STATUS.TRIALING && effStatus.isExpired) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }

  const hasApiAccess = await hasFeatureAccess(businessId, FEATURE_KEYS.API_ACCESS);

  if (!hasApiAccess) {
    return {
      allowed: false,
      reason: `External API access is not available on your current plan.`,
      code: "API_ACCESS_DENIED"
    };
  }

  if (!effStatus.isActive) {
    return {
      allowed: false,
      reason: `API access is not available for your current subscription status.`,
      code: "SUBSCRIPTION_INACTIVE"
    };
  }

  const limitCheck = await checkLimitExceeded({
    businessId,
    usageKey: USAGE_KEYS.API_CALLS
  });

  if (limitCheck.exceeded && !isUnlimited(limitCheck.limit)) {
    return {
      allowed: false,
      reason: `API call limit exceeded for your current plan.`,
      code: "API_CALL_LIMIT_EXCEEDED"
    };
  }

  return { allowed: true };
}
