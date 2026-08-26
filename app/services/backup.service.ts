import { prisma } from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/business";
import { Prisma } from "@prisma/client";

const BACKUP_VERSION = "1.0.0";
const APP_NAME = "DokanDar";

interface BackupData {
  settings: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  products: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  suppliers: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  orderItems: Record<string, unknown>[];
  sales: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
  stock: Record<string, unknown>[];
  stockLogs: Record<string, unknown>[];
  deleteRequests: Record<string, unknown>[];
}

interface BackupMetadata {
  appMode: string;
  schemaVersion: string;
  recordCounts: Record<string, number>;
  includesUploads: boolean;
  notes: string[];
}

export interface BackupStructure {
  version: string;
  app: string;
  type: string;
  generatedAt: string;
  business: { id: number; name: string; slug: string };
  metadata: BackupMetadata;
  data: BackupData;
}

// Convert Prisma values to JSON-safe formats
function serializeValue(value: unknown): unknown {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (value instanceof Prisma.Decimal) return Number(value.toString());
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object") {
    const obj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      obj[key] = serializeValue(val);
    }
    return obj;
  }
  return value;
}

// Remove sensitive fields from records
function sanitizeRecord(record: unknown): unknown {
  if (!record || typeof record !== "object") return record;
  const rec = record as Record<string, unknown>;
  const sensitiveFields = [
    "password",
    "passwordHash",
    "resetToken",
    "resetTokenExpiry",
    "resetTokenExpiresAt",
    "apiKey",
    "key",
    "secret",
    "webhookSecret",
    "sessionToken",
    "token",
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(rec)) {
    if (sensitiveFields.includes(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeData(val);
    }
  }
  return sanitized;
}

// Recursively sanitize nested data
function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === "object") {
    const obj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      obj[key] = sanitizeData(val);
    }
    return sanitizeRecord(obj);
  }
  return data;
}

export async function generateBusinessBackup(): Promise<BackupStructure> {
  const businessId = getCurrentBusinessId();

  // Get business info
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, slug: true },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  // Gather all data with businessId filter
  const [
    settings,
    categories,
    products,
    customers,
    suppliers,
    orders,
    orderItems,
    sales,
    expenses,
    stock,
    stockLogs,
    deleteRequests,
  ] = await Promise.all([
    prisma.setting.findMany({ where: { businessId } }),
    prisma.category.findMany({ where: { businessId } }),
    prisma.product.findMany({ where: { businessId, deletedAt: null } }),
    prisma.customer.findMany({ where: { businessId, deletedAt: null } }),
    prisma.supplier.findMany({ where: { businessId, deletedAt: null } }),
    prisma.order.findMany({ where: { businessId, deletedAt: null } }),
    prisma.orderItem.findMany({ where: { businessId } }),
    prisma.sale.findMany({ where: { businessId, deletedAt: null } }),
    prisma.expense.findMany({ where: { businessId, deletedAt: null } }),
    prisma.stock.findMany({ where: { businessId } }),
    prisma.stockLog.findMany({ where: { businessId } }),
    prisma.deleteRequest.findMany({ where: { businessId } }),
  ]);

  // Serialize and sanitize all data
  const sanitizeRecords = (records: unknown[]) =>
    sanitizeData(records.map((r) => serializeValue(r)));

  const data: BackupData = {
    settings: sanitizeRecords(settings) as Record<string, unknown>[],
    categories: sanitizeRecords(categories) as Record<string, unknown>[],
    products: sanitizeRecords(products) as Record<string, unknown>[],
    customers: sanitizeRecords(customers) as Record<string, unknown>[],
    suppliers: sanitizeRecords(suppliers) as Record<string, unknown>[],
    orders: sanitizeRecords(orders) as Record<string, unknown>[],
    orderItems: sanitizeRecords(orderItems) as Record<string, unknown>[],
    sales: sanitizeRecords(sales) as Record<string, unknown>[],
    expenses: sanitizeRecords(expenses) as Record<string, unknown>[],
    stock: sanitizeRecords(stock) as Record<string, unknown>[],
    stockLogs: sanitizeRecords(stockLogs) as Record<string, unknown>[],
    deleteRequests: sanitizeRecords(deleteRequests) as Record<string, unknown>[],
  };

  const recordCounts = {
    settings: data.settings.length,
    categories: data.categories.length,
    products: data.products.length,
    customers: data.customers.length,
    suppliers: data.suppliers.length,
    orders: data.orders.length,
    orderItems: data.orderItems.length,
    sales: data.sales.length,
    expenses: data.expenses.length,
    stock: data.stock.length,
    stockLogs: data.stockLogs.length,
    deleteRequests: data.deleteRequests.length,
  };

  return {
    version: BACKUP_VERSION,
    app: APP_NAME,
    type: "business_backup",
    generatedAt: new Date().toISOString(),
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
    },
    metadata: {
      appMode: process.env.APP_MODE || "cloud",
      schemaVersion: BACKUP_VERSION,
      recordCounts,
      includesUploads: false,
      notes: [
        "This backup contains business data only.",
        "Uploaded files are not included - backup file URLs/references separately.",
        "User passwords and auth tokens are not included.",
      ],
    },
    data,
  };
}

