import { NextResponse, NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { BACKUP_VALIDATE } from "@/constants/permissions";
import { validateBackupJson } from "@/services/backup.service";

export async function POST(request: NextRequest) {
  try {
    // Authenticate and check permissions
    const authResult = await requirePermission(request, BACKUP_VALIDATE);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse JSON body
    const backupData = await request.json();

    // Validate the backup JSON
    const validationResult = validateBackupJson(backupData);

    return NextResponse.json({
      success: true,
      validation: validationResult,
    });
  } catch (error) {
    console.error("Backup validation error:", error);
    return NextResponse.json(
      { success: false, message: "Invalid JSON or validation failed" },
      { status: 400 }
    );
  }
}