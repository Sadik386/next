import { prisma } from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/business";
import type { BackupStructure } from "./backup.service";

interface RestoreDryRunResult {
  ok: boolean;
  mode: "dry-run";
  targetBusinessId: number;
  backupMetadata: {
    version: string;
    app: string;
    type: string;
    generatedAt: string;
    business: { id: number; name: string; slug: string };
    metadata: {
      appMode: string;
      schemaVersion: string;
      recordCounts: Record<string, number>;
      includesUploads: boolean;
      notes: string[];
    };
  };
  summary: {
    sectionsFound: string[];
    totalRecords: number;
    supportedSections: string[];
    unsupportedSections: string[];
  };
  plan: {
    wouldCreate: Record<string, number>;
    wouldUpdate: Record<string, number>;
    wouldSkip: Record<string, number>;
    conflicts: Record<string, string[]>;
  };
  warnings: string[];
}

export async function validateBackupBusinessContext(
  backup: BackupStructure
): Promise<{ valid: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  const currentBusinessId = getCurrentBusinessId();
  const backupBusinessId = backup.business.id;

  if (backupBusinessId !== currentBusinessId) {
    warnings.push(
      `Backup business ID (${backupBusinessId}) does not match current business ID (${currentBusinessId}). Restore would target wrong business.`
    );
    return { valid: false, warnings };
  }

  return { valid: true, warnings };
}

export async function generateRestoreDryRunPlan(
  backup: BackupStructure
): Promise<RestoreDryRunResult> {
  const currentBusinessId = getCurrentBusinessId();
  const data = backup.data;

  // Define supported sections (matching backup.service.ts)
  const supportedSections = [
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

  const sectionsFound: string[] = [];
  const unsupportedSections: string[] = [];
  const wouldCreate: Record<string, number> = {};
  const wouldUpdate: Record<string, number> = {}; // Phase 1: no updates
  const wouldSkip: Record<string, number> = {};
  const conflicts: Record<string, string[]> = {}; // Phase 1: no conflict detection
  let totalRecords = 0;

  // Analyze each section in backup data
  for (const [section, records] of Object.entries(data)) {
    if (!Array.isArray(records)) {
      // Not an array, skip and warn
      wouldSkip[section] = 0;
      if (!unsupportedSections.includes(section)) {
        unsupportedSections.push(section);
      }
      continue;
    }

    if (supportedSections.includes(section)) {
      sectionsFound.push(section);
      wouldCreate[section] = records.length;
      totalRecords += records.length;
    } else {
      // Unsupported section
      wouldSkip[section] = records.length;
      if (!unsupportedSections.includes(section)) {
        unsupportedSections.push(section);
      }
    }
  }

  // Business context validation
  const { valid: businessContextValid, warnings: businessContextWarnings } =
    await validateBackupBusinessContext(backup);

  const warnings: string[] = [...businessContextWarnings];

  // Add warnings for unsupported sections
  if (unsupportedSections.length > 0) {
    warnings.push(
      `Unsupported sections found and will be skipped: ${unsupportedSections.join(
        ", "
      )}`
    );
  }

  // Add warning if no data
  if (totalRecords === 0) {
    warnings.push("Backup contains no data to restore.");
  }

  return {
    ok: true,
    mode: "dry-run",
    targetBusinessId: currentBusinessId,
    backupMetadata: {
      version: backup.version,
      app: backup.app,
      type: backup.type,
      generatedAt: backup.generatedAt,
      business: backup.business,
      metadata: backup.metadata,
    },
    summary: {
      sectionsFound,
      totalRecords,
      supportedSections: sectionsFound.filter((s) =>
        supportedSections.includes(s)
      ),
      unsupportedSections,
    },
    plan: {
      wouldCreate,
      wouldUpdate,
      wouldSkip,
      conflicts,
    },
    warnings,
  };
}