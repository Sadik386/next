import { NextResponse, NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { BACKUP_EXPORT } from "@/constants/permissions";
import { generateBusinessBackup } from "@/services/backup.service";

export async function GET(request: NextRequest) {
  try {
    // Authenticate and check permissions
    const authResult = await requirePermission(request, BACKUP_EXPORT);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Generate backup
    const backup = await generateBusinessBackup();

    return NextResponse.json({
      success: true,
      data: backup,
    });
  } catch (error) {
    console.error("Backup export error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export backup" },
      { status: 500 }
    );
  }
}