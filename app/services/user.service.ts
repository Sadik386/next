import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getCurrentBusinessId } from "@/lib/business";
import {
  BUSINESS_MEMBER_STATUS,
  activeBusinessMemberStatusWhere,
} from "@/constants/business-member-status";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
} from "@/constants/permissions";
import {
  ROLES,
  canManageBusinessRole,
  isRoleName,
  type RoleName,
} from "@/constants/roles";
import { USAGE_KEYS, PLAN_NAMES } from "@/lib/pricing";
import { guardUserCreation } from "@/lib/subscription-guard";
import { incrementUsageSafely } from "@/lib/usage-service";

type UserMutationActor = {
  id: number;
  role?: string | null;
  businessId: number;
};

type ServiceError = {
  error: string;
  status?: number;
};

type AuthorizedBusinessActor = {
  id: number;
  businessId: number;
  role: RoleName;
  isFounder: boolean;
};

function serviceError(error: string, status = 400): ServiceError {
  return { error, status };
}

function hasRolePermission(role: RoleName, permission: Permission) {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

function serializeRole(role: { id: number; name: string; label: string }) {
  return {
    id: role.id,
    name: role.name as RoleName,
    label: role.label,
  };
}

function serializeUser(user: {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: { id: number; name: string; label: string };
  isActive: boolean;
  isFounder?: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: serializeRole(user.role),
    isActive: user.isActive,
    isFounder: Boolean(user.isFounder),
    createdAt: user.createdAt,
  };
}

async function authorizeBusinessActor(
  actor: UserMutationActor | undefined,
  permission: Permission
): Promise<{ actor: AuthorizedBusinessActor } | ServiceError> {
  if (!actor?.id || !actor.businessId) {
    return serviceError("Forbidden: Business context required.", 403);
  }

  const dbActor = await prisma.user.findFirst({
    where: {
      id: actor.id,
      isActive: true,
      deletedAt: null,
      businessMemberships: {
        some: {
          businessId: actor.businessId,
          status: activeBusinessMemberStatusWhere(),
          business: { isActive: true },
        },
      },
    },
    include: { role: true },
  });

  const actorRole = dbActor?.role.name;
  if (!dbActor || !isRoleName(actorRole)) {
    return serviceError("Forbidden: Insufficient permissions.", 403);
  }

  if (!hasRolePermission(actorRole, permission)) {
    return serviceError("Forbidden: Insufficient permissions.", 403);
  }

  return {
    actor: {
      id: dbActor.id,
      businessId: actor.businessId,
      role: actorRole,
      isFounder: dbActor.isFounder,
    },
  };
}

async function getBusinessUserWithRole(userId: number, businessId: number) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      businessMemberships: {
        some: {
          businessId,
          status: activeBusinessMemberStatusWhere(),
          business: { isActive: true },
        },
      },
    },
    include: { role: true },
  });
}

async function authorizeAssignableRole(
  actor: UserMutationActor | undefined,
  requestedRoleName: string,
  permission: Permission
) {
  const auth = await authorizeBusinessActor(actor, permission);
  if ("error" in auth) return auth;

  if (!isRoleName(requestedRoleName)) {
    return serviceError("Role not found", 400);
  }

  const roleRecord = await prisma.role.findUnique({
    where: { name: requestedRoleName },
  });
  if (!roleRecord) return serviceError("Role not found", 400);

  if (!canManageBusinessRole(auth.actor.role, requestedRoleName)) {
    return serviceError("Forbidden: You cannot assign this role.", 403);
  }

  return { actor: auth.actor, roleRecord, roleName: requestedRoleName };
}

function protectFounderMutation(
  target: { id: number; isFounder: boolean },
  actor: AuthorizedBusinessActor,
  action: string
) {
  if (target.isFounder && target.id !== actor.id) {
    return serviceError(`Cannot ${action} the founder account`, 403);
  }
  return null;
}

