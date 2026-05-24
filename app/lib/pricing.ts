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
  PDF_PRINT_COUNT: 'pdfPrintCount',
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

// Plan IDs - V1 canonical names
export const PLAN_IDS = {
  FREE: 'free',
  STARTER: 'starter',
  BUSINESS: 'business',
  CUSTOM: 'custom',
} as const;

// Plan names (for database lookups)
export const PLAN_NAMES = {
  FREE: 'free',
  STARTER: 'starter',
  BUSINESS: 'business',
  CUSTOM: 'custom',
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
  [USAGE_KEYS.PDF_PRINT_COUNT]: 50,
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

// Trial is subscription STATUS only, not a display plan.
// Paid plans include 7-day free trial option.
export const CURRENT_PLAN_CODES = ['free', 'starter', 'business', 'custom'] as const;
export const LEGACY_PLAN_CODES = ['trial', 'basic', 'pro', 'growth', 'business', 'starter', 'professional', 'enterprise'] as const;
export const PAID_PLAN_CODES = ['starter', 'business', 'custom'] as const;

// User-facing display order (excludes trial as standalone plan)
export const PLAN_DISPLAY_ORDER: PlanCode[] = ['free', 'starter', 'business', 'custom'];

export const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  business: 'Business',
  custom: 'Custom',
};

export type PlanCode = typeof CURRENT_PLAN_CODES[number];
export type LegacyPlanCode = typeof LEGACY_PLAN_CODES[number];

// Fixed 7-day trial duration for all paid plans
export const PAID_PLAN_TRIAL_DAYS = 7;

// Pricing: USD is base/reference, BDT has fixed local price
// Do NOT use live exchange rate
export const PLAN_PRICES_USD: Record<PlanCode, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 9, yearly: 90 },
  business: { monthly: 24, yearly: 240 },
  custom: { monthly: 0, yearly: 0 },
};

export const PLAN_PRICES_BDT: Record<PlanCode, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 990, yearly: 9900 },
  business: { monthly: 2490, yearly: 24900 },
  custom: { monthly: 0, yearly: 0 },
};

// Get prices based on currency setting
export function getPlanPrices(
  code: PlanCode,
  currency: 'USD' | 'BDT' = 'BDT'
): { monthly: number; yearly: number } {
  if (currency === 'USD') return PLAN_PRICES_USD[code] ?? { monthly: 0, yearly: 0 };
  return PLAN_PRICES_BDT[code] ?? { monthly: 0, yearly: 0 };
}

// User limits per plan
export const PLAN_USER_LIMITS: Record<PlanCode | LegacyPlanCode, number> = {
  free: 1,
  starter: 3,
  business: 10,
  custom: -1,
  trial: 3,
  basic: 3,
  pro: 10,
  growth: 10,
  professional: 10,
  enterprise: -1,
};

// Product limits per plan
export const PLAN_PRODUCT_LIMITS: Record<PlanCode | LegacyPlanCode, number> = {
  free: 30,
  starter: 200,
  business: 500,
  custom: -1,
  trial: 30,
  basic: 200,
  pro: 500,
  growth: 500,
  professional: 2000,
  enterprise: -1,
};

// Email limits per plan
export const PLAN_EMAIL_LIMITS: Record<PlanCode | LegacyPlanCode, number> = {
  free: 100,
  starter: 250,
  business: 1000,
  custom: -1,
  trial: 100,
  basic: 250,
  pro: 1000,
  growth: 1000,
  professional: 1000,
  enterprise: 10000,
};

// PDF/Print quota per plan
export const PLAN_PDF_PRINT_LIMITS: Record<PlanCode | LegacyPlanCode, number> = {
  free: 50,
  starter: 250,
  business: 1000,
  custom: -1,
  trial: 50,
  basic: 250,
  pro: 1000,
  growth: 1000,
  professional: 1000,
  enterprise: -1,
};

// Duration labels
export const PLAN_DURATION: Record<string, string> = {
  free: 'Lifetime Free',
  starter: 'Monthly',
  business: 'Monthly',
  custom: 'Custom',
};