export interface ValidationResult {
  valid: boolean;
  version: string;
  businessName: string;
  recordCounts: Record<string, number>;
  warnings: string[];
  errors: string[];
}

export function validateBackupJson(json: unknown): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Basic structure validation
  if (!json || typeof json !== "object") {
    errors.push("Backup must be a valid JSON object");
    return { valid: false, version: "", businessName: "", recordCounts: {}, warnings, errors };
  }

  const backup = json as Record<string, unknown>;

  // Check required top-level fields
  if (!backup.version) errors.push("Missing 'version' field");
  if (!backup.app) errors.push("Missing 'app' field");
  if (!backup.type) errors.push("Missing 'type' field");
  if (!backup.business) errors.push("Missing 'business' field");
  if (!backup.data) errors.push("Missing 'data' field");

  if (errors.length > 0) {
    return { valid: false, version: "", businessName: "", recordCounts: {}, warnings, errors };
  }

  // Validate app name
  if (backup.app !== APP_NAME) {
    warnings.push(`Expected app '${APP_NAME}', found '${backup.app}'`);
  }

  // Validate type
  if (backup.type !== "business_backup") {
    warnings.push(`Expected type 'business_backup', found '${backup.type}'`);
  }

  // Check version - warn for future versions
  const version = String(backup.version);
  if (version !== BACKUP_VERSION) {
    warnings.push(`Backup version '${version}' differs from current '${BACKUP_VERSION}'`);
  }

  // Validate data object structure
  const data = backup.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") {
    errors.push("Invalid 'data' object");
    return { valid: false, version, businessName: "", recordCounts: {}, warnings, errors };
  }

  // Extract business info
  const business = backup.business as Record<string, unknown> | undefined;
  const businessName = business?.name ? String(business.name) : "Unknown";

  // Count records in data sections
  const recordCounts: Record<string, number> = {};
  const validDataSections = [
    "settings",
    "categories",
    "products",
    "customers",
    "suppliers",
    "orders",
    "orderItems",
    "sales",
    "expenses",
    "stock",
    "stockLogs",
    "deleteRequests",
  ];

  for (const section of validDataSections) {
    if (data[section]) {
      if (Array.isArray(data[section])) {
        recordCounts[section] = (data[section] as unknown[]).length;
      } else {
        recordCounts[section] = 0;
        warnings.push(`Data section '${section}' should be an array`);
      }
    }
  }

  // Check for sensitive data that shouldn't be in backup
  const sensitiveCheck = JSON.stringify(backup);
  if (sensitiveCheck.includes("passwordHash") || sensitiveCheck.includes("password")) {
    warnings.push("Backup contains password data - this should not happen");
  }
  if (sensitiveCheck.includes("resetToken")) {
    warnings.push("Backup contains reset tokens - this should not happen");
  }
  if (sensitiveCheck.includes('"secret"') || sensitiveCheck.includes('"key":')) {
    warnings.push("Backup may contain API keys or secrets");
  }

  return {
    valid: errors.length === 0,
    version,
    businessName,
    recordCounts,
    warnings,
    errors,
  };
}

export interface RestorePlan {
  mode: string;
  willCreate: Record<string, number>;
  willUpdate: Record<string, number>;
  conflicts: string[];
  warnings: string[];
}

export function generateRestorePlan(backup: BackupStructure): RestorePlan {
  const willCreate: Record<string, number> = {};
  const willUpdate: Record<string, number> = {};
  const conflicts: string[] = [];
  const warnings: string[] = [];

  const data = backup.data;

  // Analyze what will be created vs updated
  // For now, all records are considered "create" since we don't match existing IDs
  for (const [section, records] of Object.entries(data)) {
    if (Array.isArray(records)) {
      willCreate[section] = records.length;
    }
  }

  // Warn about potential conflicts
  if (data.products.length > 0) warnings.push("Product IDs may conflict with existing products");
  if (data.customers.length > 0) warnings.push("Customer IDs may conflict with existing customers");
  if (data.orders.length > 0) warnings.push("Order IDs may conflict with existing orders");

  // Warn about data that shouldn't be restored
  warnings.push("User/auth records are not included in restore plan");
  warnings.push("Business ownership will not be changed");

  return {
    mode: "dry_run",
    willCreate,
    willUpdate,
    conflicts,
    warnings,
  };
}