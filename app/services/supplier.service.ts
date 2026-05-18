import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { notifyDeleteRequest } from "@/services/delete-request.service";
import { getCurrentBusinessId } from "@/lib/business";

export interface SupplierFilters {
  search?: string;
  status?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

const MFS_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"] as const;
type MfsProvider = (typeof MFS_PROVIDERS)[number];

export type SupplierPaymentMethod =
  | {
      type: "MFS";
      provider: MfsProvider;
      accountNumber: string;
    }
  | {
      type: "BANK";
      bankName: string;
      accountName: string;
      accountNumber: string;
      branchName: string;
      routingNumber: string;
      swiftCode: string;
    };

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
  accountName?: string | null;
  branchName?: string | null;
  routingNumber?: string | null;
  swiftCode?: string | null;
  bkash?: string | null;
  nagad?: string | null;
  rocket?: string | null;
  upay?: string | null;
  category?: string | null;
  deliveryMethod?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  status?: string;
  paymentMethods?: SupplierPaymentMethod[] | null;
}

type SupplierPayload = Partial<SupplierInput> & Record<string, unknown>;

type LegacyPaymentFields = Pick<
  SupplierInput,
  "bankName" | "bankAccount" | "accountName" | "branchName" | "routingNumber" | "swiftCode" | "bkash" | "nagad" | "rocket" | "upay"
>;

export class SupplierValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupplierValidationError";
  }
}

function optionalString(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function requiredString(value: unknown, message: string): string {
  const trimmed = optionalString(value);
  if (!trimmed) throw new SupplierValidationError(message);
  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(data: SupplierPayload, key: string) {
  return Object.prototype.hasOwnProperty.call(data, key);
}

function normalizeProvider(value: unknown): MfsProvider | null {
  if (typeof value !== "string") return null;
  return MFS_PROVIDERS.find((provider) => provider === value) ?? null;
}

function normalizePaymentMethods(value: unknown): SupplierPaymentMethod[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) {
    throw new SupplierValidationError("Payment methods must be a list.");
  }

  const methods: SupplierPaymentMethod[] = [];

  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      throw new SupplierValidationError(`Payment method #${index + 1} is invalid.`);
    }

    const rawType = optionalString(entry.type)?.toUpperCase() ?? "";
    const provider = optionalString(entry.provider);
    const accountNumber = optionalString(entry.accountNumber);
    const bankName = optionalString(entry.bankName);
    const accountName = optionalString(entry.accountName);
    const branchName = optionalString(entry.branchName);
    const routingNumber = optionalString(entry.routingNumber);
    const swiftCode = optionalString(entry.swiftCode);
    const hasAnyDetail = Boolean(
      provider || accountNumber || bankName || accountName || branchName || routingNumber || swiftCode
    );

    if (!hasAnyDetail && (rawType === "" || rawType === "BANK" || rawType === "MFS")) {
      return;
    }

    if (rawType !== "BANK" && rawType !== "MFS") {
      throw new SupplierValidationError(`Payment method #${index + 1} must be Bank or MFS.`);
    }

    if (rawType === "MFS") {
      const normalizedProvider = normalizeProvider(provider);
      if (!normalizedProvider) {
        throw new SupplierValidationError(`Payment method #${index + 1} has an invalid MFS provider.`);
      }
      if (!accountNumber) {
        throw new SupplierValidationError(`Payment method #${index + 1} account number is required.`);
      }
      methods.push({
        type: "MFS",
        provider: normalizedProvider,
        accountNumber,
      });
      return;
    }

    if (!bankName && !accountNumber) {
      throw new SupplierValidationError(`Bank payment method #${index + 1} requires bank name or account number.`);
    }

    methods.push({
      type: "BANK",
      bankName: bankName ?? "",
      accountName: accountName ?? "",
      accountNumber: accountNumber ?? "",
      branchName: branchName ?? "",
      routingNumber: routingNumber ?? "",
      swiftCode: swiftCode ?? "",
    });
  });

  return methods.length ? methods : null;
}

