import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_BUSINESS_NAME = "Accoraze";
const DEFAULT_BUSINESS_SLUG = "accoraze";
const DEFAULT_ADMIN_NAME = "Accoraze Admin";
const DEFAULT_ADMIN_EMAIL = "admin@accoraze.com";
const DEFAULT_ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? "Accoraze@123";
const DEFAULT_BRAND_COLOR = "#C4973A";
const ACTIVE_MEMBER_STATUS = "active";
const ACTIVE_MEMBER_STATUSES = [ACTIVE_MEMBER_STATUS, "ACTIVE"];

const roles = [
  {
    name: "super_admin",
    label: "Super Admin",
    description: "Full system access",
    isSystem: true,
  },
  {
    name: "admin",
    label: "Admin",
    description: "Administrative access",
    isSystem: true,
  },
  {
    name: "manager",
    label: "Manager",
    description: "Manager access",
    isSystem: false,
  },
  {
    name: "store_keeper",
    label: "Store Keeper",
    description: "Inventory and stock access",
    isSystem: false,
  },
  {
    name: "staff",
    label: "Staff",
    description: "Basic staff access",
    isSystem: false,
  },
];

const featureFlags = [
  {
    key: "customSmtp",
    name: "Custom SMTP",
    description: "Allow businesses to configure custom SMTP settings",
    defaultValue: false,
  },
  {
    key: "apiAccess",
    name: "API Access",
    description: "Enable API key generation and access",
    defaultValue: false,
  },
  {
    key: "webhooks",
    name: "Webhooks",
    description: "Enable webhook configuration and events",
    defaultValue: false,
  },
  {
    key: "whiteLabel",
    name: "White Label",
    description: "Custom branding without Accoraze attribution",
    defaultValue: false,
  },
  {
    key: "advancedReports",
    name: "Advanced Reports",
    description: "Enable advanced analytics and reporting features",
    defaultValue: false,
  },
  {
    key: "multiBranch",
    name: "Multi-Branch",
    description: "Support multiple branch management",
    defaultValue: false,
  },
  {
    key: "customFields",
    name: "Custom Fields",
    description: "Enable custom fields for entities",
    defaultValue: false,
  },
  {
    key: "automation",
    name: "Automation",
    description: "Enable workflow automation",
    defaultValue: false,
  },
  {
    key: "twoFactorAuth",
    name: "Two-Factor Authentication",
    description: "Enable 2FA for user accounts",
    defaultValue: false,
  },
  {
    key: "auditLog",
    name: "Audit Log",
    description: "Detailed audit logging for compliance",
    defaultValue: false,
  },
];

const planFeatures = {
  free: {
    customSmtp: false,
    apiAccess: false,
    webhooks: false,
    whiteLabel: false,
    advancedReports: false,
    multiBranch: false,
    customFields: false,
    automation: false,
    twoFactorAuth: false,
    auditLog: false,
  },
  starter: {
    customSmtp: true,
    apiAccess: false,
    webhooks: false,
    whiteLabel: false,
    advancedReports: false,
    multiBranch: false,
    customFields: false,
    automation: false,
    twoFactorAuth: false,
    auditLog: false,
  },
  business: {
    customSmtp: true,
    apiAccess: true,
    webhooks: true,
    whiteLabel: false,
    advancedReports: true,
    multiBranch: false,
    customFields: true,
    automation: true,
    twoFactorAuth: true,
    auditLog: true,
  },
  custom: {
    customSmtp: true,
    apiAccess: true,
    webhooks: true,
    whiteLabel: true,
    advancedReports: true,
    multiBranch: true,
    customFields: true,
    automation: true,
    twoFactorAuth: true,
    auditLog: true,
  },
};

