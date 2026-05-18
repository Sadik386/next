import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { ROLE_HIERARCHY, RoleName } from "@/constants/roles";
import { getCurrentBusinessId } from "@/lib/business";

export type NotificationType =
  | "new_order"
  | "low_stock"
  | "out_of_stock"
  | "delete_request"
  | "order_cancelled";

export interface NotificationFilters {
  status?: "all" | "unread" | "read";
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export interface CreateNotificationInput {
  userId?: number | null;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string | null;
}

const ADMIN_BROADCAST_TYPES = [
  "new_order",
  "low_stock",
  "out_of_stock",
  "order_cancelled",
];

function getAllowedBroadcastTypes(role: RoleName): string[] {
  const allowed: string[] = [];
  if (hasPermission(role, PERMISSIONS.APPROVE_DELETE_REQUEST)) {
    allowed.push("delete_request");
  }
  if ((ROLE_HIERARCHY[role] ?? 0) >= 80) {
    allowed.push(...ADMIN_BROADCAST_TYPES);
  }
  return allowed;
}

function visibleWhere(userId: number, role: RoleName): Prisma.NotificationWhereInput {
  const allowed = getAllowedBroadcastTypes(role);
  const businessId = getCurrentBusinessId();
  return {
    businessId,
    isRead: false, // Only show non-archived notifications
    OR: [
      { userId },
      { userId: null, type: { in: allowed } },
    ],
  };
}

export async function createNotification(data: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        businessId: getCurrentBusinessId(),
        userId: data.userId ?? null,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link ?? null,
      },
    });
  } catch (err) {
    console.error("createNotification failed:", err);
    return null;
  }
}

type RawNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: Date;
  reads: { id: number }[];
};

function shape(n: RawNotification) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    createdAt: n.createdAt,
    isRead: n.reads.length > 0,
  };
}

export async function getNotifications(
  userId: number,
  role: RoleName,
  filters: NotificationFilters = {}
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.NotificationWhereInput = {
    ...visibleWhere(userId, role),
  };
  if (filters.status === "unread") {
    where.reads = { none: { userId } };
  } else if (filters.status === "read") {
    where.reads = { some: { userId } };
  }
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) (where.createdAt as any).gte = filters.from;
    if (filters.to) (where.createdAt as any).lte = filters.to;
  }

  const [rows, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { reads: { where: { userId }, select: { id: true } } },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items: rows.map(shape),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getRecentNotifications(userId: number, role: RoleName, limit = 5) {
  const rows = await prisma.notification.findMany({
    where: visibleWhere(userId, role),
    orderBy: { createdAt: "desc" },
    include: { reads: { where: { userId }, select: { id: true } } },
    take: limit,
  });
  return rows.map(shape);
}

export async function markAsRead(id: number, userId: number, role: RoleName) {
  const notif = await prisma.notification.findFirst({
    where: { id, ...visibleWhere(userId, role) },
  });
  if (!notif) return null;
  await prisma.notificationRead.upsert({
    where: { notificationId_userId: { notificationId: id, userId } },
    create: { notificationId: id, userId, businessId: getCurrentBusinessId() },
    update: {},
  });
  return notif;
}

export async function markAllAsRead(userId: number, role: RoleName) {
  const unread = await prisma.notification.findMany({
    where: {
      ...visibleWhere(userId, role),
      reads: { none: { userId } },
    },
    select: { id: true },
  });
  if (unread.length === 0) return { count: 0 };
  const businessId = getCurrentBusinessId();
  await prisma.notificationRead.createMany({
    data: unread.map((n) => ({ notificationId: n.id, userId, businessId })),
    skipDuplicates: true,
  });
  return { count: unread.length };
}

export async function getUnreadCount(userId: number, role: RoleName) {
  return prisma.notification.count({
    where: {
      ...visibleWhere(userId, role),
      reads: { none: { userId } },
    },
  });
}
