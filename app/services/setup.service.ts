import { Prisma } from "@prisma/client";
import { BUSINESS_MEMBER_STATUS } from "@/constants/business-member-status";
import { getAppRuntimeConfig } from "@/lib/config/app-mode";
import { getLicenseStatus } from "@/lib/license";
import { prisma } from "@/lib/prisma";
import { getUpdateStatus } from "@/lib/updates";
import { signToken } from "@/lib/jwt";
import { hashPassword } from "@/lib/password";

export class SetupServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "SetupServiceError";
    this.status = status;
  }
}

export interface SetupStatus {
  isComplete: boolean;
  hasUsers: boolean;
  setupAvailable: boolean;
  setupRequired: boolean;
  appMode: string;
  runtime: ReturnType<typeof getAppRuntimeConfig>;
  license: ReturnType<typeof getLicenseStatus>;
  updates: ReturnType<typeof getUpdateStatus>;
}

export interface CompleteSetupInput {
  businessName?: unknown;
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
}

function buildSetupStatus(explicitlyComplete: boolean, hasUsers: boolean): SetupStatus {
  const runtime = getAppRuntimeConfig();
  const isComplete = explicitlyComplete || hasUsers;

  return {
    isComplete,
    hasUsers,
    setupAvailable: !isComplete,
    setupRequired: runtime.setupRequired,
    appMode: runtime.mode,
    runtime,
    license: getLicenseStatus(),
    updates: getUpdateStatus(),
  };
}

export function getUnavailableSetupStatus(): SetupStatus {
  return buildSetupStatus(false, false);
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const [userCount, completedSetting] = await Promise.all([
    prisma.user.count(),
    prisma.setting.findFirst({
      where: { isSetupComplete: true },
      orderBy: { id: "asc" },
    }),
  ]);

  return buildSetupStatus(Boolean(completedSetting), userCount > 0);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toBusinessSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "business";
}

function toUsername(email: string): string {
  return email.split("@")[0].slice(0, 50) || "admin";
}

function validateSetupInput(input: CompleteSetupInput) {
  const businessName = readString(input.businessName);
  const name = readString(input.name);
  const email = readString(input.email).toLowerCase();
  const password = typeof input.password === "string" ? input.password : "";
  const confirmPassword =
    typeof input.confirmPassword === "string" ? input.confirmPassword : "";

  if (!businessName) {
    throw new SetupServiceError("Business name is required");
  }
  if (!name) {
    throw new SetupServiceError("Full name is required");
  }
  if (!email) {
    throw new SetupServiceError("Email is required");
  }
  if (!isValidEmail(email)) {
    throw new SetupServiceError("Invalid email format");
  }
  if (!password) {
    throw new SetupServiceError("Password is required");
  }
  if (password.length < 8) {
    throw new SetupServiceError("Password must be at least 8 characters");
  }
  if (password !== confirmPassword) {
    throw new SetupServiceError("Passwords do not match");
  }

  return { businessName, name, email, password };
}

export async function completeSetup(input: CompleteSetupInput) {
  const runtime = getAppRuntimeConfig();
  const { businessName, name, email, password } = validateSetupInput(input);
  const hashedPassword = await hashPassword(password);
  const username = toUsername(email);
  const slug = toBusinessSlug(businessName);

  const result = await prisma.$transaction(
    async (tx) => {
      const [
        completedSetting,
        existingSetting,
        userCount,
        founderCount,
        platformAdminCount,
      ] = await Promise.all([
        tx.setting.findFirst({
          where: { isSetupComplete: true },
          orderBy: { id: "asc" },
        }),
        tx.setting.findFirst({ orderBy: { id: "asc" } }),
        tx.user.count(),
        tx.user.count({ where: { isFounder: true } }),
        tx.user.count({ where: { role: { name: "super_admin" } } }),
      ]);

      if (completedSetting) {
        throw new SetupServiceError("Setup already complete", 409);
      }

      if (userCount > 0) {
        throw new SetupServiceError(
          "Setup cannot run because users already exist",
          409
        );
      }

      if (founderCount > 0 || platformAdminCount > 0) {
        throw new SetupServiceError(
          "Founder or platform admin already exists",
          409
        );
      }

      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new SetupServiceError("Email already in use", 409);
      }

      const superAdminRole = await tx.role.findUnique({
        where: { name: "super_admin" },
      });
      if (!superAdminRole) {
        throw new SetupServiceError("Super Admin role not found. Run seed first.", 500);
      }

      const business = await tx.business.upsert({
        where: { slug },
        update: { name: businessName, isActive: true },
        create: {
          name: businessName,
          slug,
          isActive: true,
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          username,
          password: hashedPassword,
          roleId: superAdminRole.id,
          isActive: true,
          isFounder: true,
        },
      });

      await tx.businessMember.create({
        data: {
          userId: user.id,
          businessId: business.id,
          isDefault: true,
          status: BUSINESS_MEMBER_STATUS.ACTIVE,
        },
      });

      await tx.setting.upsert({
        where: { id: existingSetting?.id ?? 1 },
        update: {
          businessId: business.id,
          businessName,
          isSetupComplete: true,
        },
        create: {
          businessId: business.id,
          businessName,
          isSetupComplete: true,
          currency: "BDT",
          brandColor: "#C4973A",
          weekStartDay: 0,
        },
      });

      return { user, business };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  const token = await signToken({
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    role: "super_admin",
    username: result.user.username,
    businessId: result.business.id,
  });

  return {
    token,
    runtime,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: "super_admin",
      businessId: result.business.id,
    },
  };
}