// API/Webhooks enabled per plan
export const PLAN_API_ENABLED: Record<PlanCode | LegacyPlanCode, boolean> = {
  free: false,
  starter: false,
  business: true,
  custom: true,
  trial: false,
  basic: false,
  pro: true,
  growth: true,
  professional: true,
  enterprise: true,
};

// Plan badge labels
export const PLAN_BADGES: Record<string, string> = {
  free: 'Lifetime Free',
  starter: '',
  business: 'Popular',
  custom: 'Custom',
};

// Plan descriptions
export const PLAN_DESCRIPTIONS: Record<PlanCode, string> = {
  free: 'Lifetime free starter plan for small businesses',
  starter: 'For small businesses with growing needs and more team access',
  business: 'For growing businesses with advanced features, API, and integrations',
  custom: 'Custom pricing tailored to your business needs',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function isCurrentPlan(code: string): boolean {
  return CURRENT_PLAN_CODES.includes(code as PlanCode);
}

export function isLegacyPlan(code: string): boolean {
  return LEGACY_PLAN_CODES.includes(code as LegacyPlanCode);
}

export function isPaidPlan(code: string): boolean {
  return PAID_PLAN_CODES.includes(code as any);
}

export function isTrialPlan(code: string): boolean {
  return code === 'trial';
}

export function getPlanUserLimit(code: string): number {
  return PLAN_USER_LIMITS[code as PlanCode | LegacyPlanCode] ?? 1;
}

export function getPlanProductLimit(code: string): number {
  return PLAN_PRODUCT_LIMITS[code as PlanCode | LegacyPlanCode] ?? 100;
}

export function getPlanEmailLimit(code: string): number {
  return PLAN_EMAIL_LIMITS[code as PlanCode | LegacyPlanCode] ?? 100;
}

export function getPlanPdfPrintLimit(code: string): number {
  return PLAN_PDF_PRINT_LIMITS[code as PlanCode | LegacyPlanCode] ?? 50;
}

export function getPlanPriceMonthly(code: PlanCode, currency: 'USD' | 'BDT' = 'BDT'): number {
  return getPlanPrices(code, currency).monthly;
}

export function getPlanPriceYearly(code: PlanCode, currency: 'USD' | 'BDT' = 'BDT'): number {
  return getPlanPrices(code, currency).yearly;
}

export function getPlanDuration(code: string): string {
  return PLAN_DURATION[code] ?? 'Monthly';
}

export function hasExternalApi(code: string): boolean {
  return PLAN_API_ENABLED[code as PlanCode | LegacyPlanCode] ?? false;
}

export function getPlanBadge(code: string): string {
  return PLAN_BADGES[code] ?? '';
}

export function getPlanDescription(code: PlanCode): string {
  return PLAN_DESCRIPTIONS[code] ?? '';
}

export const PLAN_DISPLAY_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  business: 'Business',
  custom: 'Custom',
  trial: 'Starter',
  basic: 'Starter',
  pro: 'Business',
  growth: 'Business',
  professional: 'Business',
  enterprise: 'Custom',
};

export function getPlanDisplayLabel(code: string): string {
  const key = code?.toLowerCase().trim();
  return PLAN_DISPLAY_LABELS[key] ?? PLAN_LABELS[key] ?? code.charAt(0).toUpperCase() + code.slice(1);
}

export function normalizePlanCode(code: string): PlanCode | LegacyPlanCode {
  const normalized = code?.toLowerCase().trim();
  if (isCurrentPlan(normalized)) return normalized as PlanCode;
  if (isLegacyPlan(normalized)) return normalized as LegacyPlanCode;
  return 'free' as PlanCode;
}

export function getAvailableNextPlans(currentCode: string): PlanCode[] {
  const order = PLAN_DISPLAY_ORDER;
  const currentIndex = order.indexOf(currentCode as PlanCode);
  if (currentIndex === -1) return [];
  return order.slice(currentIndex + 1) as PlanCode[];
}

// Safe JSON parse
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