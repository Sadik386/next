import { prisma } from "@/lib/prisma";
import { activeBusinessMemberStatusWhere } from "@/constants/business-member-status";
import { createLog } from "@/services/activity-log.service";
import {
  FEATURE_KEYS,
  SUBSCRIPTION_STATUS,
  USAGE_KEYS,
  CURRENT_PLAN_CODES,
  getPlanEmailLimit,
  getPlanPdfPrintLimit,
  getPlanUserLimit,
  getPlanProductLimit,
  getPlanDuration,
  getPlanBadge,
  getPlanDescription,
  getPlanPriceMonthly,
  getPlanPriceYearly,
  PLAN_API_ENABLED,
  isFeatureEnabled,
  normalizePlanCode,
  safeJsonParse,
  PLAN_PRICES_BDT,
  getPlanDisplayLabel,
  type FeatureKey,
  type LegacyPlanCode,
  type PlanCode,
} from "@/lib/pricing";
import { calculateRenewalDates } from "@/lib/usage-service";
import type {
  Business,
  BusinessMember,
  BusinessNote,
  Prisma,
  Subscription,
  SubscriptionPlan,
  UsageOverride,
  User,
} from "@prisma/client";

type BusinessDetailRecord = Business & {
  subscription: (Subscription & { plan: SubscriptionPlan }) | null;
  members: Array<BusinessMember & { user: Pick<User, "email" | "name"> }>;
  usageOverrides: UsageOverride[];
};

type BusinessDetailPlanCode = PlanCode | LegacyPlanCode;

const LIMIT_OVERRIDE_FIELDS = [
  ["userLimitOverride", USAGE_KEYS.USERS_CREATED],
  ["productLimitOverride", USAGE_KEYS.PRODUCTS_CREATED],
  ["emailLimitOverride", USAGE_KEYS.EMAILS_SENT],
] as const;

const PLATFORM_FEATURES = [
  { key: FEATURE_KEYS.API_ACCESS, label: "API Access" },
  { key: FEATURE_KEYS.WEBHOOKS, label: "Webhooks" },
  { key: FEATURE_KEYS.CUSTOM_SMTP, label: "Custom SMTP" },
  { key: FEATURE_KEYS.MULTI_BRANCH, label: "Multi-Branch" },
  { key: FEATURE_KEYS.WHITE_LABEL, label: "White Label" },
  { key: FEATURE_KEYS.AUTOMATION, label: "Automation" },
  { key: FEATURE_KEYS.ADVANCED_REPORTS, label: "Advanced Reports" },
  { key: FEATURE_KEYS.CUSTOM_FIELDS, label: "Custom Fields" },
] as const;

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

function isCurrentPlanCode(code: string): code is PlanCode {
  return CURRENT_PLAN_CODES.includes(code as PlanCode);
}

function getPlanMonthlyPrice(code: BusinessDetailPlanCode, plan: SubscriptionPlan | null): number {
  if (isCurrentPlanCode(code)) return getPlanPriceMonthly(code as PlanCode, 'BDT');
  return toNumber(plan?.priceMonthly, 0);
}

function getPlanYearlyPrice(code: BusinessDetailPlanCode, plan: SubscriptionPlan | null): number {
  if (isCurrentPlanCode(code)) return getPlanPriceYearly(code as PlanCode, 'BDT');
  return toNumber(plan?.priceYearly, 0);
}

function getPlanFeatures(featuresRaw: unknown): Record<string, boolean> {
  return safeJsonParse<Record<string, boolean>>(featuresRaw, {}) ?? {};
}

function getOverrideValue(overrides: UsageOverride[], key: string): number | null {
  return overrides.find((override) => override.key === key)?.value ?? null;
}

function buildLimitMetric(used: number, planLimit: number, override: number | null) {
  return {
    used,
    planLimit,
    override,
    effectiveLimit: override ?? planLimit,
  };
}

function parseOverrideValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < -1) {
    throw new Error("Overrides must be whole numbers greater than or equal to -1");
  }

  return parsed;
}

