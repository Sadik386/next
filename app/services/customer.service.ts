import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { notifyDeleteRequest } from "@/services/delete-request.service";
import { getCurrentBusinessId } from "@/lib/business";

export interface CustomerFilters {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CustomerInput {
  name: string;
  email?: string | null;
  mobile: string;
  country?: string | null;
  state?: string | null;
  zipCode?: string | null;
  city?: string | null;
  streetAddress?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  status?: string;
}

export async function generateCustomerId(): Promise<string> {
  const count = await prisma.customer.count({ where: { businessId: getCurrentBusinessId() } });
  const next = count + 1;
  return `CX-${String(next).padStart(3, "0")}`;
}

export async function getCustomers(filters: CustomerFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.CustomerWhereInput = { deletedAt: null, businessId: getCurrentBusinessId() };
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { customerId: { contains: filters.search } },
      { email: { contains: filters.search } },
      { mobile: { contains: filters.search } },
      { city: { contains: filters.search } },
    ];
  }
  if (filters.status) where.status = filters.status;

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCustomerById(id: number) {
  return prisma.customer.findFirst({
    where: { id, deletedAt: null, businessId: getCurrentBusinessId() },
  });
}

export async function createCustomer(data: CustomerInput, userId: number) {
  const customerId = await generateCustomerId();
  const customer = await prisma.customer.create({
    data: {
      customerId,
      businessId: getCurrentBusinessId(),
      name: data.name,
      email: data.email ?? null,
      mobile: data.mobile,
      country: data.country ?? null,
      state: data.state ?? null,
      zipCode: data.zipCode ?? null,
      city: data.city ?? null,
      streetAddress: data.streetAddress ?? null,
      billingAddress: data.billingAddress ?? null,
      shippingAddress: data.shippingAddress ?? null,
      status: data.status ?? "active",
    },
  });

  await createLog({
    userId,
    action: "create",
    module: "customer",
    entityId: String(customer.id),
    entityName: customer.name,
    description: `Created customer: ${customer.name} (${customer.customerId})`,
    metadata: { customerId: customer.customerId, name: customer.name },
  });

  return customer;
}

export async function updateCustomer(id: number, data: Partial<CustomerInput>, userId: number) {
  const update: Prisma.CustomerUpdateInput = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.email !== undefined) update.email = data.email;
  if (data.mobile !== undefined) update.mobile = data.mobile;
  if (data.country !== undefined) update.country = data.country;
  if (data.state !== undefined) update.state = data.state;
  if (data.zipCode !== undefined) update.zipCode = data.zipCode;
  if (data.city !== undefined) update.city = data.city;
  if (data.streetAddress !== undefined) update.streetAddress = data.streetAddress;
  if (data.billingAddress !== undefined) update.billingAddress = data.billingAddress;
  if (data.shippingAddress !== undefined) update.shippingAddress = data.shippingAddress;
  if (data.status !== undefined) update.status = data.status;

  const customer = await prisma.customer.update({
    where: { id, businessId: getCurrentBusinessId() },
    data: update,
  });

  await createLog({
    userId,
    action: "update",
    module: "customer",
    entityId: String(customer.id),
    entityName: customer.name,
    description: `Updated customer: ${customer.name} (${customer.customerId})`,
    metadata: { customerId: customer.customerId, fields: Object.keys(update) },
  });

  return customer;
}

export async function requestDeleteCustomer(id: number, reason: string, userId: number) {
  const businessId = getCurrentBusinessId();
  const customer = await prisma.customer.findFirst({ where: { id, deletedAt: null, businessId } });
  if (!customer) return null;

  const existing = await prisma.deleteRequest.findFirst({
    where: { entityType: "customer", entityId: String(id), status: "pending", businessId },
  });
  if (existing) return existing;

  const request = await prisma.deleteRequest.create({
    data: {
      businessId,
      entityType: "customer",
      entityId: String(id),
      entityName: customer.name,
      reason,
      requestedBy: userId,
    },
  });

  await createLog({
    userId,
    action: "delete_request",
    module: "customer",
    entityId: String(id),
    entityName: customer.name,
    description: `Requested deletion for customer: ${customer.name} (${customer.customerId})`,
    metadata: { customerId: customer.customerId, reason },
  });

  await notifyDeleteRequest("customer", customer.name);

  return request;
}
