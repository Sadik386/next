import { prisma } from "@/lib/prisma";
import { getBusinessSubscription } from "@/lib/usage-service";
import { normalizePlanCode, PLAN_NAMES } from "@/lib/pricing";

export type SubscriptionRequestStatus = "pending" | "in_review" | "contacted" | "approved" | "rejected" | "resolved";
export type SubscriptionRequestType = "upgrade" | "sales" | "support" | "custom_plan" | "billing" | "consultation";

export interface CreateSubscriptionRequestParams {
  businessId: number;
  userId: number;
  type: SubscriptionRequestType;
  requestedPlan?: string;
  reason?: string;
  message?: string;
}

export async function createSubscriptionRequest(params: CreateSubscriptionRequestParams) {
  const { businessId, userId, type, requestedPlan, reason, message } = params;

  // Get current plan
  const subscription = await getBusinessSubscription(businessId);
  const currentPlan = normalizePlanCode(subscription?.plan?.name ?? PLAN_NAMES.FREE);

  return prisma.subscriptionRequest.create({
    data: {
      businessId,
      userId,
      type,
      currentPlan,
      requestedPlan,
      reason: reason?.substring(0, 255),
      message,
      status: "pending",
    },
  });
}

export async function getPlatformSubscriptionRequests(params: {
  status?: SubscriptionRequestStatus[];
  type?: SubscriptionRequestType[];
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { status, type, search, limit = 50, offset = 0 } = params;

  const where: any = {};
  if (status && status.length > 0) where.status = { in: status };
  if (type && type.length > 0) where.type = { in: type };
  if (search) {
    where.OR = [
      { business: { name: { contains: search } } },
      { user: { name: { contains: search } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.subscriptionRequest.findMany({
      where,
      include: {
        business: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
        notes: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.subscriptionRequest.count({ where }),
  ]);

  return { items, total };
}

export async function getSubscriptionRequestById(id: number) {
  return prisma.subscriptionRequest.findUnique({
    where: { id },
    include: {
      business: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
      notes: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } }
    }
  });
}

export async function updateSubscriptionRequestStatus(params: {
  id: number;
  status: SubscriptionRequestStatus;
  adminNote?: string;
  visibility?: string;
  userId: number;
}) {
  const { id, status, adminNote, visibility, userId } = params;

  return prisma.$transaction(async (tx) => {
    const current = await tx.subscriptionRequest.findUnique({
      where: { id },
      select: { status: true }
    });

    const updated = await tx.subscriptionRequest.update({
      where: { id },
      data: { status },
    });

    if (current && current.status !== status) {
      await tx.requestNote.create({
        data: {
          requestId: id,
          userId: userId,
          note: `Status changed from ${current.status.replace('_', ' ')} to ${status.replace('_', ' ')}`,
          visibility: "internal",
        },
      });
    }

    if (adminNote) {
      await tx.requestNote.create({
        data: {
          requestId: id,
          userId: userId,
          note: adminNote,
          visibility: visibility || "internal",
        },
      });
    }

    return updated;
  });
}

export async function getBusinessSubscriptionRequests(businessId: number) {
  return prisma.subscriptionRequest.findMany({
    where: { businessId },
    include: {
      notes: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addRequestNote(params: {
  requestId: number;
  note: string;
  userId: number;
  visibility?: string;
}) {
  return prisma.requestNote.create({
    data: {
      requestId: params.requestId,
      userId: params.userId,
      note: params.note,
      visibility: params.visibility || "internal",
    },
  });
}