function legacyFieldsFromPayload(data: SupplierPayload): LegacyPaymentFields {
  return {
    bankName: optionalString(data.bankName),
    bankAccount: optionalString(data.bankAccount),
    accountName: optionalString(data.accountName),
    branchName: optionalString(data.branchName),
    routingNumber: optionalString(data.routingNumber),
    swiftCode: optionalString(data.swiftCode),
    bkash: optionalString(data.bkash),
    nagad: optionalString(data.nagad),
    rocket: optionalString(data.rocket),
    upay: optionalString(data.upay),
  };
}

function legacyPaymentMethodsFromPayload(data: SupplierPayload): SupplierPaymentMethod[] | null {
  const legacy = legacyFieldsFromPayload(data);
  const methods: SupplierPaymentMethod[] = [];

  if (legacy.bankName || legacy.bankAccount) {
    methods.push({
      type: "BANK",
      bankName: legacy.bankName ?? "",
      accountName: legacy.accountName ?? "",
      accountNumber: legacy.bankAccount ?? "",
      branchName: legacy.branchName ?? "",
      routingNumber: legacy.routingNumber ?? "",
      swiftCode: legacy.swiftCode ?? "",
    });
  }

  const mfsValues: Array<[MfsProvider, string | null | undefined]> = [
    ["bKash", legacy.bkash],
    ["Nagad", legacy.nagad],
    ["Rocket", legacy.rocket],
    ["Upay", legacy.upay],
  ];

  mfsValues.forEach(([provider, accountNumber]) => {
    if (accountNumber) {
      methods.push({ type: "MFS", provider, accountNumber });
    }
  });

  return methods.length ? methods : null;
}

function legacyFieldsFromPaymentMethods(methods: SupplierPaymentMethod[] | null): LegacyPaymentFields {
  const bank = methods?.find((method) => method.type === "BANK");
  const mfs = (provider: MfsProvider) =>
    methods?.find((method) => method.type === "MFS" && method.provider === provider)?.accountNumber ?? null;

  return {
    bankName: bank?.bankName || null,
    bankAccount: bank?.accountNumber || null,
    accountName: bank?.accountName || null,
    branchName: bank?.branchName || null,
    routingNumber: bank?.routingNumber || null,
    swiftCode: bank?.swiftCode || null,
    bkash: mfs("bKash"),
    nagad: mfs("Nagad"),
    rocket: mfs("Rocket"),
    upay: mfs("Upay"),
  };
}

function paymentMethodsJson(methods: SupplierPaymentMethod[] | null) {
  return methods?.length ? (methods as unknown as Prisma.InputJsonValue) : Prisma.DbNull;
}

function normalizeSupplierInput(data: SupplierPayload): SupplierInput {
  const paymentMethodsWereProvided = hasOwn(data, "paymentMethods");
  const paymentMethods = paymentMethodsWereProvided
    ? normalizePaymentMethods(data.paymentMethods)
    : legacyPaymentMethodsFromPayload(data);
  const legacyPaymentFields = paymentMethodsWereProvided
    ? legacyFieldsFromPaymentMethods(paymentMethods)
    : legacyFieldsFromPayload(data);

  return {
    companyName: requiredString(data.companyName, "Company name is required."),
    contactName: requiredString(data.contactName, "Contact name is required."),
    email: optionalString(data.email),
    mobile: requiredString(data.mobile, "Mobile number is required."),
    website: optionalString(data.website),
    taxId: optionalString(data.taxId),
    paymentTerms: requiredString(data.paymentTerms, "Payment terms is required."),
    currency: requiredString(data.currency, "Currency is required."),
    category: optionalString(data.category),
    deliveryMethod: optionalString(data.deliveryMethod),
    streetAddress: optionalString(data.streetAddress),
    city: optionalString(data.city),
    state: optionalString(data.state),
    zipCode: optionalString(data.zipCode),
    country: requiredString(data.country, "Country is required."),
    status: requiredString(data.status, "Status is required."),
    paymentMethods,
    ...legacyPaymentFields,
  };
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
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) (where.createdAt as any).gte = filters.from;
    if (filters.to) (where.createdAt as any).lte = filters.to;
  }

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

