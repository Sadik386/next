import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "./activity-log.service";

export interface DeleteRequestFilters {
  status?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
}

export async function getDeleteRequests(filters: DeleteRequestFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.DeleteRequestWhereInput = {};
  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  const [items, total] = await Promise.all([
    prisma.deleteRequest.findMany({
      where,
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.deleteRequest.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function approveDeleteRequest(id: number, reviewerId: number) {
  const request = await prisma.deleteRequest.findUnique({
    where: { id },
    include: { requester: true },
  });

  if (!request) return { error: "Delete request not found" };
  if (request.status !== "pending") return { error: "Request is already processed" };

  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    // 1. Update the request status
    const updatedRequest = await tx.deleteRequest.update({
      where: { id },
      data: {
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: now,
      },
    });

    // 2. Actually soft-delete the entity
    const entityId = Number(request.entityId);
    let deletedEntity: any = null;

    switch (request.entityType.toLowerCase()) {
      case "order":
        deletedEntity = await tx.order.update({
          where: { id: entityId },
          data: { deletedAt: now },
        });
        break;
      case "product":
        deletedEntity = await tx.product.update({
          where: { id: entityId },
          data: { deletedAt: now },
        });
        break;
      case "customer":
        deletedEntity = await tx.customer.update({
          where: { id: entityId },
          data: { deletedAt: now },
        });
        break;
      case "supplier":
        deletedEntity = await tx.supplier.update({
          where: { id: entityId },
          data: { deletedAt: now },
        });
        break;
      case "sale":
        deletedEntity = await tx.sale.update({
          where: { id: entityId },
          data: { deletedAt: now },
        });
        break;
      case "expense":
        deletedEntity = await tx.expense.update({
          where: { id: entityId },
          data: { deletedAt: now },
        });
        break;
      default:
        throw new Error(`Unsupported entity type: ${request.entityType}`);
    }

    // 3. Log the action
    await createLog({
      userId: reviewerId,
      action: "approved",
      module: "delete_request",
      entityId: request.entityId,
      entityName: request.entityName,
      description: `Approved delete request for ${request.entityType}: ${request.entityName}`,
      metadata: { requestId: id, requesterId: request.requestedBy },
    });

    return { request: updatedRequest, entity: deletedEntity };
  });
}

export async function rejectDeleteRequest(id: number, reviewerId: number) {
  const request = await prisma.deleteRequest.findUnique({
    where: { id },
  });

  if (!request) return { error: "Delete request not found" };
  if (request.status !== "pending") return { error: "Request is already processed" };

  const updatedRequest = await prisma.deleteRequest.update({
    where: { id },
    data: {
      status: "rejected",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  });

  await createLog({
    userId: reviewerId,
    action: "rejected",
    module: "delete_request",
    entityId: request.entityId,
    entityName: request.entityName,
    description: `Rejected delete request for ${request.entityType}: ${request.entityName}`,
    metadata: { requestId: id, requesterId: request.requestedBy },
  });

  return { request: updatedRequest };
}
