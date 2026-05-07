import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
  const count = await prisma.customer.count();
  const next = count + 1;
  return `CX-${String(next).padStart(3, "0")}`;
}

export async function getCustomers(filters: CustomerFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.CustomerWhereInput = { deletedAt: null };
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
    where: { id, deletedAt: null },
  });
}

export async function createCustomer(data: CustomerInput, userId: number) {
  const customerId = await generateCustomerId();
  const customer = await prisma.customer.create({
    data: {
      customerId,
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

  await prisma.activityLog.create({
    data: {
      userId,
      action: "create",
      entityType: "customer",
      entityId: customer.id,
      metadata: { customerId: customer.customerId, name: customer.name },
    },
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
    where: { id },
    data: update,
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "update",
      entityType: "customer",
      entityId: customer.id,
      metadata: { customerId: customer.customerId, fields: Object.keys(update) },
    },
  });

  return customer;
}

export async function requestDeleteCustomer(id: number, reason: string, userId: number) {
  const customer = await prisma.customer.findFirst({ where: { id, deletedAt: null } });
  if (!customer) return null;

  const existing = await prisma.deleteRequest.findFirst({
    where: { entityType: "customer", entityId: id, status: "pending" },
  });
  if (existing) return existing;

  const request = await prisma.deleteRequest.create({
    data: {
      entityType: "customer",
      entityId: id,
      reason,
      requestedBy: userId,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "delete_request",
      entityType: "customer",
      entityId: id,
      metadata: { customerId: customer.customerId, reason },
    },
  });

  return request;
}
