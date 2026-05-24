import { NextResponse, NextRequest } from "next/server";
import { requirePermission } from "../../../lib/rbac";
import { BACKUP_RESTORE } from "../../../constants/permissions";
import { generateRestoreDryRunPlan } from "../../../services/restore.service";
import type { BackupStructure } from "../../../services/backup.service";

export async function POST(request: NextRequest) {
  try {
    // Authenticate and check permissions
    const authResult = await requirePermission(request, BACKUP_RESTORE);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse JSON body
    const body = await request.json();

    // Check for dryRun flag
    if (!body.dryRun || body.dryRun !== true) {
      return NextResponse.json(
        { success: false, message: "Restore operation must be a dry-run (dryRun: true)" },
        { status: 400 }
      );
    }

    // Validate that we have backup data
    if (!body.backup || typeof body.backup !== "object") {
      return NextResponse.json(
        { success: false, message: "Backup data is required" },
        { status: 400 }
      );
    }

    // Generate dry-run plan
    const dryRunResult = await generateRestoreDryRunPlan(body.backup as BackupStructure);

    return NextResponse.json({
      success: true,
      data: dryRunResult,
    });
  } catch (error) {
    console.error("Backup restore dry-run error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process restore dry-run" },
      { status: 500 }
    );
  }
}