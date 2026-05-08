import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ActivityLogFilters {
  module?: string;
  action?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateLogInput {
  userId: number;
  action: string;
  module: string;
  entityId?: string;
  entityName?: string;
  description: string;
  metadata?: any;
}

export async function getActivityLogs(filters: ActivityLogFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ActivityLogWhereInput = {};

  if (filters.module) {
    where.module = filters.module;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.search) {
    where.description = { contains: filters.search };
  }

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createLog(data: CreateLogInput) {
  return prisma.activityLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      module: data.module,
      entityId: data.entityId,
      entityName: data.entityName,
      description: data.description,
      metadata: data.metadata || Prisma.JsonNull,
    },
  });
}