// Profile functions
export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) return null;

  const totalLogins = await prisma.activityLog.count({
    where: { userId, action: "login" },
  });

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    dob: user.dob,
    address: user.address,
    role: user.role.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    lastLoginIp: user.lastLoginIp,
    totalLogins,
  };
}

export async function updateProfile(userId: number, data: { name?: string; username?: string; email?: string; phone?: string | null; gender?: string | null; dob?: Date | null; address?: string | null }) {
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, id: { not: userId } },
    });
    if (existing) {
      return { error: "Email already in use" };
    }
  }

  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, id: { not: userId } },
    });
    if (existing) {
      return { error: "Username already in use" };
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      dob: data.dob,
      address: data.address,
    },
    include: { role: true },
  });

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    dob: user.dob,
    address: user.address,
    role: user.role.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updatePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { error: "User not found" };
  }

  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}

// Users functions
export async function getUsers({ search, role, status, page = 1, limit = 20 }: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
  const where: Record<string, unknown> = {};
  const businessId = getCurrentBusinessId();
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (role) where.role = { name: role };
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  where.deletedAt = null;
  where.businessMemberships = {
    some: { businessId, status: activeBusinessMemberStatusWhere() },
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true },
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: items.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: serializeRole(u.role),
      isActive: u.isActive,
      isFounder: u.isFounder,
      createdAt: u.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(id: number) {
  const businessId = getCurrentBusinessId();
  const user = await prisma.user.findFirst({
    where: {
      id,
      businessMemberships: {
        some: { businessId, status: activeBusinessMemberStatusWhere() },
      },
    },
    include: { role: true },
  });
  if (!user || user.deletedAt) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    dob: user.dob,
    address: user.address,
    role: user.role.name,
    roleId: user.roleId,
    isActive: user.isActive,
    isFounder: user.isFounder,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createUser(
  data: { name: string; email: string; password: string; roleName: string },
  actor?: UserMutationActor
) {
  const assignment = await authorizeAssignableRole(
    actor,
    data.roleName,
    PERMISSIONS.CREATE_USER
  );
  if ("error" in assignment) return assignment;

  const businessId = assignment.actor.businessId;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return serviceError("Email already in use", 409);

  const username = data.email.split("@")[0];
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) return serviceError("Username already in use", 409);

  const guard = await guardUserCreation(businessId);
  if (!guard.allowed) {
    return serviceError(guard.reason ?? "User limit reached for your current plan.", 403);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        username,
        password: hashedPassword,
        roleId: assignment.roleRecord.id,
      },
      include: { role: true },
    });

    await tx.businessMember.create({
      data: {
        userId: createdUser.id,
        businessId,
        isDefault: true,
        status: BUSINESS_MEMBER_STATUS.ACTIVE,
      },
    });

    return createdUser;
  });

  await incrementUsageSafely(businessId, USAGE_KEYS.USERS_CREATED);

  return {
    success: true,
    user: serializeUser(user),
  };
}

export async function changeRole(
  userId: number,
  newRoleName: string,
  actor?: UserMutationActor
) {
  const assignment = await authorizeAssignableRole(
    actor,
    newRoleName,
    PERMISSIONS.ASSIGN_ROLE
  );
  if ("error" in assignment) return assignment;

  if (userId === assignment.actor.id) {
    return serviceError("Forbidden: You cannot change your own role.", 403);
  }

  const user = await getBusinessUserWithRole(userId, assignment.actor.businessId);
  if (!user) return serviceError("User not found", 404);

  const founderError = protectFounderMutation(user, assignment.actor, "modify");
  if (founderError) return founderError;

  if (!isRoleName(user.role.name)) {
    return serviceError("Target user has an unsupported role", 403);
  }

  if (!canManageBusinessRole(assignment.actor.role, user.role.name)) {
    return serviceError("Forbidden: You cannot modify this user's role.", 403);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { roleId: assignment.roleRecord.id },
    include: { role: true },
  });

  return { success: true, user: serializeUser(updated) };
}

