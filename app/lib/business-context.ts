import { AsyncLocalStorage } from "async_hooks";
import { activeBusinessMemberStatusWhere } from "@/constants/business-member-status";
import type { JWTPayload } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export interface BusinessContext {
  businessId: number;
  user: JWTPayload | null;
  userId: number | null;
  role: string | null;
  source: "jwt" | "default_membership" | "membership";
}

export interface BusinessContextUser {
  id: number;
  businessId?: number;
  role?: string;
  name?: string;
  email?: string;
  username?: string;
}

export class BusinessContextError extends Error {
  constructor(message = "No active business membership found") {
    super(message);
    this.name = "BusinessContextError";
  }
}

const storage = new AsyncLocalStorage<BusinessContext>();

function normalizeBusinessId(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toJwtPayload(user: BusinessContextUser, businessId: number): JWTPayload | null {
  if (!user.email || !user.name || !user.role) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    username: user.username,
    businessId,
  };
}

export async function resolveBusinessContextForUser(
  user: BusinessContextUser
): Promise<BusinessContext> {
  const requestedBusinessId = normalizeBusinessId(user.businessId);

  const membershipWhere = {
    userId: user.id,
    status: activeBusinessMemberStatusWhere(),
    business: { isActive: true },
  };

  const requestedMembership = requestedBusinessId
    ? await prisma.businessMember.findFirst({
        where: {
          ...membershipWhere,
          businessId: requestedBusinessId,
        },
        select: { businessId: true, isDefault: true, role: { select: { id: true, name: true, label: true } } },
      })
    : null;

  if (requestedBusinessId && !requestedMembership) {
    throw new BusinessContextError("User does not have access to this business");
  }

  const membership =
    requestedMembership ??
    (await prisma.businessMember.findFirst({
      where: {
        ...membershipWhere,
        isDefault: true,
      },
      orderBy: { createdAt: "asc" },
      select: { businessId: true, isDefault: true, role: { select: { id: true, name: true, label: true } } },
    })) ??
    (await prisma.businessMember.findFirst({
      where: membershipWhere,
      orderBy: [{ createdAt: "asc" }],
      select: { businessId: true, isDefault: true, role: { select: { id: true, name: true, label: true } } },
    }));

  if (!membership) {
    throw new BusinessContextError();
  }

  const businessRole = membership.role;
  const resolvedRole = businessRole?.name ?? user.role ?? null;
  const jwtPayload = toJwtPayload({ ...user, role: resolvedRole }, membership.businessId);

  return {
    businessId: membership.businessId,
    user: jwtPayload,
    userId: user.id,
    role: resolvedRole,
    source: requestedMembership
      ? "jwt"
      : membership.isDefault
        ? "default_membership"
        : "membership",
  };
}

export function setActiveBusinessContext(context: BusinessContext) {
  storage.enterWith(context);
  return context;
}

export async function setActiveBusinessContextForUser(user: BusinessContextUser) {
  return setActiveBusinessContext(await resolveBusinessContextForUser(user));
}

export function getActiveBusinessContext() {
  const context = storage.getStore();
  if (!context) {
    throw new BusinessContextError("Active business context is required");
  }
  return context;
}

export function getActiveBusinessId() {
  return getActiveBusinessContext().businessId;
}

// --- New helper functions for context management ---

export interface AuthenticatedUser extends BusinessContextUser {
    businessId: number;
    role: string; // Ensure role is present from JWT payload
}

// Helper to create the BusinessContext from the authenticated user object
function createBusinessContextFromUser(user: AuthenticatedUser): BusinessContext {
    return {
        businessId: user.businessId,
        userId: user.id,
        user: {
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            role: user.role,
            username: user.username,
            businessId: user.businessId,
        } as JWTPayload, // Cast to JWTPayload, assuming compatibility
        role: user.role,
        source: "jwt",
    };
}

// Wrapper function to ensure context is set before handler execution
export async function runWithBusinessContext<T>(
    user: AuthenticatedUser,
    handler: () => Promise<T>
): Promise<T> {
    const context = createBusinessContextFromUser(user);
    // storage.run ensures the context is entered and automatically exited.
    return storage.run(context, handler);
}
