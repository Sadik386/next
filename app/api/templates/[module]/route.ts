import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { csvResponse, CsvModule, generateTemplateCsv, TEMPLATE_COLUMNS } from "@/lib/csv";

export async function GET(req: NextRequest, ctx: { params: Promise<{ module: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { module } = await ctx.params;
  if (!(module in TEMPLATE_COLUMNS)) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }

  const csv = generateTemplateCsv(module as CsvModule);
  return csvResponse(`${module}-template.csv`, csv);
}