export async function changeStatus(
  userId: number,
  isActive: boolean,
  actor?: UserMutationActor
) {
  const auth = await authorizeBusinessActor(actor, PERMISSIONS.EDIT_USER);
  if ("error" in auth) return auth;

  if (userId === auth.actor.id) {
    return serviceError("Forbidden: You cannot change your own status.", 403);
  }

  const user = await getBusinessUserWithRole(userId, auth.actor.businessId);
  if (!user) return serviceError("User not found", 404);

  const founderError = protectFounderMutation(user, auth.actor, "change status for");
  if (founderError) return founderError;

  if (!isRoleName(user.role.name)) {
    return serviceError("Target user has an unsupported role", 403);
  }

  if (!canManageBusinessRole(auth.actor.role, user.role.name)) {
    return serviceError("Forbidden: You cannot change this user's status.", 403);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    include: { role: true },
  });

  return { success: true, user: serializeUser(updated) };
}

export async function getAssignableRolesForActor(actor?: UserMutationActor) {
  const auth = await authorizeBusinessActor(actor, PERMISSIONS.ASSIGN_ROLE);
  if ("error" in auth) return auth;

  const roles = await prisma.role.findMany({
    orderBy: { id: "asc" },
  });
  return {
    roles: roles
      .filter((role) => isRoleName(role.name))
      .filter((role) => canManageBusinessRole(auth.actor.role, role.name as RoleName))
      .map(serializeRole),
  };
}

export async function approveRegistrationRequest(
  registrationId: number,
  actor?: UserMutationActor
) {
  const assignment = await authorizeAssignableRole(
    actor,
    ROLES.STAFF,
    PERMISSIONS.CREATE_USER
  );
  if ("error" in assignment) return assignment;

  const registration = await prisma.registrationRequest.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    return serviceError("Registration not found", 404);
  }

  if (registration.status !== "pending") {
    return serviceError("Registration is not pending", 400);
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: registration.email },
        { username: registration.username },
      ],
    },
  });
  if (existingUser) {
    return serviceError("A user with this email or username already exists", 409);
  }

  const guard = await guardUserCreation(assignment.actor.businessId);
  if (!guard.allowed) {
    return serviceError(guard.reason ?? "User limit reached for your current plan.", 403);
  }

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: registration.name,
        username: registration.username,
        email: registration.email,
        phone: registration.phone,
        password: registration.password,
        roleId: assignment.roleRecord.id,
        gender: registration.gender,
        dob: registration.dob,
        address: registration.address,
        isActive: true,
      },
      include: { role: true },
    });

    await tx.businessMember.create({
      data: {
        userId: createdUser.id,
        businessId: assignment.actor.businessId,
        isDefault: true,
        status: BUSINESS_MEMBER_STATUS.ACTIVE,
      },
    });

    await tx.registrationRequest.update({
      where: { id: registrationId },
      data: {
        status: "approved",
        reviewedBy: assignment.actor.id,
        reviewedAt: new Date(),
      },
    });

await tx.activityLog.create({
      data: {
        businessId: assignment.actor.businessId,
        userId: assignment.actor.id,
        action: "approve_registration",
        module: "users",
        entityId: String(createdUser.id),
        entityName: registration.name,
        description: `Approved registration request for ${registration.email} and created user account`,
      },
    });

    const freePlan = await tx.subscriptionPlan.findUnique({
      where: { name: PLAN_NAMES.FREE },
    });
    if (freePlan) {
      const now = new Date();
      const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await tx.subscription.upsert({
        where: { businessId: assignment.actor.businessId },
        update: {
          planId: freePlan.id,
          status: "active",
          billingCycle: "monthly",
          currentPeriodStart: now,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          pausedAt: null,
        },
        create: {
          businessId: assignment.actor.businessId,
          planId: freePlan.id,
          status: "active",
          billingCycle: "monthly",
          currentPeriodStart: now,
          currentPeriodEnd,
        },
      });
    }

    return createdUser;
  });

  await incrementUsageSafely(assignment.actor.businessId, USAGE_KEYS.USERS_CREATED);

  return { success: true, user: serializeUser(user) };
}
