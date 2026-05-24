import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// VPS/Self-hosted note: Files are stored locally in public/uploads/.
// Ensure persistent disk storage and regular backups for upload directory.

const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]);
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_SETTINGS);
  if (auth instanceof NextResponse) return auth;
  try {
    const form = await req.formData();
    const file = form.get("file");
    const type = (form.get("type") as string | null) ?? "main";
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, or SVG files are allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }
    const ext = path.extname(file.name) || ".png";
    const safeExt = /^\.[a-zA-Z0-9]{1,8}$/.test(ext) ? ext.toLowerCase() : ".png";
    const safeType = type === "print" ? "print" : type === "email-header" ? "email-header" : "main";
    const filename = `${safeType}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`;
    const dir = path.join(process.cwd(), "public", "uploads", "logos");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    const url = `/uploads/logos/${filename}`;
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
