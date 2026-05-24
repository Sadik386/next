import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSettings, updateSettings } from "@/services/setting.service";
import { PERMISSIONS } from "@/constants/permissions";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { hasFeatureAccess } from "@/lib/subscription-guard";
import { FEATURE_KEYS } from "@/lib/pricing";

const SMTP_FIELDS = [
  "smtpHost", "smtpPort", "smtpUsername", "smtpPassword",
  "smtpFromEmail", "smtpFromName", "emailHeaderLogo",
  "emailFooterText", "companyAddressFooter",
] as const;

function hasSmtpFields(body: Record<string, unknown>): boolean {
  return SMTP_FIELDS.some((f) => f in body);
}

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    const settings = await getSettings();
    return NextResponse.json({ settings });
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.EDIT_SETTINGS)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      const body = await req.json();

      if (hasSmtpFields(body)) {
        const canUseSmtp = await hasFeatureAccess(user.businessId!, FEATURE_KEYS.CUSTOM_SMTP);
        if (!canUseSmtp) {
          return NextResponse.json(
            {
              error: "Business SMTP is not available on your current plan. Upgrade to Starter or higher to configure business email.",
            },
            { status: 403 }
          );
        }
      }

      const settings = await updateSettings(body, user.id);
      return NextResponse.json({ settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  });
}