const planUsageLimits = {
  free: {
    ordersCreated: 50,
    salesCreated: 100,
    productsCreated: 30,
    customersCreated: 50,
    suppliersCreated: 20,
    expensesCreated: 20,
    invoicesCreated: 10,
    posSessions: -1,
    apiCalls: 0,
    emailsSent: 100,
    pdfPrintCount: 50,
    storageMb: 100,
  },
  starter: {
    ordersCreated: 200,
    salesCreated: 400,
    productsCreated: 200,
    customersCreated: 200,
    suppliersCreated: 50,
    expensesCreated: 50,
    invoicesCreated: 50,
    posSessions: -1,
    apiCalls: 0,
    emailsSent: 250,
    pdfPrintCount: 250,
    storageMb: 500,
  },
  business: {
    ordersCreated: 500,
    salesCreated: 1000,
    productsCreated: 500,
    customersCreated: 500,
    suppliersCreated: 100,
    expensesCreated: 100,
    invoicesCreated: 100,
    posSessions: -1,
    apiCalls: 2000,
    emailsSent: 1000,
    pdfPrintCount: 1000,
    storageMb: 2000,
  },
  custom: {
    ordersCreated: -1,
    salesCreated: -1,
    productsCreated: -1,
    customersCreated: -1,
    suppliersCreated: -1,
    expensesCreated: -1,
    invoicesCreated: -1,
    posSessions: -1,
    apiCalls: -1,
    emailsSent: -1,
    pdfPrintCount: -1,
    storageMb: -1,
  },
};

const subscriptionPlans = [
  {
    name: "free",
    label: "Free",
    description: "Lifetime free starter plan for small businesses",
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: 1,
    maxProducts: 30,
    features: JSON.stringify(planFeatures.free),
    usageLimits: JSON.stringify(planUsageLimits.free),
    isActive: true,
    isTrial: false,
  },
  {
    name: "starter",
    label: "Starter",
    description: "For small businesses with growing needs and more team access",
    priceMonthly: 990,
    priceYearly: 9900,
    maxUsers: 3,
    maxProducts: 200,
    features: JSON.stringify(planFeatures.starter),
    usageLimits: JSON.stringify(planUsageLimits.starter),
    isActive: true,
    isTrial: false,
  },
  {
    name: "business",
    label: "Business",
    description: "For growing businesses with advanced features, API, and integrations",
    priceMonthly: 2490,
    priceYearly: 24900,
    maxUsers: 10,
    maxProducts: 500,
    features: JSON.stringify(planFeatures.business),
    usageLimits: JSON.stringify(planUsageLimits.business),
    isActive: true,
    isTrial: false,
  },
  {
    name: "custom",
    label: "Custom",
    description: "Custom pricing tailored to your business needs",
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: -1,
    maxProducts: -1,
    features: JSON.stringify(planFeatures.custom),
    usageLimits: JSON.stringify(planUsageLimits.custom),
    isActive: true,
    isTrial: false,
  },
];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function ensureRoles() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        label: role.label,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: role,
    });
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { name: "super_admin" },
  });

  if (!superAdminRole) {
    throw new Error("Failed to seed super_admin role");
  }

  return superAdminRole;
}

async function ensureDefaultBusiness() {
  return prisma.business.upsert({
    where: { slug: DEFAULT_BUSINESS_SLUG },
    update: { name: DEFAULT_BUSINESS_NAME, isActive: true },
    create: {
      name: DEFAULT_BUSINESS_NAME,
      slug: DEFAULT_BUSINESS_SLUG,
      isActive: true,
    },
  });
}

async function getAvailableUsername() {
  const candidates = ["admin", "accoraze", "accoraze_admin"];

  for (const username of candidates) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (!existing) return username;
  }

  return `accoraze_admin_${Date.now()}`;
}

async function ensureDefaultAdminUser(roleId: number) {
  const password = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
  const existing = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN_EMAIL },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: DEFAULT_ADMIN_NAME,
        password,
        roleId,
        isActive: true,
        isFounder: true,
      },
    });
  }

  return prisma.user.create({
    data: {
      name: DEFAULT_ADMIN_NAME,
      username: await getAvailableUsername(),
      email: DEFAULT_ADMIN_EMAIL,
      password,
      roleId,
      isActive: true,
      isFounder: true,
    },
  });
}

async function ensureDefaultBusinessMember(userId: number, businessId: number) {
  await prisma.businessMember.updateMany({
    where: {
      userId,
      businessId: { not: businessId },
      isDefault: true,
    },
    data: { isDefault: false },
  });

  return prisma.businessMember.upsert({
    where: {
      userId_businessId: {
        userId,
        businessId,
      },
    },
    update: { isDefault: true, status: ACTIVE_MEMBER_STATUS },
    create: {
      userId,
      businessId,
      isDefault: true,
      status: ACTIVE_MEMBER_STATUS,
    },
  });
}