export async function getSupplierByIdOrSupplierId(idOrSupplierId: string) {
  const numId = Number(idOrSupplierId);
  const isNumeric = !isNaN(numId) && isFinite(numId);

  return prisma.supplier.findFirst({
    where: {
      deletedAt: null,
      businessId: getCurrentBusinessId(),
      OR: isNumeric
        ? [{ id: numId }, { supplierId: idOrSupplierId }]
        : [{ supplierId: idOrSupplierId }],
    },
  });
}

export async function createSupplier(data: SupplierInput, userId: number) {
  const normalized = normalizeSupplierInput(data as SupplierPayload);
  const supplierId = await generateSupplierId();
  const supplier = await prisma.supplier.create({
    data: {
      businessId: getCurrentBusinessId(),
      supplierId,
      companyName: normalized.companyName,
      contactName: normalized.contactName,
      email: normalized.email ?? null,
      mobile: normalized.mobile ?? null,
      website: normalized.website ?? null,
      taxId: normalized.taxId ?? null,
      paymentTerms: normalized.paymentTerms ?? null,
      currency: normalized.currency ?? "BDT",
      bankName: normalized.bankName ?? null,
      bankAccount: normalized.bankAccount ?? null,
      accountName: normalized.accountName ?? null,
      branchName: normalized.branchName ?? null,
      routingNumber: normalized.routingNumber ?? null,
      swiftCode: normalized.swiftCode ?? null,
      bkash: normalized.bkash ?? null,
      nagad: normalized.nagad ?? null,
      rocket: normalized.rocket ?? null,
      upay: normalized.upay ?? null,
      paymentMethods: paymentMethodsJson(normalized.paymentMethods ?? null),
      category: normalized.category ?? null,
      deliveryMethod: normalized.deliveryMethod ?? null,
      streetAddress: normalized.streetAddress ?? null,
      city: normalized.city ?? null,
      state: normalized.state ?? null,
      zipCode: normalized.zipCode ?? null,
      country: normalized.country ?? null,
      status: normalized.status ?? "active",
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
  const normalized = normalizeSupplierInput(data as SupplierPayload);
  const update: Prisma.SupplierUpdateInput = {
    companyName: normalized.companyName,
    contactName: normalized.contactName,
    email: normalized.email ?? null,
    mobile: normalized.mobile ?? null,
    website: normalized.website ?? null,
    taxId: normalized.taxId ?? null,
    paymentTerms: normalized.paymentTerms ?? null,
    currency: normalized.currency ?? "BDT",
    bankName: normalized.bankName ?? null,
    bankAccount: normalized.bankAccount ?? null,
    accountName: normalized.accountName ?? null,
    branchName: normalized.branchName ?? null,
    routingNumber: normalized.routingNumber ?? null,
    swiftCode: normalized.swiftCode ?? null,
    bkash: normalized.bkash ?? null,
    nagad: normalized.nagad ?? null,
    rocket: normalized.rocket ?? null,
    upay: normalized.upay ?? null,
    paymentMethods: paymentMethodsJson(normalized.paymentMethods ?? null),
    category: normalized.category ?? null,
    deliveryMethod: normalized.deliveryMethod ?? null,
    streetAddress: normalized.streetAddress ?? null,
    city: normalized.city ?? null,
    state: normalized.state ?? null,
    zipCode: normalized.zipCode ?? null,
    country: normalized.country ?? null,
    status: normalized.status ?? "active",
  };

  const supplier = await prisma.supplier.update({
    where: { id, businessId: getCurrentBusinessId() },
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
