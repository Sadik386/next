import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { RoleName } from "@/constants/roles";

// Profile functions
export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) return null;

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
      createdAt: u.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createUser(data: { name: string; email: string; password: string; roleId: number; phone?: string; gender?: string; username?: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "Email already in use" };

  const hashedPassword = await hashPassword(data.password);
  const username = data.username || data.email.split("@")[0];
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      username,
      password: hashedPassword,
      roleId: data.roleId,
      phone: data.phone,
      gender: data.gender,
    },
    include: { role: true },
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

export async function changeRole(userId: number, newRoleId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  await prisma.user.update({
    where: { id: userId },
    data: { roleId: newRoleId },
  });

  return { success: true };
}

export async function changeStatus(userId: number, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

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