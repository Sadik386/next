import { NextResponse } from "next/server";

export async function GET() {
  const docs = {
    version: "1.0.0",
    baseUrl: "/api/v1",
    endpoints: {
      auth: {
        token: {
          POST: "Generate a new API key (Requires user login)",
          GET: "List API keys for current business (Requires user login)"
        }
      },
      products: {
        GET: "List all products (Permission: read:products)"
      },
      orders: {
        GET: "List all orders (Permission: read:orders)",
        POST: "Create a new order (Permission: write:orders)"
      },
      customers: {
        GET: "List all customers (Permission: read:customers)",
        POST: "Create a new customer (Permission: write:customers)"
      },
      inventory: {
        GET: "List stock levels (Permission: read:inventory)"
      },
      webhooks: {
        GET: "List registered webhooks (Permission: admin)",
        POST: "Register a new webhook (Permission: admin)",
        trigger: {
          POST: "Manually trigger a webhook event for testing (Requires user login)"
        }
      }
    },
    webhookEvents: [
      "order.created",
      "order.updated",
      "order.cancelled",
      "order.paid",
      "product.created",
      "product.updated",
      "stock.low",
      "stock.out",
      "customer.created",
      "payment.received",
      "delivery.dispatched"
    ]
  };

  return NextResponse.json(docs);
}
