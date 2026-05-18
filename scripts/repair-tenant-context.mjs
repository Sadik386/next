import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TENANT_TABLES = [
  "ActivityLog",
  "AiInsight",
  "ApiKey",
  "Attendance",
  "Category",
  "Customer",
  "DashboardSnapshot",
  "DeleteRequest",
  "EmployeeProfile",
  "Expense",
  "HeldOrder",
  "ImportJob",
  "IntegrationSetting",
  "InventoryMovement",
  "Invoice",
  "Notification",
  "NotificationRead",
  "Order",
  "OrderItem",
  "Payment",
  "PaymentMethod",
  "PaymentSchedule",
  "Product",
  "PosSession",
  "Possession",
  "Report",
  "Sale",
  "Shipment",
  "Setting",
  "Stock",
  "StockLog",
  "StockTransfer",
  "Supplier",
  "Vendor",
  "Warehouse",
  "Webhook",
  "PaymentTransaction",
];

const DATA_OWNER_TABLES = [
  "Product",
  "Setting",
  "Category",
  "Customer",
  "Order",
  "Sale",
  "Stock",
  "Supplier",
  "Expense",
];

function quoteIdent(identifier) {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }

  return `\`${identifier}\``;
}

function toNumber(value) {
  return typeof value === "bigint" ? Number(value) : Number(value ?? 0);
}

function toBoolean(value) {
  return value === true || value === 1 || value === "1";
}

async function getTableName(modelName) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?) LIMIT 1",
    modelName,
  );

  return rows[0]?.TABLE_NAME ?? null;
}

async function requireTable(modelName) {
  const tableName = await getTableName(modelName);

  if (!tableName) {
    throw new Error(`Required table ${modelName} was not found in the current database.`);
  }

  return tableName;
}

async function getBusinessIdColumnDefault(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'businessId' LIMIT 1",
    tableName,
  );

  return rows.length > 0 ? rows[0].COLUMN_DEFAULT : undefined;
}

async function getCountsByBusinessId(modelName) {
  const tableName = await getTableName(modelName);

  if (!tableName || (await getBusinessIdColumnDefault(tableName)) === undefined) {
    return [];
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT businessId, COUNT(*) AS count FROM ${quoteIdent(tableName)} GROUP BY businessId ORDER BY businessId ASC`,
  );

  return rows.map((row) => ({
    table: modelName,
    businessId: toNumber(row.businessId),
    count: toNumber(row.count),
  }));
}

async function ensureBusinessMemberTable() {
  if (await getTableName("BusinessMember")) {
    return false;
  }

  const userTable = await requireTable("User");
  const businessTable = await requireTable("Business");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${quoteIdent("BusinessMember")} (
      id INTEGER NOT NULL AUTO_INCREMENT,
      userId INTEGER NOT NULL,
      businessId INTEGER NOT NULL,
      isDefault BOOLEAN NOT NULL DEFAULT FALSE,
      status VARCHAR(191) NOT NULL DEFAULT 'active',
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL,

      INDEX BusinessMember_userId_status_idx (userId, status),
      INDEX BusinessMember_businessId_status_idx (businessId, status),
      UNIQUE INDEX BusinessMember_userId_businessId_key (userId, businessId),
      PRIMARY KEY (id),
      CONSTRAINT BusinessMember_userId_fkey
        FOREIGN KEY (userId) REFERENCES ${quoteIdent(userTable)}(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT BusinessMember_businessId_fkey
        FOREIGN KEY (businessId) REFERENCES ${quoteIdent(businessTable)}(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  return true;
}

async function selectDataOwnerBusinessId() {
  const allCounts = [];

  for (const modelName of DATA_OWNER_TABLES) {
    allCounts.push(...(await getCountsByBusinessId(modelName)));
  }

  const scores = new Map();
  for (const row of allCounts) {
    if (!row.businessId) {
      continue;
    }

    scores.set(row.businessId, (scores.get(row.businessId) ?? 0) + row.count);
  }

  if (scores.size > 0) {
    return [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  }

  const businessTable = await requireTable("Business");
  const businesses = await prisma.$queryRawUnsafe(
    `SELECT id FROM ${quoteIdent(businessTable)} ORDER BY id ASC LIMIT 1`,
  );

  return businesses[0]?.id ? toNumber(businesses[0].id) : 1;
}

async function getBusinessNameForBusinessId(businessId) {
  const settingTable = await getTableName("Setting");

  if (!settingTable) {
    return "Accoraze";
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT businessName FROM ${quoteIdent(settingTable)} WHERE businessId = ? AND businessName IS NOT NULL AND businessName <> '' ORDER BY id ASC LIMIT 1`,
    businessId,
  );

  return rows[0]?.businessName ?? "Accoraze";
}

async function ensureBusiness(businessId) {
  const businessTable = await requireTable("Business");
  const name = await getBusinessNameForBusinessId(businessId);
  const preferredSlug = businessId === 1 ? "accoraze" : `business-${businessId}`;
  const slugRows = await prisma.$queryRawUnsafe(
    `SELECT id FROM ${quoteIdent(businessTable)} WHERE slug = ? AND id <> ? LIMIT 1`,
    preferredSlug,
    businessId,
  );
  const slug = slugRows.length > 0 ? `business-${businessId}` : preferredSlug;

  await prisma.$executeRawUnsafe(
    `INSERT INTO ${quoteIdent(businessTable)} (id, name, slug, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, TRUE, NOW(3), NOW(3))
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       slug = VALUES(slug),
       isActive = TRUE,
       updatedAt = NOW(3)`,
    businessId,
    name,
    slug,
  );
}

