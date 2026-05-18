import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentBusinessId } from "@/lib/business";

export interface ActivityLogFilters {
  module?: string;
  action?: string;
  search?: string;
  ipAddress?: string;
  from?: Date;
  to?: Date;
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
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
  businessId?: number; // Add optional businessId
}

export async function getActivityLogs(filters: ActivityLogFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  // This function is for retrieving logs, so it should still require a business context.
  // The login route will bypass this by directly calling createLog with an explicit businessId.
  const businessId = getCurrentBusinessId();
  if (businessId === null) {
      throw new Error("Active business context is required to get activity logs.");
  }

  const where: Prisma.ActivityLogWhereInput = {
    businessId: businessId,
  };

  if (filters.module) {
    where.module = filters.module;
  }

  if (filters.action) {
    if (filters.action.includes(",")) {
      where.action = { in: filters.action.split(",").map(a => a.trim()) };
    } else {
      where.action = filters.action;
    }
  }

  if (filters.search) {
    where.description = { contains: filters.search };
  }

  if (filters.ipAddress) {
    where.ipAddress = { contains: filters.ipAddress };
  }

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) (where.createdAt as any).gte = filters.from;
    if (filters.to) (where.createdAt as any).lte = filters.to;
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
  // Use the provided businessId if available, otherwise fall back to the current request context's businessId.
  const businessId = data.businessId ?? getCurrentBusinessId();

  // If no businessId is found from either source, throw an error.
  // This prevents logs from being created without a business context, preserving tenant security.
  if (businessId === null) {
    // For the login route, we explicitly pass the businessId from the login result.
    // If it's still null here, it means the login itself failed to provide a business context, which is a critical issue.
    // We should log this error and return gracefully, perhaps with a 500 or specific error message.
    // However, based on the task, the login route will provide it, so this fallback should rarely be hit for login.
    // For other parts of the app, it will continue to enforce context.
    console.error("Attempted to create log without a business context or explicit businessId.");
    // Re-throwing will cause a 500 error, which is consistent with the original problem statement for unexpected errors.
    throw new Error("Active business context is required for activity logging.");
  }

  return prisma.activityLog.create({
    data: {
      businessId: businessId,
      userId: data.userId,
      action: data.action,
      module: data.module,
      entityId: data.entityId,
      entityName: data.entityName,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata || Prisma.JsonNull,
    },
  });
}

