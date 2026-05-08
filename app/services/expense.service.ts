import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { notifyDeleteRequest } from "@/services/delete-request.service";
import { getCurrentBusinessId } from "@/lib/business";

export const EXPENSE_CATEGORIES = [
  "Utilities",
  "Rent",
  "Salaries",
  "Marketing",
  "Transport",
  "Office Supplies",
  "Equipment",
  "Maintenance",
  "Food",
  "Insurance",
  "Tax",
  "Bank Charges",
  "Other",
] as const;

export const PAYMENT_METHODS = [
  "Cash",
  "bKash",
  "Nagad",
  "Rocket",
  "Upay",
  "Bank",
  "Card",
] as const;

export interface ExpenseFilters {
  search?: string;
  category?: string;
  paymentMethod?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ExpenseInput {
  date?: string | Date;
  amount: number | string;
  currency?: string;
  category: string;
  paymentMethod: string;
  vendor: string;
  receiptId?: string | null;
  referenceNo?: string | null;
  taxAmount?: number | string;
  taxPercent?: number | string;
  description?: string | null;
  notes?: string | null;
}

export async function generateExpenseId(): Promise<string> {
  const count = await prisma.expense.count({ where: { businessId: getCurrentBusinessId() } });
  return `EXP-${String(count + 1).padStart(3, "0")}`;
}

function toDecimal(
  value: number | string | Prisma.Decimal | undefined | null,
  fallback = 0
): Prisma.Decimal {
  if (value === undefined || value === null || value === "") return new Prisma.Decimal(fallback);
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value);
}

function toDate(value: string | Date | undefined | null): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return value instanceof Date ? value : new Date(value);
}

export async function getExpenses(filters: ExpenseFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ExpenseWhereInput = { businessId: getCurrentBusinessId() };
  if (filters.search) {
    where.OR = [
      { expenseId: { contains: filters.search } },
      { vendor: { contains: filters.search } },
      { receiptId: { contains: filters.search } },
      { referenceNo: { contains: filters.search } },
    ];
  }
  if (filters.category) where.category = filters.category;
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
  if (filters.fromDate || filters.toDate) {
    where.date = {};
    if (filters.fromDate) where.date.gte = new Date(filters.fromDate);
    if (filters.toDate) where.date.lte = new Date(filters.toDate);
  }

  const [items, total, sumAgg] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  const totalAmount = sumAgg._sum.amount?.toString() ?? "0";

  return {
    items,
    total,
    totalAmount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getExpenseById(id: number) {
  return prisma.expense.findUnique({
    where: { id },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createExpense(data: ExpenseInput, userId: number) {
  if (!data.amount) throw new Error("Amount is required");
  if (!data.category) throw new Error("Category is required");
  if (!data.paymentMethod) throw new Error("Payment method is required");
  if (!data.vendor) throw new Error("Vendor is required");

  const expenseId = await generateExpenseId();

  const expense = await prisma.expense.create({
    data: {
      expenseId,
      date: toDate(data.date) ?? new Date(),
      amount: toDecimal(data.amount),
      currency: data.currency ?? "BDT",
      category: data.category,
      paymentMethod: data.paymentMethod,
      vendor: data.vendor,
      receiptId: data.receiptId ?? null,
      referenceNo: data.referenceNo ?? null,
      taxAmount: toDecimal(data.taxAmount ?? 0),
      taxPercent: toDecimal(data.taxPercent ?? 0),
      description: data.description ?? null,
      notes: data.notes ?? null,
      createdBy: userId,
    },
  });

  await createLog({
    userId,
    action: "create",
    module: "expense",
    entityId: String(expense.id),
    entityName: expense.expenseId,
    description: `Created expense: ${expense.expenseId} (${expense.vendor} - ${expense.amount.toString()})`,
    metadata: {
      expenseId: expense.expenseId,
      vendor: expense.vendor,
      amount: expense.amount.toString(),
      category: expense.category,
    },
  });

  return expense;
}

export async function updateExpense(id: number, data: Partial<ExpenseInput>, userId: number) {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return null;

  const update: Prisma.ExpenseUpdateInput = {};
  if (data.date !== undefined) update.date = toDate(data.date) ?? new Date();
  if (data.amount !== undefined) update.amount = toDecimal(data.amount);
  if (data.currency !== undefined) update.currency = data.currency;
  if (data.category !== undefined) update.category = data.category;
  if (data.paymentMethod !== undefined) update.paymentMethod = data.paymentMethod;
  if (data.vendor !== undefined) update.vendor = data.vendor;
  if (data.receiptId !== undefined) update.receiptId = data.receiptId;
  if (data.referenceNo !== undefined) update.referenceNo = data.referenceNo;
  if (data.taxAmount !== undefined) update.taxAmount = toDecimal(data.taxAmount);
  if (data.taxPercent !== undefined) update.taxPercent = toDecimal(data.taxPercent);
  if (data.description !== undefined) update.description = data.description;
  if (data.notes !== undefined) update.notes = data.notes;

  const expense = await prisma.expense.update({ where: { id }, data: update });

  await createLog({
    userId,
    action: "update",
    module: "expense",
    entityId: String(id),
    entityName: expense.expenseId,
    description: `Updated expense: ${expense.expenseId}`,
    metadata: { expenseId: expense.expenseId, fields: Object.keys(update) },
  });

  return expense;
}

export async function requestDeleteExpense(id: number, reason: string, userId: number) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return null;

  const existing = await prisma.deleteRequest.findFirst({
    where: { entityType: "expense", entityId: String(id), status: "pending" },
  });
  if (existing) return existing;

  const request = await prisma.deleteRequest.create({
    data: {
      entityType: "expense",
      entityId: String(id),
      entityName: expense.expenseId,
      reason,
      requestedBy: userId,
    },
  });

  await createLog({
    userId,
    action: "delete_request",
    module: "expense",
    entityId: String(id),
    entityName: expense.expenseId,
    description: `Requested deletion for expense: ${expense.expenseId}`,
    metadata: { expenseId: expense.expenseId, reason },
  });

  await notifyDeleteRequest("expense", expense.expenseId);

  return request;
}