async function backfillUserMemberships(businessId: number) {
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  for (const user of users) {
    const activeDefaultMembership = await prisma.businessMember.findFirst({
      where: {
        userId: user.id,
        status: { in: ACTIVE_MEMBER_STATUSES },
        isDefault: true,
        business: { isActive: true },
      },
      select: { id: true },
    });

    if (activeDefaultMembership) continue;

    const activeMembership = await prisma.businessMember.findFirst({
      where: {
        userId: user.id,
        status: { in: ACTIVE_MEMBER_STATUSES },
        business: { isActive: true },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (activeMembership) {
      await prisma.businessMember.update({
        where: { id: activeMembership.id },
        data: { isDefault: true },
      });
      continue;
    }

    await prisma.businessMember.upsert({
      where: {
        userId_businessId: {
          userId: user.id,
          businessId,
        },
      },
      update: { isDefault: true, status: ACTIVE_MEMBER_STATUS },
      create: {
        userId: user.id,
        businessId,
        isDefault: true,
        status: ACTIVE_MEMBER_STATUS,
      },
    });
  }
}

async function ensureDefaultSetting(businessId: number) {
  const existing = await prisma.setting.findUnique({
    where: { businessId },
  });

  if (!existing) {
    return prisma.setting.create({
      data: {
        businessId,
        businessName: DEFAULT_BUSINESS_NAME,
        email: DEFAULT_ADMIN_EMAIL,
        currency: "BDT",
        brandColor: DEFAULT_BRAND_COLOR,
        weekStartDay: 0,
      },
    });
  }

  const updateData: Prisma.SettingUpdateInput = {};
  if (!existing.businessName.trim()) updateData.businessName = DEFAULT_BUSINESS_NAME;
  if (!existing.email) updateData.email = DEFAULT_ADMIN_EMAIL;
  if (!existing.currency.trim()) updateData.currency = "BDT";
  if (!existing.brandColor) updateData.brandColor = DEFAULT_BRAND_COLOR;

  if (Object.keys(updateData).length === 0) return existing;

  return prisma.setting.update({
    where: { businessId },
    data: updateData,
  });
}

async function seedSubscriptionPlans() {
  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  // Deactivate legacy plan names (trial, basic, pro, growth, business old enterprise, professional, enterprise)
  await prisma.subscriptionPlan.updateMany({
    where: {
      name: { in: ["trial", "basic", "pro", "growth", "professional", "enterprise"] },
    },
    data: { isActive: false, isTrial: false },
  });
}

async function ensureDefaultSubscription(businessId: number) {
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { name: "free" },
  });

  if (!freePlan) {
    throw new Error("Failed to seed free subscription plan");
  }

  const now = new Date();
  const currentPeriodEnd = addDays(now, 30);
  const existing = await prisma.subscription.findUnique({
    where: { businessId },
  });

  if (!existing) {
    return prisma.subscription.create({
      data: {
        businessId,
        planId: freePlan.id,
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: now,
        currentPeriodEnd,
      },
    });
  }

  return prisma.subscription.update({
    where: { businessId },
    data: {
      planId: freePlan.id,
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart:
        existing.currentPeriodStart <= now ? existing.currentPeriodStart : now,
      currentPeriodEnd:
        existing.currentPeriodEnd > now ? existing.currentPeriodEnd : currentPeriodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      pausedAt: null,
    },
  });
}

async function seedFeatureFlags() {
  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }
}

async function main() {
  console.log("Seeding...");

  const superAdminRole = await ensureRoles();
  console.log("Roles verified");

  const defaultBusiness = await ensureDefaultBusiness();
  console.log("Default business verified");

  const defaultAdmin = await ensureDefaultAdminUser(superAdminRole.id);
  console.log("Default admin verified");

  await ensureDefaultBusinessMember(defaultAdmin.id, defaultBusiness.id);
  await backfillUserMemberships(defaultBusiness.id);
  console.log("Business memberships verified");

  await ensureDefaultSetting(defaultBusiness.id);
  console.log("Default settings verified");

  await seedSubscriptionPlans();
  await ensureDefaultSubscription(defaultBusiness.id);
  console.log("Subscription data verified");

  await seedFeatureFlags();
  console.log("Feature flags verified");

  console.log("Seeding complete!");
  console.log(`Default admin email: ${DEFAULT_ADMIN_EMAIL}`);
  console.log("Default local dev password: Accoraze@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
