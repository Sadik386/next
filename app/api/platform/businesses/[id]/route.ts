import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-auth";
import { platformAdminService } from "@/services/platform-admin.service";

function parseBusinessId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Request failed";
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const businessId = parseBusinessId(id);
  if (!businessId) {
    return NextResponse.json({ success: false, error: "Invalid business id" }, { status: 400 });
  }

  try {
    const business = await platformAdminService.getBusinessDetailForAdmin(businessId);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, business });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const businessId = parseBusinessId(id);
  if (!businessId) {
    return NextResponse.json({ success: false, error: "Invalid business id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "plan") {
      const business = await platformAdminService.updateBusinessPlanForAdmin(businessId, body.planName);
      return NextResponse.json({ success: true, business });
    }

    if (action === "overrides") {
      const business = await platformAdminService.updateBusinessOverridesForAdmin(
        businessId,
        body.overrides ?? {},
        auth.user.id
      );
      return NextResponse.json({ success: true, business });
    }

    if (action === "reset-overrides") {
      const business = await platformAdminService.resetBusinessOverridesForAdmin(businessId);
      return NextResponse.json({ success: true, business });
    }

    if (action === "status") {
      const business = await platformAdminService.updateBusinessStatusForAdmin(businessId, Boolean(body.isActive));
      return NextResponse.json({ success: true, business });
    }

    return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    const message = errorMessage(error);
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
