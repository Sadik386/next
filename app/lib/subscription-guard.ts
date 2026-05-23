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
  normalizePlanCode,
} from "./pricing";
import { getBusinessSubscription } from "./usage-service";

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

interface CheckLimitOptions {
  businessId: number;
  usageKey: string;
}

/**
 * Check if subscription is active and not expired
 */
export async function isSubscriptionActive(businessId: number): Promise<boolean> {
  const subscription = await getBusinessSubscription(businessId);
  return subscription?.status === SUBSCRIPTION_STATUS.ACTIVE || subscription?.status === SUBSCRIPTION_STATUS.TRIALING;
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
 * Check if business has access to a specific feature
 */
export async function hasFeatureAccess(businessId: number, featureKey: string): Promise<boolean> {
  const subscription = await getBusinessSubscription(businessId);
  if (!subscription) return false;
  
  // Only check features for active or trialing subscriptions
  if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE && subscription.status !== SUBSCRIPTION_STATUS.TRIALING) {
    return false;
  }
  
  const planFeatures = JSON.parse(subscription.plan.features || '{}');
  return planFeatures[featureKey] ?? false;
}

/**
 * Check if business has exceeded a usage limit
 */
export async function checkLimitExceeded(options: CheckLimitOptions): Promise<{ exceeded: boolean; current: number; limit: number }> {
  const { businessId, usageKey } = options;
  
  const subscription = await getBusinessSubscription(businessId);
  if (!subscription) {
    // No subscription - use free plan limits
    const defaultLimit = getDefaultLimit(usageKey);
    const currentUsage = await getCurrentUsage(businessId, usageKey);
    return {
      exceeded: currentUsage >= defaultLimit && defaultLimit !== -1,
      current: currentUsage,
      limit: defaultLimit
    };
  }
  
  // Check subscription status
  if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE && subscription.status !== SUBSCRIPTION_STATUS.TRIALING) {
    // Expired, canceled, paused subscription - treat as free plan
    const defaultLimit = getDefaultLimit(usageKey);
    const currentUsage = await getCurrentUsage(businessId, usageKey);
    return {
      exceeded: currentUsage >= defaultLimit && defaultLimit !== -1,
      current: currentUsage,
      limit: defaultLimit
    };
  }
  
  // Active subscription - check plan limits
  const planLimits = JSON.parse(subscription.plan.usageLimits || '{}');
  const planLimit = planLimits[usageKey] ?? getDefaultLimit(usageKey);
  const currentUsage = await getCurrentUsage(businessId, usageKey);
  
  return {
    exceeded: currentUsage >= planLimit && planLimit !== -1,
    current: currentUsage,
    limit: planLimit
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
 * Guard for product creation - checks product limit and trial status
 */
export async function guardProductCreation(businessId: number): Promise<SubscriptionGuardResult> {
  const subscription = await getBusinessSubscription(businessId);
  
  // Check if trial is expired
  if (subscription && subscription.status === SUBSCRIPTION_STATUS.TRIALING && await isTrialExpired(businessId)) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }
  
  // Determine limit based on subscription status
  let productLimit: number;
  if (!subscription) {
    // No subscription - use free plan
    productLimit = getPlanProductLimit(PLAN_NAMES.FREE);
  } else if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE || subscription.status === SUBSCRIPTION_STATUS.TRIALING) {
    // Active or trial subscription
    productLimit = subscription.plan.maxProducts ?? getPlanProductLimit(normalizePlanCode(subscription.plan.name));
  } else {
    // Expired, canceled, paused - treat as free
    productLimit = getPlanProductLimit(PLAN_NAMES.FREE);
  }
  
  // Check current product count
  const currentProductCount = await prisma.product.count({
    where: {
      businessId,
      deletedAt: null,
    }
  });
  
  // Check if limit exceeded (unlimited = -1)
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
 * Guard for user creation - checks user/team limit and trial status
 */
export async function guardUserCreation(businessId: number): Promise<SubscriptionGuardResult> {
  const subscription = await getBusinessSubscription(businessId);
  
  // Check if trial is expired
  if (subscription && subscription.status === SUBSCRIPTION_STATUS.TRIALING && await isTrialExpired(businessId)) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }
  
  // Determine limit based on subscription status
  let userLimit: number;
  if (!subscription) {
    // No subscription - use free plan
    userLimit = getPlanUserLimit(PLAN_NAMES.FREE);
  } else if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE || subscription.status === SUBSCRIPTION_STATUS.TRIALING) {
    // Active or trial subscription
    userLimit = subscription.plan.maxUsers ?? getPlanUserLimit(normalizePlanCode(subscription.plan.name));
  } else {
    // Expired, canceled, paused - treat as free
    userLimit = getPlanUserLimit(PLAN_NAMES.FREE);
  }
  
  // Check current user count (active business members)
  const currentUserCount = await prisma.businessMember.count({
    where: {
      businessId,
      status: activeBusinessMemberStatusWhere()
    }
  });
  
  // Check if limit exceeded (unlimited = -1)
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
 * Guard for API key creation - checks API access feature and trial status
 */
export async function guardApiKeyCreation(businessId: number): Promise<SubscriptionGuardResult> {
  const subscription = await getBusinessSubscription(businessId);
  
  // Check if trial is expired
  if (subscription && subscription.status === SUBSCRIPTION_STATUS.TRIALING && await isTrialExpired(businessId)) {
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
 * Guard for email sending - checks email quota and trial status
 */
export async function guardEmailSend(businessId: number): Promise<SubscriptionGuardResult> {
  const subscription = await getBusinessSubscription(businessId);
  
  // Check if trial is expired
  if (subscription && subscription.status === SUBSCRIPTION_STATUS.TRIALING && await isTrialExpired(businessId)) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }
  
  // Determine email limit based on subscription status
  let emailLimit: number;
  if (!subscription) {
    // No subscription - use free plan
    emailLimit = getPlanEmailLimit(PLAN_NAMES.FREE);
  } else if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE || subscription.status === SUBSCRIPTION_STATUS.TRIALING) {
    // Active or trial subscription
    emailLimit = getPlanEmailLimit(normalizePlanCode(subscription.plan.name));
  } else {
    // Expired, canceled, paused - treat as free
    emailLimit = getPlanEmailLimit(PLAN_NAMES.FREE);
  }
  
  // Check current email usage
  const emailUsage = await getCurrentUsage(businessId, USAGE_KEYS.EMAILS_SENT);
  
  // Check if limit exceeded (unlimited = -1)
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
 * Guard for webhook creation - checks webhook feature access and trial status
 */
export async function guardWebhookCreation(businessId: number): Promise<SubscriptionGuardResult> {
  const subscription = await getBusinessSubscription(businessId);
  
  // Check if trial is expired
  if (subscription && subscription.status === SUBSCRIPTION_STATUS.TRIALING && await isTrialExpired(businessId)) {
    return {
      allowed: false,
      reason: `Your trial has expired. Upgrade or switch plan to continue.`,
      code: "TRIAL_EXPIRED"
    };
  }
  
  // Check if webhook feature is enabled
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
