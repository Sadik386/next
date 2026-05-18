import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { prisma } from "@/lib/prisma";
import { generateSupplierId } from "@/services/supplier.service";
import { getCellTrimmed, ImportResult, parseCsv } from "@/lib/csv";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

type MfsProvider = "bKash" | "Nagad" | "Rocket" | "Upay";

interface PaymentMethod {
  type: "MFS" | "BANK";
  provider?: MfsProvider;
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  branchName?: string;
  routingNumber?: string;
  swiftCode?: string;
}

function parsePaymentMethods(value: string): PaymentMethod[] | null {
  if (!value || !value.trim()) return null;

  // Try JSON format first
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as PaymentMethod[];
  } catch {
    // Not valid JSON, try pipe format
  }

  // Pipe format: MFS:bKash:017XXXXXXXX | MFS:Nagad:018XXXXXXXX | BANK:Dutch Bangla Bank:ABC Supplier:123456:Chittagong
  const methods: PaymentMethod[] = [];
  const parts = value.split("|").map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const tokens = part.split(":").map((t) => t.trim()).filter(Boolean);
    if (tokens.length < 2) continue;

    const type = tokens[0].toUpperCase();
    if (type === "MFS") {
      if (tokens.length >= 3) {
        const provider = tokens[1] as MfsProvider;
        if (["bKash", "Nagad", "Rocket", "Upay"].includes(provider)) {
          methods.push({ type: "MFS", provider, accountNumber: tokens[2] });
        }
      }
    } else if (type === "BANK") {
      methods.push({
        type: "BANK",
        bankName: tokens[1] || "",
        accountName: tokens[2] || "",
        accountNumber: tokens[3] || "",
        branchName: tokens[4] || "",
        routingNumber: tokens[5] || "",
        swiftCode: tokens[6] || "",
      });
    }
  }

  return methods.length ? methods : null;
}

function mapLegacyToPaymentMethods(row: Record<string, string>): PaymentMethod[] {
  const methods: PaymentMethod[] = [];

  // Bank fields
  const bankName = getCellTrimmed(row, "Bank Name");
  const bankAccount = getCellTrimmed(row, "Bank Account");
  const accountName = getCellTrimmed(row, "Account Name");
  const branchName = getCellTrimmed(row, "Branch Name");
  const routingNumber = getCellTrimmed(row, "Routing Number");
  const swiftCode = getCellTrimmed(row, "SWIFT Code");

  if (bankName || bankAccount) {
    methods.push({
      type: "BANK",
      bankName: bankName || "",
      accountName: accountName || "",
      accountNumber: bankAccount || "",
      branchName: branchName || "",
      routingNumber: routingNumber || "",
      swiftCode: swiftCode || "",
    });
  }

  // MFS fields
  const bkash = getCellTrimmed(row, "Bkash");
  const nagad = getCellTrimmed(row, "Nagad");
  const rocket = getCellTrimmed(row, "Rocket");
  const upay = getCellTrimmed(row, "Upay");

  if (bkash) methods.push({ type: "MFS", provider: "bKash", accountNumber: bkash });
  if (nagad) methods.push({ type: "MFS", provider: "Nagad", accountNumber: nagad });
  if (rocket) methods.push({ type: "MFS", provider: "Rocket", accountNumber: rocket });
  if (upay) methods.push({ type: "MFS", provider: "Upay", accountNumber: upay });

  return methods;
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.BULK_IMPORT_SUPPLIERS);
  if (auth instanceof NextResponse) return auth;

  if (!checkRateLimit(`import:${auth.businessId}`, { windowMs: 60 * 1000, maxRequests: 3 })) {
    return NextResponse.json(getRateLimitResponse("Too many import requests. Wait a minute."), { status: 429 });
  }

  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;
  const businessId = auth.businessId;

  return runWithBusinessContext(user, async () => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCsv(text);

    const result: ImportResult = { created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      // Validate required fields
      const errors: string[] = [];
      const companyName = getCellTrimmed(row, "Company Name*");
      const contactName = getCellTrimmed(row, "Contact Name*");
      const mobile = getCellTrimmed(row, "Mobile*");
      const paymentTerms = getCellTrimmed(row, "Payment Terms*");
      const currency = getCellTrimmed(row, "Currency*");
      const country = getCellTrimmed(row, "Country*");
      const status = getCellTrimmed(row, "Status*") || "active";

      if (!companyName) errors.push("Company name is required.");
      if (!contactName) errors.push("Contact name is required.");
      if (!mobile) errors.push("Mobile number is required.");
      if (!paymentTerms) errors.push("Payment terms is required.");
      if (!currency) errors.push("Currency is required.");
      if (!country) errors.push("Country is required.");

      if (errors.length > 0) {
        result.skipped++;
        result.errors.push({ row: rowNumber, message: errors.join(" ") });
        continue;
      }

      try {
        // Get paymentMethods - prefer new column, fallback to legacy fields
        const paymentMethodsStr = getCellTrimmed(row, "Payment Methods");
        let paymentMethods = parsePaymentMethods(paymentMethodsStr);

        // If no paymentMethods column or empty, try legacy fields
        if (!paymentMethods) {
          const legacyHasData =
            getCellTrimmed(row, "Bank Name") ||
            getCellTrimmed(row, "Bank Account") ||
            getCellTrimmed(row, "Bkash") ||
            getCellTrimmed(row, "Nagad") ||
            getCellTrimmed(row, "Rocket") ||
            getCellTrimmed(row, "Upay");
          if (legacyHasData) {
            paymentMethods = mapLegacyToPaymentMethods(row);
          }
        }

        const supplierId = await generateSupplierId();
        await prisma.supplier.create({
          data: {
            businessId,
            supplierId,
            companyName,
            contactName,
            email: getCellTrimmed(row, "Email") || null,
            mobile,
            website: getCellTrimmed(row, "Website") || null,
            taxId: getCellTrimmed(row, "Tax ID") || null,
            paymentTerms,
            currency,
            paymentMethods: paymentMethods ? (paymentMethods as unknown as object) : undefined,
            // Legacy fields - store for backward compatibility
            bankName: getCellTrimmed(row, "Bank Name") || null,
            bankAccount: getCellTrimmed(row, "Bank Account") || null,
            accountName: getCellTrimmed(row, "Account Name") || null,
            branchName: getCellTrimmed(row, "Branch Name") || null,
            routingNumber: getCellTrimmed(row, "Routing Number") || null,
            swiftCode: getCellTrimmed(row, "SWIFT Code") || null,
            bkash: getCellTrimmed(row, "Bkash") || null,
            nagad: getCellTrimmed(row, "Nagad") || null,
            rocket: getCellTrimmed(row, "Rocket") || null,
            upay: getCellTrimmed(row, "Upay") || null,
            category: getCellTrimmed(row, "Category") || null,
            deliveryMethod: getCellTrimmed(row, "Delivery Method") || null,
            streetAddress: getCellTrimmed(row, "Street Address") || null,
            city: getCellTrimmed(row, "City") || null,
            state: getCellTrimmed(row, "State") || null,
            zipCode: getCellTrimmed(row, "Zip Code") || null,
            country,
            status,
          },
        });

        result.created++;
      } catch (err) {
        result.skipped++;
        console.error(`Error processing row ${rowNumber}:`, err);
        result.errors.push({
          row: rowNumber,
          message: err instanceof Error ? err.message : "Failed to import row",
        });
      }
    }

    return NextResponse.json(result);
  });
}