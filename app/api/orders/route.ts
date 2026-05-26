import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { createOrder, getOrders } from "@/services/order.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { parseDateRangeFromSearchParams } from "@/lib/date-filter";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

const ORDER_CREATE_NOT_FOUND_MESSAGES = new Set([
  "Customer not found",
  "Product not found",
  "Product variant not found",
]);

const ORDER_CREATE_BAD_REQUEST_MESSAGES = new Set([
  "Customer is required",
  "At least one item is required",
  "Invalid order payload",
  "Product is required",
  "Invalid product",
  "Invalid product variant",
  "Quantity must be at least 1",
  "Unit price is required for all items",
  "Invalid payment status",
  "Payment method is required for paid or partial payments.",
  "Partial payment amount must be greater than 0 and less than the order total.",
  "Paid orders require a positive total amount.",
  "Product variant mismatch",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExpectedCreateOrderError(message: string) {
  return (
    ORDER_CREATE_NOT_FOUND_MESSAGES.has(message) ||
    ORDER_CREATE_BAD_REQUEST_MESSAGES.has(message) ||
    message.startsWith("Select a variant for ") ||
    message.startsWith("Product variant is inactive:") ||
    message.startsWith("Insufficient stock for ")
  );
}

function getSafeErrorLog(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
    };
  }
  return {
    type: typeof err,
    message: typeof err === "string" ? err : "Non-Error throw",
  };
}

function getCreateOrderErrorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  if (!message || !isExpectedCreateOrderError(message)) {
    return { message: "Failed to create order", status: 500 };
  }
  return {
    message,
    status: ORDER_CREATE_NOT_FOUND_MESSAGES.has(message) ? 404 : 400,
  };
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.VIEW_ORDERS)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    const sp = req.nextUrl.searchParams;
    const range = parseDateRangeFromSearchParams(sp);
    const result = await getOrders({
      search: sp.get("search") ?? undefined,
      status: sp.get("status") ?? undefined,
      paymentStatus: sp.get("paymentStatus") ?? undefined,
      customerId: sp.get("customerId") ? Number(sp.get("customerId")) : undefined,
      from: range.startDate ?? undefined,
      to: range.endDate ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return NextResponse.json(result);
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.CREATE_ORDER)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      await guardReadOnlyWrite(user.businessId!);
    } catch (guardErr) {
      if (guardErr instanceof SubscriptionGuardError) {
        return NextResponse.json({ error: guardErr.message, code: guardErr.code }, { status: guardErr.status });
      }
      throw guardErr;
    }

    try {
      const body = await req.json();
      if (!isRecord(body)) {
        return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
      }
      if (!body.customerId) {
        return NextResponse.json({ error: "Customer is required" }, { status: 400 });
      }
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
      }
      const order = await createOrder(
        body as unknown as Parameters<typeof createOrder>[0],
        user.id
      );
      return NextResponse.json({ order });
    } catch (err) {
      if (err instanceof SubscriptionGuardError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }
      console.error("Error creating order", getSafeErrorLog(err));
      const { message, status } = getCreateOrderErrorResponse(err);
      return NextResponse.json({ error: message }, { status });
    }
  });
}
