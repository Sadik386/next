import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getCurrentBusinessId } from "@/lib/business";

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
    some: { businessId, status: "active" },
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
      role: u.role.name,
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
        some: { businessId, status: "active" },
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
  _role?: string,
  _userId?: number,
  businessId = getCurrentBusinessId()
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "Email already in use" };

  const hashedPassword = await hashPassword(data.password);
  const username = data.email.split("@")[0];
  const roleRecord = await prisma.role.findUnique({ where: { name: data.roleName } });
  if (!roleRecord) return { error: "Role not found" };
  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        username,
        password: hashedPassword,
        roleId: roleRecord.id,
      },
      include: { role: true },
    });

    await tx.businessMember.create({
      data: {
        userId: createdUser.id,
        businessId,
        isDefault: true,
        status: "active",
      },
    });

    return createdUser;
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role.name,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export async function changeRole(userId: number, newRoleName: string, _currentRole?: string, requesterId?: number) {
  const businessId = getCurrentBusinessId();
  const roleRecord = await prisma.role.findUnique({ where: { name: newRoleName } });
  if (!roleRecord) return { error: "Role not found" };
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      businessMemberships: {
        some: { businessId, status: "active" },
      },
    },
  });
  if (!user) return { error: "User not found" };

  // Founder protection: User #1 (isFounder) cannot be modified by anyone else
  if (user.isFounder && requesterId !== userId) {
    return { error: "Cannot modify the founder account" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { roleId: roleRecord.id },
  });

  return { success: true };
}

export async function changeStatus(userId: number, isActive: boolean, _currentRole?: string, requesterId?: number) {
  const businessId = getCurrentBusinessId();
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      businessMemberships: {
        some: { businessId, status: "active" },
      },
    },
  });
  if (!user) return { error: "User not found" };

  // Founder protection: User #1 (isFounder) cannot be deactivated by anyone else
  if (user.isFounder && requesterId !== userId) {
    return { error: "Cannot deactivate the founder account" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  return { success: true };
}

export async function getAssignableRoleNames(currentRole: string) {
  const roleHierarchy: Record<string, number> = {
    "Super Admin": 1,
    "Admin": 2,
    "Manager": 3,
    "Staff": 4,
  };
  const currentLevel = roleHierarchy[currentRole] || 99;
  const roles = await prisma.role.findMany({
    where: { id: { gt: currentLevel } },
    orderBy: { id: "asc" },
  });
  return roles.map((r) => r.name);
}