export class PlatformAdminService {
  /**
   * Get high-level summary of the platform
   */
  async getSummary() {
    const [
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      totalSubscriptions,
      plans,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.subscription.count({ where: { status: SUBSCRIPTION_STATUS.ACTIVE } }),
      prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
      }),
    ]);

    const currentPlans = plans.filter(p => CURRENT_PLAN_CODES.includes(p.name as any));
    const planStats = currentPlans.map(plan => ({
      name: plan.name,
      label: plan.label,
      count: plan._count.subscriptions,
    }));

    const paidPlanIds = plans.filter(p => p.name !== "free" && p.name !== "trial").map(p => p.id);
    const paidSubscriptions = paidPlanIds.length > 0
      ? await prisma.subscription.count({
          where: {
            status: SUBSCRIPTION_STATUS.ACTIVE,
            planId: { in: paidPlanIds },
          },
        })
      : 0;

    return {
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      totalSubscriptions,
      paidSubscriptions,
      planStats,
    };
  }

  /**
   * Update business status for admin (suspend/reactivate)
   */
  async updateBusinessStatusForAdmin(businessId: number, isActive: boolean, adminId: number) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, isActive: true },
    });
    if (!business) throw new Error("Business not found");

    await prisma.business.update({
      where: { id: businessId },
      data: {
        isActive,
      },
    });

    await createLog({
      userId: adminId,
      action: isActive ? "reactivate_business" : "suspend_business",
      module: "platform_business",
      entityId: String(businessId),
      entityName: business.name,
      description: isActive
        ? `Business reactivated by platform admin`
        : `Business suspended by platform admin`,
      businessId,
      metadata: {
        previousStatus: business.isActive ? "active" : "suspended",
        newStatus: isActive ? "active" : "suspended",
      },
    });

    return this.getRequiredBusinessDetailForAdmin(businessId);
  }

  /**
   * Reset business overrides for admin
   */
  async resetBusinessOverridesForAdmin(businessId: number, adminId: number) {
    const business = await this.ensureBusinessExistsWithName(businessId);
    const previousOverrides = await prisma.usageOverride.findMany({
      where: { businessId, key: { in: LIMIT_OVERRIDE_FIELDS.map(([, key]) => key) } },
    });

    await prisma.usageOverride.deleteMany({
      where: {
        businessId,
        key: { in: LIMIT_OVERRIDE_FIELDS.map(([, key]) => key) },
      },
    });

    await createLog({
      userId: adminId,
      action: "reset_overrides",
      module: "platform_business",
      entityId: String(businessId),
      entityName: business.name,
      description: `Platform admin reset usage overrides`,
      businessId,
      metadata: {
        previousOverrides: previousOverrides.map(o => ({ key: o.key, value: o.value })),
      },
    });

    return this.getRequiredBusinessDetailForAdmin(businessId);
  }

  /**
   * Update business overrides for admin
   */
  async updateBusinessOverridesForAdmin(
    businessId: number,
    overrides: Record<string, unknown>,
    adminId: number
  ) {
    const business = await this.ensureBusinessExistsWithName(businessId);

    const previousOverrides = await prisma.usageOverride.findMany({
      where: { businessId, key: { in: LIMIT_OVERRIDE_FIELDS.map(([, key]) => key) } },
    });
    const previousOverrideMap: Record<string, number | null> = {};
    for (const o of previousOverrides) {
      previousOverrideMap[o.key] = o.value;
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [];
    const newOverrideValues: Record<string, number | null> = {};

    for (const [field, key] of LIMIT_OVERRIDE_FIELDS) {
      const value = parseOverrideValue(overrides[field]);
      newOverrideValues[key] = value;

      if (value === null) {
        operations.push(
          prisma.usageOverride.deleteMany({
            where: { businessId, key },
          })
        );
        continue;
      }

      operations.push(
        prisma.usageOverride.upsert({
          where: {
            businessId_key: {
              businessId,
              key,
            },
          },
          update: {
            value,
            reason: "Platform admin override",
          },
          create: {
            businessId,
            key,
            value,
            reason: "Platform admin override",
            createdBy: adminId,
          },
        })
      );
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    await createLog({
      userId: adminId,
      action: "update_overrides",
      module: "platform_business",
      entityId: String(businessId),
      entityName: business.name,
      description: `Platform admin updated usage overrides`,
      businessId,
      metadata: {
        previousOverrides: previousOverrideMap,
        newOverrides: newOverrideValues,
      },
    });

    return this.getRequiredBusinessDetailForAdmin(businessId);
  }

  /**
   * Update business plan for admin
   */
  async updateBusinessPlanForAdmin(businessId: number, planName: string, adminId: number) {
    const business = await this.ensureBusinessExistsWithName(businessId);
    const plan = await prisma.subscriptionPlan.findFirst({ where: { name: planName } });
    if (!plan) throw new Error("Plan not found");

    const currentSubscription = await prisma.subscription.findUnique({
      where: { businessId },
      include: { plan: true },
    });

    await prisma.business.update({
      where: { id: businessId },
      data: {
        subscription: {
          update: {
            planId: plan.id
          }
        }
      }
    });

    await createLog({
      userId: adminId,
      action: "change_plan",
      module: "subscription",
      entityId: String(businessId),
      entityName: business.name,
      description: `Plan changed by platform admin: ${currentSubscription?.plan?.label || 'unknown'} → ${plan.label}`,
      businessId,
      metadata: {
        previousPlanId: currentSubscription?.planId,
        previousPlanName: currentSubscription?.plan?.name,
        newPlanId: plan.id,
        newPlanName: plan.name,
      },
    });

    return this.getRequiredBusinessDetailForAdmin(businessId);
  }

  /**
   * Renew/extend business subscription for admin.
   * Uses currentPeriodEnd as base if still in future, otherwise uses approval date.
   * Duration is in months. Subscription status is set to ACTIVE.
   */
  async renewBusinessSubscriptionForAdmin(params: {
    businessId: number;
    planName: string;
    durationMonths: number;
    adminId: number;
  }) {
    const { businessId, planName, durationMonths, adminId } = params;

    if (durationMonths < 1 || durationMonths > 12) {
      throw new Error("Duration must be between 1 and 12 months");
    }

    const business = await this.ensureBusinessExistsWithName(businessId);
    const plan = await prisma.subscriptionPlan.findFirst({ where: { name: planName } });
    if (!plan) throw new Error("Plan not found");

    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
      include: { plan: true },
    });
    if (!subscription) throw new Error("No subscription found for this business");

    const previousPeriodEnd = subscription.currentPeriodEnd;
    const { newPeriodStart, newPeriodEnd } = calculateRenewalDates({
      currentPeriodEnd: subscription.currentPeriodEnd,
      approvedAt: new Date(),
      durationMonths,
    });

    await prisma.subscription.update({
      where: { businessId },
      data: {
        planId: plan.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        billingCycle: durationMonths >= 12 ? "yearly" : "monthly",
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        pausedAt: null,
      },
    });

    await createLog({
      userId: adminId,
      action: "renew_subscription",
      module: "subscription",
      entityId: String(businessId),
      entityName: business.name,
      description: `Subscription renewed by platform admin: ${plan.label} for ${durationMonths} month(s)`,
      businessId,
      metadata: {
        planName: plan.name,
        planLabel: plan.label,
        durationMonths,
        billingCycle: durationMonths >= 12 ? "yearly" : "monthly",
        previousPeriodEnd: previousPeriodEnd?.toISOString(),
        newPeriodStart: newPeriodStart.toISOString(),
        newPeriodEnd: newPeriodEnd.toISOString(),
        previousStatus: subscription.status,
        previousPlanId: subscription.planId,
      },
    });

    return this.getRequiredBusinessDetailForAdmin(businessId);
  }

  /**
   * Get detail of a specific business for admin
   */
  async getBusinessDetailForAdmin(businessId: number) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscription: { include: { plan: true } },
        usageOverrides: true,
        members: {
          where: { status: activeBusinessMemberStatusWhere() },
          include: {
            user: {
              select: { email: true, name: true },
            },
          },
        },
      },
    });

    if (!business) return null;

    const [plans, userCount, productCount, emailUsage] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { priceMonthly: "asc" },
      }),
      prisma.businessMember.count({
        where: { businessId, status: activeBusinessMemberStatusWhere() },
      }),
      prisma.product.count({
        where: { businessId, deletedAt: null },
      }),
      this.getCurrentUsageValue(businessId, USAGE_KEYS.EMAILS_SENT),
    ]);

    return this.toBusinessDetail(business, {
      plans,
      userCount,
      productCount,
      emailUsage,
    });
  }

  private async getRequiredBusinessDetailForAdmin(businessId: number) {
    const detail = await this.getBusinessDetailForAdmin(businessId);
    if (!detail) throw new Error("Business not found");
    return detail;
  }

  private async ensureBusinessExists(businessId: number) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });

    if (!business) throw new Error("Business not found");
  }

  private async ensureBusinessExistsWithName(businessId: number) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });

    if (!business) throw new Error("Business not found");
    return business;
  }

  private async getCurrentUsageValue(businessId: number, key: string): Promise<number> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const usage = await prisma.usage.findFirst({
      where: {
        businessId,
        key,
        periodStart,
        periodEnd,
      },
    });

    return usage?.value ?? 0;
  }

  private toBusinessDetail(
    business: BusinessDetailRecord,
    context: {
      plans: SubscriptionPlan[];
      userCount: number;
      productCount: number;
      emailUsage: number;
    }
  ) {
    const subscription = business.subscription;
    const plan = subscription?.plan ?? null;
const planCode = normalizePlanCode(plan?.name ?? "free");
    const features = getPlanFeatures(plan?.features);
    const apiAccessEnabled = PLAN_API_ENABLED[planCode as PlanCode | LegacyPlanCode] ?? false;
    const smtpAccessEnabled = isFeatureEnabled(features, FEATURE_KEYS.CUSTOM_SMTP as FeatureKey);
    const owner = business.members.find((member) => member.isDefault) ?? business.members[0];

    const planDescription = isCurrentPlanCode(planCode)
      ? getPlanDescription(planCode as PlanCode)
      : plan?.description || "";

    const userLimitOverride = getOverrideValue(business.usageOverrides, USAGE_KEYS.USERS_CREATED);
    const productLimitOverride = getOverrideValue(business.usageOverrides, USAGE_KEYS.PRODUCTS_CREATED);
    const emailLimitOverride = getOverrideValue(business.usageOverrides, USAGE_KEYS.EMAILS_SENT);
    const userPlanLimit = getPlanUserLimit(planCode);
    const productPlanLimit = getPlanProductLimit(planCode);
    const emailPlanLimit = getPlanEmailLimit(planCode);

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        isActive: business.isActive,
        createdAt: business.createdAt.toISOString(),
        updatedAt: business.updatedAt.toISOString(),
        ownerEmail: owner?.user.email ?? "-",
        ownerName: owner?.user.name ?? "-",
      },
      subscription: {
        id: subscription?.id ?? null,
        status: subscription?.status ?? "none",
        billingCycle: subscription?.billingCycle ?? "monthly",
        currentPeriodStart: toIso(subscription?.currentPeriodStart),
        currentPeriodEnd: toIso(subscription?.currentPeriodEnd),
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      },
      plan: {
        code: planCode,
        label: getNormalizedLabel(planCode),
        description: planDescription,
        badge: getPlanBadge(planCode),
        priceMonthly: getPlanMonthlyPrice(planCode, plan),
        priceYearly: getPlanYearlyPrice(planCode, plan),
      },
      usage: {
        users: buildLimitMetric(context.userCount, userPlanLimit, userLimitOverride),
        products: buildLimitMetric(context.productCount, productPlanLimit, productLimitOverride),
        emails: buildLimitMetric(context.emailUsage, emailPlanLimit, emailLimitOverride),
        apiAccessEnabled,
        smtpAccessEnabled,
      },
      featureAccess: PLATFORM_FEATURES.map((feature) => ({
        key: feature.key,
        label: feature.label,
        enabled:
          feature.key === FEATURE_KEYS.API_ACCESS
            ? apiAccessEnabled
            : isFeatureEnabled(features, feature.key as FeatureKey),
      })),
      overrides: {
        userLimitOverride,
        productLimitOverride,
        emailLimitOverride,
        apiAccessOverrideSupported: false,
        smtpAccessOverrideSupported: false,
      },
      plans: context.plans
        .filter((planOption) => CURRENT_PLAN_CODES.includes(planOption.name as PlanCode))
        .map((planOption) => ({
          id: planOption.id,
          name: planOption.name,
          label: planOption.label,
        })),
      support: {
        numericLimitOverrides: true,
        featureOverrides: false,
        internalNotes: false,
        connectedWebsiteFeature: false,
      },
    };
  }

  /**
   * Get list of all businesses with basic stats
   */
  async getBusinesses() {
    const businesses = await prisma.business.findMany({
      include: {
        subscription: {
          include: { plan: true },
        },
        members: {
          where: { status: "ACTIVE" },
          take: 1, // To find at least one admin/owner email
          include: {
            user: {
              select: { email: true, name: true },
            },
          },
        },
        _count: {
          select: {
            members: true,
            usages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return businesses.map(b => {
      const rawLabel = b.subscription?.plan.label || "Free";
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        isActive: b.isActive,
        createdAt: b.createdAt,
        plan: getPlanDisplayLabel(rawLabel),
        subscriptionStatus: b.subscription?.status || "none",
        userCount: b._count.members,
        ownerEmail: b.members[0]?.user.email || "—",
      };
    });
  }

  /**
   * Get all subscription plans and their limits
   */
  async getPlans() {
    return prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: "asc" },
    });
  }

  /**
   * Get only current V1 plans (excludes legacy plans)
   * Canonical pricing values from pricing.ts override DB values
   */
  async getCurrentPlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: "asc" },
    });

    // Map legacy plan names to current V1 plan names
    const planNameMap: Record<string, string> = {
      trial: 'starter',
      basic: 'starter',
      pro: 'business',
      growth: 'business',
      professional: 'business',
      enterprise: 'custom',
    };

    // V1 plan names (free, starter, business, custom)
    const v1PlanNames = ['free', 'starter', 'business', 'custom'];

    return plans
      .filter(p => {
        const name = p.name.toLowerCase();
        return v1PlanNames.includes(name) || name in planNameMap;
      })
      .map(p => {
        const code = p.name.toLowerCase();
        const currentCode = (planNameMap[code] ?? code) as PlanCode;
        const bdtPrices = PLAN_PRICES_BDT[currentCode] ?? { monthly: 0, yearly: 0 };
        const canonicalDescription = getPlanDescription(currentCode);

        return {
          ...p,
          description: canonicalDescription,
          maxUsers: getPlanUserLimit(currentCode),
          maxProducts: getPlanProductLimit(currentCode),
          emailLimit: getPlanEmailLimit(currentCode),
          pdfPrintLimit: getPlanPdfPrintLimit(currentCode),
          duration: getPlanDuration(currentCode),
          badge: getPlanBadge(currentCode),
          apiEnabled: PLAN_API_ENABLED[currentCode] ?? false,
          webhooksEnabled: PLAN_API_ENABLED[currentCode] ?? false,
          priceMonthly: bdtPrices.monthly,
          priceYearly: bdtPrices.yearly,
        };
      });
  }

  /**
   * Get usage overview across businesses
   */
  async getUsageOverview() {
    const usages = await prisma.usage.findMany({
      take: 100, // Limit for V1
      orderBy: { updatedAt: "desc" },
      include: {
        business: {
          select: { name: true },
        },
      },
    });

    return usages.map(u => ({
      id: u.id,
      businessName: u.business.name,
      key: u.key,
      value: u.value,
      periodEnd: u.periodEnd,
      updatedAt: u.updatedAt,
    }));
  }

  /**
   * Get internal notes for a business (platform admin only)
   */
  async getBusinessNotesForAdmin(businessId: number) {
    await this.ensureBusinessExists(businessId);

    const notes = await prisma.businessNote.findMany({
      where: { businessId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return notes.map(note => ({
      id: note.id,
      note: note.note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      user: {
        id: note.user.id,
        name: note.user.name,
        email: note.user.email,
      },
    }));
  }

  /**
   * Add internal note for a business (platform admin only)
   */
  async addBusinessNoteForAdmin(params: {
    businessId: number;
    adminId: number;
    note: string;
  }) {
    const { businessId, adminId, note } = params;

    if (!note || note.trim().length === 0) {
      throw new Error("Note cannot be empty");
    }

    const trimmedNote = note.trim();
    if (trimmedNote.length > 2000) {
      throw new Error("Note must be 2000 characters or less");
    }

    const business = await this.ensureBusinessExistsWithName(businessId);

    const createdNote = await prisma.businessNote.create({
      data: {
        businessId,
        userId: adminId,
        note: trimmedNote,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await createLog({
      userId: adminId,
      action: "add_business_note",
      module: "business_note",
      entityId: String(businessId),
      entityName: business.name,
      description: `Platform admin added internal note`,
      businessId,
      metadata: {
        noteId: createdNote.id,
        noteLength: trimmedNote.length,
      },
    });

    return {
      id: createdNote.id,
      note: createdNote.note,
      createdAt: createdNote.createdAt.toISOString(),
      updatedAt: createdNote.updatedAt.toISOString(),
      user: {
        id: createdNote.user.id,
        name: createdNote.user.name,
        email: createdNote.user.email,
      },
    };
  }
}

export const platformAdminService = new PlatformAdminService();
