import { PaymentProvider, PaymentSession, PaymentResult, RefundResult } from "./types";

export class StripeProvider implements PaymentProvider {
  name = "stripe";

  async initiate(amount: number, orderId: string): Promise<PaymentSession> {
    return {
      sessionId: `cs_${Math.random().toString(36).substring(7)}`,
      redirectUrl: "https://example.com/stripe/checkout",
      expiresAt: new Date(Date.now() + 30 * 60000),
    };
  }

  async verify(sessionId: string): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `ST-${Date.now()}`,
      amount: 100,
      currency: "USD",
      paidAt: new Date(),
    };
  }

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    return {
      success: true,
      refundId: `RF-ST-${Date.now()}`,
      amount,
    };
  }
}
