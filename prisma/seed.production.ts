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
    description: "Custom branding without DokanDar attribution",
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
    customSmtp: false,
    apiAccess: false,
    webhooks: false,
    whiteLabel: false,
    advancedReports: false,
    multiBranch: false,
    customFields: false,
    automation: false,
    twoFactorAuth: true,
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
    description: "Lifetime free plan for small businesses",
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
      name: { in: ["trial", "basic", "pro", "growth", "professional", "enterprise"] },
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
