import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/password";
import { RoleName, ROLES, canManageRole } from "@/constants/roles";
import { createLog } from "@/services/activity-log.service";

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleName: RoleName;
}

const userInclude = { role: true } as const;

export async function getUsers(filters: UserFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } },
    ];
  }
  if (filters.role) {
    where.role = { name: filters.role };
  }
  if (filters.status === "active") where.isActive = true;
  if (filters.status === "inactive") where.isActive = false;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userInclude,
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: items.map(stripPassword),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: userInclude,
  });
  return user ? stripPassword(user) : null;
}

export async function createUser(
  data: CreateUserInput,
  actorRole: RoleName,
  actorId: number
) {
  if (actorRole !== ROLES.SUPER_ADMIN && actorRole !== ROLES.ADMIN) {
    return { error: "You are not authorized to create users" };
  }

  if (!canManageRole(actorRole, data.roleName)) {
    return { error: "You cannot assign this role" };
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "A user with this email already exists" };

  if (!data.password || data.password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const role = await prisma.role.findUnique({ where: { name: data.roleName } });
  if (!role) return { error: "Invalid role" };

  const hashed = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      roleId: role.id,
      isActive: true,
    },
    include: userInclude,
  });

  await createLog({
    userId: actorId,
    action: "create",
    module: "user",
    entityId: String(user.id),
    entityName: user.name,
    description: `Created user ${user.name} with role ${role.name}`,
    metadata: { name: user.name, email: user.email, role: role.name },
  });

  return { user: stripPassword(user) };
}

export async function changeRole(
  userId: number,
  newRoleName: RoleName,
  actorRole: RoleName,
  actorId: number
) {
  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: userInclude,
  });
  if (!target) return { error: "User not found" };

  if (target.role.name === ROLES.SUPER_ADMIN) {
    return { error: "Super Admin role cannot be changed" };
  }
  if (!canManageRole(actorRole, target.role.name as RoleName)) {
    return { error: "You cannot manage this user" };
  }
  if (!canManageRole(actorRole, newRoleName)) {
    return { error: "You cannot assign this role" };
  }

  const role = await prisma.role.findUnique({ where: { name: newRoleName } });
  if (!role) return { error: "Invalid role" };

  const previousRole = target.role.name;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { roleId: role.id },
    include: userInclude,
  });

  await createLog({
    userId: actorId,
    action: "change_role",
    module: "user",
    entityId: String(userId),
    entityName: target.name,
    description: `Changed role of ${target.name} from ${previousRole} to ${newRoleName}`,
    metadata: { previousRole, newRole: newRoleName },
  });

  return { user: stripPassword(updated) };
}

export async function changeStatus(
  userId: number,
  isActive: boolean,
  actorRole: RoleName,
  actorId: number
) {
  if (userId === actorId) {
    return { error: "You cannot change your own status" };
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: userInclude,
  });
  if (!target) return { error: "User not found" };

  if (target.role.name === ROLES.SUPER_ADMIN) {
    return { error: "Super Admin cannot be deactivated" };
  }
  if (!canManageRole(actorRole, target.role.name as RoleName)) {
    return { error: "You cannot manage this user" };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    include: userInclude,
  });

  await createLog({
    userId: actorId,
    action: isActive ? "activate" : "deactivate",
    module: "user",
    entityId: String(userId),
    entityName: target.name,
    description: `${isActive ? "Activated" : "Deactivated"} user ${target.name}`,
    metadata: { name: target.name, email: target.email },
  });

  return { user: stripPassword(updated) };
}

export async function getAssignableRoleNames(actorRole: RoleName) {
  const allRoles = await prisma.role.findMany({ orderBy: { id: "asc" } });
  return allRoles
    .filter((r) => canManageRole(actorRole, r.name as RoleName))
    .map((r) => ({ id: r.id, name: r.name as RoleName, label: r.label }));
}

type UserWithRole = Prisma.UserGetPayload<{ include: typeof userInclude }>;

function stripPassword(user: UserWithRole) {
  const { password: _password, ...rest } = user;
  void _password;
  return rest;
}
