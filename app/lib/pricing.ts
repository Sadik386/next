// Usage keys - these are the VALUES used in the system
export const USAGE_KEYS = {
  ORDERS_CREATED: 'ordersCreated',
  SALES_CREATED: 'salesCreated',
  PRODUCTS_CREATED: 'productsCreated',
  USERS_CREATED: 'usersCreated',
  CUSTOMERS_CREATED: 'customersCreated',
  SUPPLIERS_CREATED: 'suppliersCreated',
  EXPENSES_CREATED: 'expensesCreated',
  INVOICES_CREATED: 'invoicesCreated',
  POS_SESSIONS: 'posSessions',
  API_CALLS: 'apiCalls',
  API_KEYS_CREATED: 'apiKeysCreated',
  EMAILS_SENT: 'emailsSent',
  STORAGE_MB: 'storageMb',
} as const;

export type UsageKey = typeof USAGE_KEYS[keyof typeof USAGE_KEYS];

// Feature keys - these are the VALUES used in the system
export const FEATURE_KEYS = {
  CUSTOM_SMTP: 'customSmtp',
  API_ACCESS: 'apiAccess',
  WEBHOOKS: 'webhooks',
  WHITE_LABEL: 'whiteLabel',
  ADVANCED_REPORTS: 'advancedReports',
  MULTI_BRANCH: 'multiBranch',
  CUSTOM_FIELDS: 'customFields',
  AUTOMATION: 'automation',
  TWO_FACTOR_AUTH: 'twoFactorAuth',
  AUDIT_LOG: 'auditLog',
} as const;

export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS];

// Plan IDs
export const PLAN_IDS = {
  TRIAL: 'trial',
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  BUSINESS: 'business',
} as const;

// Plan names (for database lookups)
export const PLAN_NAMES = {
  TRIAL: 'trial',
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  BUSINESS: 'business',
} as const;

// Check if usage is unlimited (value === -1 means unlimited)
export function isUnlimited(value: number): boolean {
  return value === -1;
}

// Get usage limit from plan config
export function getUsageLimit(planConfig: Record<string, number>, key: UsageKey): number {
  return planConfig[key] ?? -1;
}

// Check if feature is enabled in plan config
export function isFeatureEnabled(planConfig: Record<string, boolean>, key: FeatureKey): boolean {
  return planConfig[key] ?? false;
}

// Default usage limits per plan
export const DEFAULT_USAGE_LIMITS: Record<string, number> = {
  [USAGE_KEYS.ORDERS_CREATED]: 50,
  [USAGE_KEYS.SALES_CREATED]: 100,
  [USAGE_KEYS.PRODUCTS_CREATED]: -1,
  [USAGE_KEYS.USERS_CREATED]: -1,
  [USAGE_KEYS.CUSTOMERS_CREATED]: 50,
  [USAGE_KEYS.SUPPLIERS_CREATED]: 20,
  [USAGE_KEYS.EXPENSES_CREATED]: 20,
  [USAGE_KEYS.INVOICES_CREATED]: 10,
  [USAGE_KEYS.POS_SESSIONS]: -1,
  [USAGE_KEYS.API_CALLS]: 100,
  [USAGE_KEYS.API_KEYS_CREATED]: -1,
  [USAGE_KEYS.EMAILS_SENT]: 100,
  [USAGE_KEYS.STORAGE_MB]: 100,
};

// Default features per plan
export const DEFAULT_FEATURES: Record<string, boolean> = {
  [FEATURE_KEYS.CUSTOM_SMTP]: false,
  [FEATURE_KEYS.API_ACCESS]: false,
  [FEATURE_KEYS.WEBHOOKS]: false,
  [FEATURE_KEYS.WHITE_LABEL]: false,
  [FEATURE_KEYS.ADVANCED_REPORTS]: false,
  [FEATURE_KEYS.MULTI_BRANCH]: false,
  [FEATURE_KEYS.CUSTOM_FIELDS]: false,
  [FEATURE_KEYS.AUTOMATION]: false,
  [FEATURE_KEYS.TWO_FACTOR_AUTH]: false,
  [FEATURE_KEYS.AUDIT_LOG]: false,
};

// Subscription status
export const SUBSCRIPTION_STATUS = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
} as const;

// Billing cycles
export const BILLING_CYCLE = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

// ============================================================
// V1 PRICING SINGLE SOURCE OF TRUTH
// ============================================================

export const CURRENT_PLAN_CODES = ['trial', 'free', 'basic', 'pro', 'business', 'custom'] as const;
export const LEGACY_PLAN_CODES = ['starter', 'professional', 'enterprise'] as const;
export const PAID_PLAN_CODES = ['basic', 'pro', 'business', 'custom'] as const;

export type PlanCode = typeof CURRENT_PLAN_CODES[number];
export type LegacyPlanCode = typeof LEGACY_PLAN_CODES[number];

export const PLAN_DISPLAY_ORDER: PlanCode[] = ['trial', 'free', 'basic', 'pro', 'business', 'custom'];

