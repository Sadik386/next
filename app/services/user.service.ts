import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getCurrentBusinessId } from "@/lib/business";
import {
  BUSINESS_MEMBER_STATUS,
  activeBusinessMemberStatusWhere,
  pendingBusinessMemberStatusWhere,
  deactivatedBusinessMemberStatusWhere,
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
import { createLog } from "@/services/activity-log.service";

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

  const dbActor = await prisma.businessMember.findFirst({
    where: {
      userId: actor.id,
      businessId: actor.businessId,
      status: activeBusinessMemberStatusWhere(),
      business: { isActive: true },
    },
    include: {
      user: true,
      role: true,
    },
  });

  if (!dbActor) {
    return serviceError("Forbidden: Insufficient permissions.", 403);
  }

  const actorRole = dbActor.role.name;
  if (!isRoleName(actorRole)) {
    return serviceError("Forbidden: Insufficient permissions.", 403);
  }

  if (!hasRolePermission(actorRole, permission)) {
    return serviceError("Forbidden: Insufficient permissions.", 403);
  }

  return {
    actor: {
      id: dbActor.userId,
      businessId: actor.businessId,
      role: actorRole,
      isFounder: dbActor.user.isFounder,
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
  const businessId = getCurrentBusinessId();

  const membershipWhere: Record<string, unknown> = {
    businessId,
  };
  if (role) membershipWhere.role = { name: role };

  if (status === "active") {
    membershipWhere.status = activeBusinessMemberStatusWhere();
  } else if (status === "pending") {
    membershipWhere.status = pendingBusinessMemberStatusWhere();
  } else if (status === "deactivated") {
    membershipWhere.status = deactivatedBusinessMemberStatusWhere();
  } else {
    membershipWhere.status = { in: [BUSINESS_MEMBER_STATUS.ACTIVE, BUSINESS_MEMBER_STATUS.PENDING] };
  }

  const userWhere: Record<string, unknown> = {
    deletedAt: null,
  };
  if (status === "inactive") userWhere.isActive = false;
  if (search) {
    userWhere.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.businessMember.findMany({
      where: {
        ...membershipWhere,
        user: userWhere,
      },
      include: {
        user: { include: { role: true } },
        role: true,
      },
      orderBy: { userId: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.businessMember.count({
      where: {
        ...membershipWhere,
        user: userWhere,
      },
    }),
  ]);

  return {
    items: items.map((bm) => ({
      id: bm.user.id,
      name: bm.user.name,
      email: bm.user.email,
      phone: bm.user.phone,
      role: serializeRole(bm.role),
      roleId: bm.role.id,
      isActive: bm.user.isActive,
      isFounder: bm.user.isFounder,
      createdAt: bm.user.createdAt,
      membershipStatus: bm.status as string,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(id: number) {
  const businessId = getCurrentBusinessId();
  const bm = await prisma.businessMember.findFirst({
    where: {
      userId: id,
      businessId,
      status: activeBusinessMemberStatusWhere(),
    },
    include: {
      user: { include: { role: true } },
      role: true,
    },
  });
  if (!bm || bm.user.deletedAt) return null;
  const user = bm.user;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    dob: user.dob,
    address: user.address,
    role: bm.role.name,
    roleId: bm.role.id,
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

  if (data.roleName === ROLES.SUPER_ADMIN) {
    return serviceError("Cannot assign Super Admin role through this flow. Contact platform administrator.", 403);
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });

  if (existing) {
    return serviceError(
      "This email already belongs to an existing user. Use 'Invite User' to add them to this business.",
      409
    );
  }

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
        isActive: true,
      },
    });

    await tx.businessMember.create({
      data: {
        userId: createdUser.id,
        businessId,
        roleId: assignment.roleRecord.id,
        isDefault: true,
        status: BUSINESS_MEMBER_STATUS.PENDING,
      },
    });

    return createdUser;
  });

  await incrementUsageSafely(businessId, USAGE_KEYS.USERS_CREATED);

  const withRole = await prisma.user.findUnique({
    where: { id: user.id },
    include: { role: true },
  });

  return {
    success: true,
    existingUser: false,
    user: serializeUser(withRole!),
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

  const user = await prisma.businessMember.findFirst({
    where: {
      userId,
      businessId: assignment.actor.businessId,
      status: activeBusinessMemberStatusWhere(),
      business: { isActive: true },
    },
    include: { user: { include: { role: true } }, role: true },
  });
  if (!user) return serviceError("User not found", 404);

  const founderError = protectFounderMutation(user.user, assignment.actor, "modify");
  if (founderError) return founderError;

  if (!isRoleName(user.role.name)) {
    return serviceError("Target user has an unsupported role", 403);
  }

  if (!canManageBusinessRole(assignment.actor.role, user.role.name)) {
    return serviceError("Forbidden: You cannot modify this user's role.", 403);
  }

  const updated = await prisma.businessMember.update({
    where: { id: user.id },
    data: { roleId: assignment.roleRecord.id },
    include: { user: { include: { role: true } }, role: true },
  });

  return {
    success: true,
    user: {
      id: updated.user.id,
      name: updated.user.name,
      email: updated.user.email,
      phone: updated.user.phone ?? null,
      role: serializeRole(updated.role),
      isActive: updated.user.isActive,
      isFounder: Boolean(updated.user.isFounder),
      createdAt: updated.user.createdAt,
    },
  };
}

async function getMembershipWithUser(membershipId: number) {
  return prisma.businessMember.findUnique({
    where: { id: membershipId },
    include: { user: { include: { role: true } }, role: true },
  });
}

export async function inviteUser(
  data: { email: string; roleName: string },
  actor?: UserMutationActor
) {
  const assignment = await authorizeAssignableRole(
    actor,
    data.roleName,
    PERMISSIONS.CREATE_USER
  );
  if ("error" in assignment) return assignment;

  const businessId = assignment.actor.businessId;

  if (data.roleName === ROLES.SUPER_ADMIN) {
    return serviceError("Cannot invite as Super Admin. Contact platform administrator.", 403);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    include: { role: true },
  });

  if (!existingUser) {
    return serviceError(
      "This email is not registered. Use 'Create New User' instead.",
      404
    );
  }

  if (existingUser.deletedAt) {
    return serviceError("This account has been deleted.", 400);
  }

  const existingMembership = await prisma.businessMember.findFirst({
    where: {
      userId: existingUser.id,
      businessId,
      status: { in: [BUSINESS_MEMBER_STATUS.ACTIVE, BUSINESS_MEMBER_STATUS.PENDING] },
    },
  });
  if (existingMembership) {
    return serviceError("This user is already a member of this business.", 409);
  }

  await prisma.businessMember.create({
    data: {
      userId: existingUser.id,
      businessId,
      roleId: assignment.roleRecord.id,
      isDefault: true,
      status: BUSINESS_MEMBER_STATUS.PENDING,
    },
  });

  return {
    success: true,
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: serializeRole(assignment.roleRecord),
      createdAt: existingUser.createdAt,
    },
  };
}

export async function acceptInvite(
  userId: number,
  businessId: number,
  actorId: number
) {
  if (userId !== actorId) {
    return serviceError("Forbidden: Can only accept your own invite.", 403);
  }

  const membership = await prisma.businessMember.findFirst({
    where: {
      userId,
      businessId,
      status: BUSINESS_MEMBER_STATUS.PENDING,
    },
  });

  if (!membership) {
    return serviceError("Invite not found or already accepted.", 404);
  }

  await prisma.businessMember.update({
    where: { id: membership.id },
    data: { status: BUSINESS_MEMBER_STATUS.ACTIVE },
  });

  return { success: true };
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

  const membership = await prisma.businessMember.findFirst({
    where: {
      userId,
      businessId: auth.actor.businessId,
      status: activeBusinessMemberStatusWhere(),
      business: { isActive: true },
    },
    include: { user: { include: { role: true } }, role: true },
  });
  if (!membership) return serviceError("User not found", 404);

  const founderError = protectFounderMutation(membership.user, auth.actor, "change status for");
  if (founderError) return founderError;

  if (!isRoleName(membership.role.name)) {
    return serviceError("Target user has an unsupported role", 403);
  }

  if (!canManageBusinessRole(auth.actor.role, membership.role.name)) {
    return serviceError("Forbidden: You cannot change this user's status.", 403);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    include: { role: true },
  });

  return { success: true, user: serializeUser(updated) };
}

export async function deactivateBusinessMember(
  userId: number,
  actor?: UserMutationActor
) {
  const auth = await authorizeBusinessActor(actor, PERMISSIONS.EDIT_USER);
  if ("error" in auth) return auth;

  if (userId === auth.actor.id) {
    return serviceError("Forbidden: You cannot remove yourself from this business.", 403);
  }

  const membership = await prisma.businessMember.findFirst({
    where: {
      userId,
      businessId: auth.actor.businessId,
      status: activeBusinessMemberStatusWhere(),
      business: { isActive: true },
    },
    include: { user: { include: { role: true } }, role: true, business: true },
  });
  if (!membership) return serviceError("User not found", 404);

  if (!isRoleName(membership.role.name)) {
    return serviceError("Target user has an unsupported role", 403);
  }

  if (!canManageBusinessRole(auth.actor.role, membership.role.name)) {
    return serviceError("Forbidden: You cannot remove this user from this business.", 403);
  }

  if (membership.role.name === ROLES.SUPER_ADMIN) {
    const activeSuperAdminCount = await prisma.businessMember.count({
      where: {
        businessId: auth.actor.businessId,
        status: activeBusinessMemberStatusWhere(),
        role: { name: ROLES.SUPER_ADMIN },
      },
    });
    if (activeSuperAdminCount <= 1) {
      return serviceError("Cannot remove the last Super Admin from this business.", 400);
    }
  }

  const updated = await prisma.businessMember.update({
    where: { id: membership.id },
    data: { status: BUSINESS_MEMBER_STATUS.DEACTIVATED },
    include: { user: { include: { role: true } }, role: true },
  });

  await createLog({
    userId: auth.actor.id,
    businessId: auth.actor.businessId,
    action: "deactivate_business_member",
    module: "user",
    entityId: String(userId),
    entityName: membership.user.name,
    description: `Removed ${membership.user.name} (${membership.user.email}) from business "${membership.business.name}" with role ${membership.role.label}`,
    metadata: {
      targetUserId: userId,
      targetUserEmail: membership.user.email,
      targetRole: membership.role.name,
      previousStatus: "active",
      newStatus: BUSINESS_MEMBER_STATUS.DEACTIVATED,
    },
  });

  return {
    success: true,
    user: {
      id: updated.user.id,
      name: updated.user.name,
      email: updated.user.email,
      phone: updated.user.phone ?? null,
      role: serializeRole(updated.role),
      isActive: updated.user.isActive,
      isFounder: Boolean(updated.user.isFounder),
      createdAt: updated.user.createdAt,
      membershipStatus: updated.status,
    },
  };
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
    });

    await tx.businessMember.create({
      data: {
        userId: createdUser.id,
        businessId: assignment.actor.businessId,
        roleId: assignment.roleRecord.id,
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

  const withRole = await prisma.user.findUnique({
    where: { id: user.id },
    include: { role: true },
  });

  return { success: true, user: serializeUser(withRole!) };
}
