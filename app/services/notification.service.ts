import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type NotificationType =
  | "new_order"
  | "low_stock"
  | "out_of_stock"
  | "delete_request"
  | "order_cancelled";

export interface NotificationFilters {
  status?: "all" | "unread" | "read";
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

export async function createNotification(data: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
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

export async function getNotifications(userId: number, filters: NotificationFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.NotificationWhereInput = {
    OR: [{ userId }, { userId: null }],
  };
  if (filters.status === "unread") where.isRead = false;
  if (filters.status === "read") where.isRead = true;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getRecentNotifications(userId: number, limit = 5) {
  return prisma.notification.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markAsRead(id: number, userId: number) {
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) return null;
  if (notif.userId !== null && notif.userId !== userId) return null;
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: number) {
  return prisma.notification.updateMany({
    where: {
      OR: [{ userId }, { userId: null }],
      isRead: false,
    },
    data: { isRead: true },
  });
}

export async function getUnreadCount(userId: number) {
  return prisma.notification.count({
    where: {
      OR: [{ userId }, { userId: null }],
      isRead: false,
    },
  });
}
