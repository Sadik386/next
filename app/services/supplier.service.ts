import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { notifyDeleteRequest } from "@/services/delete-request.service";
import { getCurrentBusinessId } from "@/lib/business";

export interface SupplierFilters {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface SupplierInput {
  companyName: string;
  contactName: string;
  email?: string | null;
  mobile?: string | null;
  website?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  currency?: string;
  bankName?: string | null;
  bankAccount?: string | null;
  category?: string | null;
  deliveryMethod?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  status?: string;
}

export async function generateSupplierId(): Promise<string> {
  const count = await prisma.supplier.count({ where: { businessId: getCurrentBusinessId() } });
  const next = count + 1;
  return `SUP-${String(next).padStart(3, "0")}`;
}

export async function getSuppliers(filters: SupplierFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.SupplierWhereInput = { deletedAt: null, businessId: getCurrentBusinessId() };
  if (filters.search) {
    where.OR = [
      { companyName: { contains: filters.search } },
      { contactName: { contains: filters.search } },
      { supplierId: { contains: filters.search } },
      { email: { contains: filters.search } },
      { mobile: { contains: filters.search } },
    ];
  }
  if (filters.status) where.status = filters.status;

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getSupplierById(id: number) {
  return prisma.supplier.findFirst({
    where: { id, deletedAt: null, businessId: getCurrentBusinessId() },
  });
}

export async function createSupplier(data: SupplierInput, userId: number) {
  const supplierId = await generateSupplierId();
  const supplier = await prisma.supplier.create({
    data: {
      businessId: getCurrentBusinessId(),
      supplierId,
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email ?? null,
      mobile: data.mobile ?? null,
      website: data.website ?? null,
      taxId: data.taxId ?? null,
      paymentTerms: data.paymentTerms ?? null,
      currency: data.currency ?? "BDT",
      bankName: data.bankName ?? null,
      bankAccount: data.bankAccount ?? null,
      category: data.category ?? null,
      deliveryMethod: data.deliveryMethod ?? null,
      streetAddress: data.streetAddress ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      zipCode: data.zipCode ?? null,
      country: data.country ?? null,
      status: data.status ?? "active",
    },
  });

  await createLog({
    userId,
    action: "create",
    module: "supplier",
    entityId: String(supplier.id),
    entityName: supplier.companyName,
    description: `Created supplier ${supplier.supplierId}: ${supplier.companyName}`,
    metadata: { supplierId: supplier.supplierId, companyName: supplier.companyName },
  });

  return supplier;
}

export async function updateSupplier(id: number, data: Partial<SupplierInput>, userId: number) {
  const update: Prisma.SupplierUpdateInput = {};
  if (data.companyName !== undefined) update.companyName = data.companyName;
  if (data.contactName !== undefined) update.contactName = data.contactName;
  if (data.email !== undefined) update.email = data.email;
  if (data.mobile !== undefined) update.mobile = data.mobile;
  if (data.website !== undefined) update.website = data.website;
  if (data.taxId !== undefined) update.taxId = data.taxId;
  if (data.paymentTerms !== undefined) update.paymentTerms = data.paymentTerms;
  if (data.currency !== undefined) update.currency = data.currency;
  if (data.bankName !== undefined) update.bankName = data.bankName;
  if (data.bankAccount !== undefined) update.bankAccount = data.bankAccount;
  if (data.category !== undefined) update.category = data.category;
  if (data.deliveryMethod !== undefined) update.deliveryMethod = data.deliveryMethod;
  if (data.streetAddress !== undefined) update.streetAddress = data.streetAddress;
  if (data.city !== undefined) update.city = data.city;
  if (data.state !== undefined) update.state = data.state;
  if (data.zipCode !== undefined) update.zipCode = data.zipCode;
  if (data.country !== undefined) update.country = data.country;
  if (data.status !== undefined) update.status = data.status;

  const supplier = await prisma.supplier.update({
    where: { id },
    data: update,
  });

  await createLog({
    userId,
    action: "update",
    module: "supplier",
    entityId: String(supplier.id),
    entityName: supplier.companyName,
    description: `Updated supplier ${supplier.supplierId}: ${supplier.companyName}`,
    metadata: { supplierId: supplier.supplierId, fields: Object.keys(update) },
  });

  return supplier;
}

export async function requestDeleteSupplier(id: number, reason: string, userId: number) {
  const supplier = await prisma.supplier.findFirst({ where: { id, deletedAt: null, businessId: getCurrentBusinessId() } });
  if (!supplier) return null;

  const existingRequest = await prisma.deleteRequest.findFirst({
    where: { businessId: getCurrentBusinessId(), entityType: "supplier", entityId: String(id), status: "pending" },
  });
  if (existingRequest) return existingRequest;

  const request = await prisma.deleteRequest.create({
    data: {
      businessId: getCurrentBusinessId(),
      entityType: "supplier",
      entityId: String(id),
      entityName: supplier.companyName,
      reason,
      requestedBy: userId,
    },
  });

  await createLog({
    userId,
    action: "delete_request",
    module: "supplier",
    entityId: String(id),
    entityName: supplier.companyName,
    description: `Requested deletion of supplier ${supplier.supplierId}`,
    metadata: { supplierId: supplier.supplierId, reason },
  });

  await notifyDeleteRequest("supplier", supplier.companyName);

  return request;
}
