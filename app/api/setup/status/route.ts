import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppRuntimeConfig } from "@/lib/config/app-mode";
import { getLicenseStatus } from "@/lib/license";
import { getUpdateStatus } from "@/lib/updates";

function buildSetupStatus(isComplete: boolean, hasUsers: boolean) {
  const runtime = getAppRuntimeConfig();

  return {
    isComplete,
    hasUsers,
    setupRequired: runtime.setupRequired,
    appMode: runtime.mode,
    runtime,
    license: getLicenseStatus(),
    updates: getUpdateStatus(),
  };
}

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const settings = await prisma.setting.findFirst();

    const hasUsers = userCount > 0;
    const isComplete = settings?.isSetupComplete === true;
    const data = buildSetupStatus(isComplete, hasUsers);

    return NextResponse.json({ success: true, data, ...data });
  } catch {
    const data = buildSetupStatus(false, false);
    return NextResponse.json({
      success: false,
      message: "Setup status unavailable",
      data,
      ...data,
    });
  }
}
