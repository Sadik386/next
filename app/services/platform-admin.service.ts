import { prisma } from "@/lib/prisma";
import {
  SUBSCRIPTION_STATUS,
  CURRENT_PLAN_CODES,
  getPlanEmailLimit,
  getPlanUserLimit,
  getPlanProductLimit,
  getPlanDuration,
  getPlanBadge,
  hasExternalApi,
} from "@/lib/pricing";

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
   * Update business status for admin
   */
  async updateBusinessStatusForAdmin(businessId: number, isActive: boolean) {
    return prisma.business.update({
      where: { id: businessId },
      data: {
        isActive,
      },
    });
  }

  /**
   * Reset business overrides for admin
   */
  async resetBusinessOverridesForAdmin(businessId: number) {
    return prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscription: { include: { plan: true } },
        members: { include: { user: true } },
      },
    });
  }

  /**
   * Update business overrides for admin
   */
  async updateBusinessOverridesForAdmin(businessId: number, overrides: any, adminId: number) {
    return prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscription: { include: { plan: true } },
        members: { include: { user: true } },
      },
    });
  }

  /**
   * Update business plan for admin
   */
  async updateBusinessPlanForAdmin(businessId: number, planName: string) {
    const plan = await prisma.subscriptionPlan.findFirst({ where: { name: planName } });
    if (!plan) throw new Error("Plan not found");
    
    return prisma.business.update({
      where: { id: businessId },
      data: {
        subscription: {
          update: {
            planId: plan.id
          }
        }
      },
      include: { subscription: { include: { plan: true } } }
    });
  }

  /**
   * Get detail of a specific business for admin
   */
  async getBusinessDetailForAdmin(businessId: number) {
    return prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscription: { include: { plan: true } },
        members: { include: { user: true } },
      },
    });
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

    return businesses.map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      isActive: b.isActive,
      createdAt: b.createdAt,
      plan: b.subscription?.plan.label || "Free",
      subscriptionStatus: b.subscription?.status || "none",
      userCount: b._count.members,
      ownerEmail: b.members[0]?.user.email || "—",
    }));
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
    const filtered = plans.filter(p => CURRENT_PLAN_CODES.includes(p.name as any));
    return filtered.map(p => ({
      ...p,
      maxUsers: getPlanUserLimit(p.name),
      maxProducts: getPlanProductLimit(p.name),
      emailLimit: getPlanEmailLimit(p.name),
      duration: getPlanDuration(p.name),
      badge: getPlanBadge(p.name),
      apiEnabled: hasExternalApi(p.name),
    }));
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
}

export const platformAdminService = new PlatformAdminService();
