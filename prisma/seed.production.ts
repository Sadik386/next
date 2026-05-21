import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  basic: {
    customSmtp: false,
    apiAccess: true,
    webhooks: false,
    whiteLabel: false,
    advancedReports: false,
    multiBranch: false,
    customFields: false,
    automation: false,
    twoFactorAuth: true,
    auditLog: false,
  },
  pro: {
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
  business: {
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
    ordersCreated: 10,
    salesCreated: 20,
    productsCreated: 50,
    customersCreated: 10,
    suppliersCreated: 5,
    expensesCreated: 5,
    invoicesCreated: 5,
    posSessions: -1,
    apiCalls: 50,
    storageMb: 50,
  },
  basic: {
    ordersCreated: 100,
    salesCreated: 200,
    productsCreated: 500,
    customersCreated: 100,
    suppliersCreated: 50,
    expensesCreated: 50,
    invoicesCreated: 50,
    posSessions: -1,
    apiCalls: 500,
    storageMb: 500,
  },
  pro: {
    ordersCreated: 500,
    salesCreated: 1000,
    productsCreated: 2000,
    customersCreated: 500,
    suppliersCreated: 200,
    expensesCreated: 200,
    invoicesCreated: 200,
    posSessions: -1,
    apiCalls: 2000,
    storageMb: 2000,
  },
  business: {
    ordersCreated: -1,
    salesCreated: -1,
    productsCreated: -1,
    customersCreated: -1,
    suppliersCreated: -1,
    expensesCreated: -1,
    invoicesCreated: -1,
    posSessions: -1,
    apiCalls: -1,
    storageMb: -1,
  },
};

const subscriptionPlans = [
  {
    name: "free",
    label: "Free",
    description: "Free tier for local testing and evaluation",
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: 1,
    maxProducts: 50,
    features: JSON.stringify(planFeatures.free),
    usageLimits: JSON.stringify(planUsageLimits.free),
    isActive: true,
    isTrial: false,
  },
  {
    name: "basic",
    label: "Basic",
    description: "For small businesses getting started",
    priceMonthly: 990,
    priceYearly: 9900,
    maxUsers: 3,
    maxProducts: 500,
    features: JSON.stringify(planFeatures.basic),
    usageLimits: JSON.stringify(planUsageLimits.basic),
    isActive: true,
    isTrial: false,
  },
  {
    name: "pro",
    label: "Pro",
    description: "For growing businesses",
    priceMonthly: 2490,
    priceYearly: 24900,
    maxUsers: 10,
    maxProducts: 2000,
    features: JSON.stringify(planFeatures.pro),
    usageLimits: JSON.stringify(planUsageLimits.pro),
    isActive: true,
    isTrial: false,
  },
  {
    name: "business",
    label: "Business",
    description: "For larger teams and higher volume",
    priceMonthly: 4990,
    priceYearly: 49900,
    maxUsers: -1,
    maxProducts: -1,
    features: JSON.stringify(planFeatures.business),
    usageLimits: JSON.stringify(planUsageLimits.business),
    isActive: true,
    isTrial: false,
  },
];

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
}

async function seedSubscriptionPlans() {
  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  await prisma.subscriptionPlan.updateMany({
    where: {
      name: { in: ["starter", "professional", "enterprise", "trial"] },
    },
    data: { isActive: false, isTrial: false },
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
  console.log("Production seed starting...");

  await ensureRoles();
  await seedSubscriptionPlans();
  await seedFeatureFlags();

  console.log("Production seed complete");
  console.log("No production admin user was created.");
  console.log("Create the founder account through the first-run setup wizard.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