async function getActiveUsers() {
  const userTable = await requireTable("User");
  const roleTable = await getTableName("Role");
  const roleJoin = roleTable
    ? `LEFT JOIN ${quoteIdent(roleTable)} r ON r.id = u.roleId`
    : "";
  const roleSelect = roleTable ? "r.name AS roleName" : "NULL AS roleName";

  return prisma.$queryRawUnsafe(
    `SELECT u.id, u.email, u.name, ${roleSelect}
     FROM ${quoteIdent(userTable)} u
     ${roleJoin}
     WHERE u.deletedAt IS NULL AND u.isActive = TRUE
     ORDER BY u.id ASC`,
  );
}

async function getMembershipsForUser(userId) {
  const memberTable = await requireTable("BusinessMember");

  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, userId, businessId, isDefault, status
     FROM ${quoteIdent(memberTable)}
     WHERE userId = ?
     ORDER BY isDefault DESC, id ASC`,
    userId,
  );

  return rows.map((row) => ({
    id: toNumber(row.id),
    userId: toNumber(row.userId),
    businessId: toNumber(row.businessId),
    isDefault: toBoolean(row.isDefault),
    status: row.status,
  }));
}

async function upsertMembership(userId, businessId, isDefault) {
  const memberTable = await requireTable("BusinessMember");

  await prisma.$executeRawUnsafe(
    `INSERT INTO ${quoteIdent(memberTable)} (userId, businessId, isDefault, status, createdAt, updatedAt)
     VALUES (?, ?, ?, 'active', NOW(3), NOW(3))
     ON DUPLICATE KEY UPDATE
       status = 'active',
       isDefault = VALUES(isDefault),
       updatedAt = NOW(3)`,
    userId,
    businessId,
    isDefault,
  );
}

async function chooseDefaultMembership(userId, preferredBusinessId) {
  const memberTable = await requireTable("BusinessMember");
  const memberships = (await getMembershipsForUser(userId)).filter((membership) => membership.status === "active");

  if (memberships.length === 0) {
    return null;
  }

  const preferred = memberships.find((membership) => membership.businessId === preferredBusinessId);
  const existingDefault = memberships.find((membership) => membership.isDefault);
  const chosen = preferred ?? existingDefault ?? memberships[0];

  await prisma.$executeRawUnsafe(
    `UPDATE ${quoteIdent(memberTable)}
     SET isDefault = CASE WHEN id = ? THEN TRUE ELSE FALSE END,
         updatedAt = NOW(3)
     WHERE userId = ? AND status = 'active'`,
    chosen.id,
    userId,
  );

  return chosen.businessId;
}

async function repairMemberships(targetBusinessId) {
  const users = await getActiveUsers();

  for (const user of users) {
    const roleName = user.roleName ?? "";
    const memberships = await getMembershipsForUser(user.id);
    const activeMemberships = memberships.filter((membership) => membership.status === "active");
    const isAdminUser = roleName === "admin" || roleName === "super_admin";

    if (isAdminUser || activeMemberships.length === 0) {
      await upsertMembership(user.id, targetBusinessId, true);
    }

    await chooseDefaultMembership(user.id, targetBusinessId);
  }
}

async function removeBusinessIdDefaults() {
  const changed = [];

  for (const modelName of TENANT_TABLES) {
    const tableName = await getTableName(modelName);

    if (!tableName) {
      continue;
    }

    const defaultValue = await getBusinessIdColumnDefault(tableName);

    if (defaultValue === undefined || defaultValue === null) {
      continue;
    }

    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${quoteIdent(tableName)} MODIFY ${quoteIdent("businessId")} INTEGER NOT NULL`,
    );
    changed.push(modelName);
  }

  return changed;
}

async function buildReport(targetBusinessId, createdBusinessMemberTable, removedDefaults) {
  const users = await getActiveUsers();
  const currentUser = users[0] ?? null;
  const memberships = currentUser ? await getMembershipsForUser(currentUser.id) : [];
  const resolvedBusinessId =
    memberships.find((membership) => membership.status === "active" && membership.isDefault)?.businessId ??
    memberships.find((membership) => membership.status === "active")?.businessId ??
    null;

  return {
    currentUser: currentUser
      ? {
          id: toNumber(currentUser.id),
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.roleName,
        }
      : null,
    targetBusinessId,
    resolvedBusinessId,
    memberships,
    productCounts: await getCountsByBusinessId("Product"),
    settingCounts: await getCountsByBusinessId("Setting"),
    createdBusinessMemberTable,
    removedBusinessIdDefaultsFrom: removedDefaults,
  };
}

async function main() {
  const createdBusinessMemberTable = await ensureBusinessMemberTable();
  const targetBusinessId = await selectDataOwnerBusinessId();
  await ensureBusiness(targetBusinessId);
  await repairMemberships(targetBusinessId);
  const removedDefaults = await removeBusinessIdDefaults();
  const report = await buildReport(targetBusinessId, createdBusinessMemberTable, removedDefaults);

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