export const PLAN_EMAIL_LIMITS: Record<PlanCode | LegacyPlanCode, number> = {
  trial: 100,
  free: 100,
  basic: 500,
  pro: 2000,
  business: 7000,
  custom: -1,
  starter: 100,
  professional: 500,
  enterprise: 10000,
};

export const PLAN_TRIAL_DAYS: Record<string, number> = {
  trial: 7,
  basic: 0,
  pro: 0,
  business: 0,
  custom: 0,
};

export const PLAN_DURATION: Record<string, string> = {
  trial: '7-Day Trial',
  free: 'Lifetime Free',
  basic: 'Monthly',
  pro: 'Monthly',
  business: 'Monthly',
  custom: 'Custom',
};

export const PLAN_EXTERNAL_API: Record<PlanCode | LegacyPlanCode, boolean> = {
  trial: false,
  free: false,
  basic: false,
  pro: true,
  business: true,
  custom: true,
  starter: false,
  professional: true,
  enterprise: true,
};

export const PLAN_BADGES: Record<string, string> = {
  trial: '7-Day Trial',
  free: 'Lifetime Free',
  basic: '',
  pro: 'Popular',
  business: 'Business',
  custom: 'Custom',
};

export const PLAN_USER_LIMITS: Record<PlanCode | LegacyPlanCode, number> = {
  trial: 3,
  free: 1,
  basic: 3,
  pro: 5,
  business: 10,
  custom: -1,
  starter: 2,
  professional: 10,
  enterprise: -1,
};

export const PLAN_PRODUCT_LIMITS: Record<PlanCode | LegacyPlanCode, number> = {
  trial: 30,
  free: 50,
  basic: 250,
  pro: 550,
  business: 1200,
  custom: -1,
  starter: 50,
  professional: 2000,
  enterprise: -1,
};

export const PLAN_PRICES: Record<PlanCode, { monthly: number; yearly: number }> = {
  trial: { monthly: 0, yearly: 0 },
  free: { monthly: 0, yearly: 0 },
  basic: { monthly: 10, yearly: 100 },
  pro: { monthly: 50, yearly: 500 },
  business: { monthly: 120, yearly: 1200 },
  custom: { monthly: 0, yearly: 0 },
};

export const PLAN_DESCRIPTIONS: Record<PlanCode, string> = {
  trial: "7-day short-term trial for trying core features",
  free: "Lifetime free starter plan for small businesses",
  basic: "For small businesses with growing needs and more team access",
  pro: "For growing businesses with advanced features, API, and integrations",
  business: "For larger teams with all features, multi-branch, and white-label support",
  custom: "Custom pricing tailored to your business needs",
};

export function isCurrentPlan(code: string): boolean {
  return CURRENT_PLAN_CODES.includes(code as PlanCode);
}

export function isLegacyPlan(code: string): boolean {
  return LEGACY_PLAN_CODES.includes(code as LegacyPlanCode);
}

export function isPaidPlan(code: string): boolean {
  return PAID_PLAN_CODES.includes(code as any);
}

export function getPlanEmailLimit(code: string): number {
  return PLAN_EMAIL_LIMITS[code as PlanCode | LegacyPlanCode] ?? 100;
}

export function getPlanTrialDays(code: string): number {
  return PLAN_TRIAL_DAYS[code] ?? 0;
}

export function getPlanDuration(code: string): string {
  return PLAN_DURATION[code] ?? 'Monthly';
}

export function hasExternalApi(code: string): boolean {
  return PLAN_EXTERNAL_API[code as PlanCode | LegacyPlanCode] ?? false;
}

export function getPlanBadge(code: string): string {
  return PLAN_BADGES[code] ?? '';
}

export function getPlanUserLimit(code: string): number {
  return PLAN_USER_LIMITS[code as PlanCode | LegacyPlanCode] ?? 1;
}

export function getPlanProductLimit(code: string): number {
  return PLAN_PRODUCT_LIMITS[code as PlanCode | LegacyPlanCode] ?? 100;
}

export function getPlanPriceMonthly(code: string): number {
  return PLAN_PRICES[code as PlanCode]?.monthly ?? 0;
}

export function getPlanPriceYearly(code: string): number {
  return PLAN_PRICES[code as PlanCode]?.yearly ?? 0;
}

export function getPlanDescription(code: string): string {
  return PLAN_DESCRIPTIONS[code as PlanCode] ?? '';
}

export function normalizePlanCode(code: string): PlanCode | LegacyPlanCode {
  const normalized = code?.toLowerCase().trim();
  if (isCurrentPlan(normalized)) return normalized as PlanCode;
  if (isLegacyPlan(normalized)) return normalized as LegacyPlanCode;
  return 'free' as PlanCode;
}

// Safe JSON parse - use this everywhere instead of raw JSON.parse
export function safeJsonParse<T = object>(value: any, fallback: T | null = null): T | null {
  if (!value || typeof value !== 'string') {
    if (value && typeof value === 'object') return value as T;
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
