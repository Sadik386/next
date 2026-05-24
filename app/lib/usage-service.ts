import { prisma } from './prisma';
import { USAGE_KEYS, isUnlimited, PLAN_NAMES, SUBSCRIPTION_STATUS, BILLING_CYCLE } from './pricing';

interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}

interface FeatureCheckResult {
  enabled: boolean;
}

/**
 * Get current period boundaries
 */
export function getCurrentPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

/**
 * Get subscription with plan for a business
 */
export async function getBusinessSubscription(businessId: number) {
  return prisma.subscription.findUnique({
    where: { businessId },
    include: { plan: true },
  });
}

/**
 * Check if business can use a specific usage key
 * Returns current usage, limit, and whether allowed
 */
export async function checkUsageLimit(
  businessId: number,
  usageKey: string
): Promise<UsageCheckResult> {
  const { start, end } = getCurrentPeriod();

  // Get subscription
  const subscription = await getBusinessSubscription(businessId);

  // Default to free plan limits if no subscription
  const defaultLimit = getDefaultLimit(usageKey);
  let planLimit = defaultLimit;

  if (subscription && subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
    const planLimits = JSON.parse(subscription.plan.usageLimits || '{}');
    planLimit = planLimits[usageKey] ?? defaultLimit;
  }

  // Check for override
  const override = await prisma.usageOverride.findUnique({
    where: {
      businessId_key: {
        businessId,
        key: usageKey,
      },
    },
  });

  if (override && isUnlimited(override.value)) {
    planLimit = -1;
  } else if (override) {
    planLimit = override.value;
  }

  // Get current usage
  const usage = await prisma.usage.findFirst({
    where: {
      businessId,
      key: usageKey,
      periodStart: start,
      periodEnd: end,
    },
  });

  const current = usage?.value ?? 0;
  const unlimited = isUnlimited(planLimit);

  return {
    allowed: unlimited || current < planLimit,
    current,
    limit: planLimit,
    remaining: unlimited ? -1 : Math.max(0, planLimit - current),
  };
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
 * Get current usage value
 */
export async function getCurrentUsage(
  businessId: number,
  usageKey: string
): Promise<number> {
  const { start, end } = getCurrentPeriod();

  const usage = await prisma.usage.findFirst({
    where: {
      businessId,
      key: usageKey,
      periodStart: start,
      periodEnd: end,
    },
  });

  return usage?.value ?? 0;
}

/**
 * Check if a feature is enabled for a business
 */
export async function checkFeature(
  businessId: number,
  featureKey: string
): Promise<FeatureCheckResult> {
  // Get subscription
  const subscription = await getBusinessSubscription(businessId);

  // Default to free plan features if no subscription
  const defaultEnabled = getDefaultFeature(featureKey);
  let enabled = defaultEnabled;

  if (subscription && subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
    const planFeatures = JSON.parse(subscription.plan.features || '{}');
    enabled = planFeatures[featureKey] ?? defaultEnabled;
  }

  return { enabled };
}

/**
 * Get usage override for a business
 */
export async function getUsageOverride(
  businessId: number,
  usageKey: string
) {
  return prisma.usageOverride.findUnique({
    where: {
      businessId_key: {
        businessId,
        key: usageKey,
      },
    },
  });
}

/**
 * Set usage override for a business
 */
export async function setUsageOverride(
  businessId: number,
  usageKey: string,
  value: number,
  reason?: string,
  createdBy?: number
) {
  return prisma.usageOverride.upsert({
    where: {
      businessId_key: {
        businessId,
        key: usageKey,
      },
    },
    update: {
      value,
      reason,
      updatedAt: new Date(),
    },
    create: {
      businessId,
      key: usageKey,
      value,
      reason,
      createdBy,
    },
  });
}

/**
 * Remove usage override
 */
export async function removeUsageOverride(
  businessId: number,
  usageKey: string
) {
  return prisma.usageOverride.delete({
    where: {
      businessId_key: {
        businessId,
        key: usageKey,
      },
    },
  });
}

/**
 * Get all usage records for current period
 */
export async function getAllCurrentUsage(businessId: number) {
  const { start, end } = getCurrentPeriod();

  return prisma.usage.findMany({
    where: {
      businessId,
      periodStart: start,
      periodEnd: end,
    },
  });
}

/**
 * Get usage summary with limits
 */
export async function getUsageSummary(businessId: number) {
  const subscription = await getBusinessSubscription(businessId);
  const currentUsage = await getAllCurrentUsage(businessId);

  // Get plan limits
  let planLimits: Record<string, number> = {};
  if (subscription && subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
    planLimits = JSON.parse(subscription.plan.usageLimits || '{}');
  }

  // Get overrides
  const overrides = await prisma.usageOverride.findMany({
    where: { businessId },
  });

  const usageMap: Record<string, number> = {};
  for (const u of currentUsage) {
    usageMap[u.key] = u.value;
  }

  const overrideMap: Record<string, number> = {};
  for (const o of overrides) {
    overrideMap[o.key] = o.value;
  }

  // Build summary
  const summary: Array<{
    key: string;
    current: number;
    limit: number;
    override: number | null;
    remaining: number;
  }> = [];

  for (const key of Object.values(USAGE_KEYS)) {
    const defaultLimit = getDefaultLimit(key);
    let limit = planLimits[key] ?? defaultLimit;

    // Apply override
    const override = overrideMap[key];
    if (override !== undefined) {
      limit = override;
    }

    const current = usageMap[key] ?? 0;
    const unlimited = isUnlimited(limit);

    summary.push({
      key,
      current,
      limit: defaultLimit, // Show default limit as reference
      override: override !== undefined ? override : null,
      remaining: unlimited ? -1 : Math.max(0, limit - current),
    });
  }

  return {
    plan: subscription?.plan.name ?? PLAN_NAMES.FREE,
    status: subscription?.status ?? null,
    usage: summary,
  };
}

// Default limits per plan (fallback when no subscription)
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

// Default features per plan
function getDefaultFeature(featureKey: string): boolean {
  return false; // Free plan has no paid features
}

/**
 * Create trial subscription for a business
 */
export async function createTrialSubscription(businessId: number) {
  // Find trial plan
  const trialPlan = await prisma.subscriptionPlan.findFirst({
    where: { isTrial: true, isActive: true },
  });

  if (!trialPlan) {
    throw new Error('No trial plan available');
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return prisma.subscription.create({
    data: {
      businessId,
      planId: trialPlan.id,
      status: SUBSCRIPTION_STATUS.TRIALING,
      billingCycle: BILLING_CYCLE.MONTHLY,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
}

/**
 * Get all subscription plans
 */
export async function getSubscriptionPlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' },
  });
}

/**
 * Subscribe business to a plan
 */
export async function subscribeToPlan(
  businessId: number,
  planId: number,
  billingCycle: string = BILLING_CYCLE.MONTHLY
) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error('Plan not found');
  }

  const now = new Date();
  const periodEnd = new Date(
    now.getTime() + (billingCycle === BILLING_CYCLE.YEARLY ? 365 : 30) * 24 * 60 * 60 * 1000
  );

  // Check if subscription exists
  const existing = await prisma.subscription.findUnique({
    where: { businessId },
  });

  if (existing) {
    return prisma.subscription.update({
      where: { businessId },
      data: {
        planId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });
  }

  return prisma.subscription.create({
    data: {
      businessId,
      planId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
}

/**
 * Cancel subscription (at period end)
 */
export async function cancelSubscription(businessId: number) {
  return prisma.subscription.update({
    where: { businessId },
    data: {
      status: SUBSCRIPTION_STATUS.CANCELED,
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
    },
  });
}

/**
 * Pause subscription
 */
export async function pauseSubscription(businessId: number) {
  return prisma.subscription.update({
    where: { businessId },
    data: {
      status: SUBSCRIPTION_STATUS.PAUSED,
      pausedAt: new Date(),
    },
  });
}

/**
 * Resume subscription
 */
export async function resumeSubscription(businessId: number) {
  return prisma.subscription.update({
    where: { businessId },
    data: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      resumedAt: new Date(),
    },
  });
}
