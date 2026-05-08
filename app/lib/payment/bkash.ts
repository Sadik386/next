import { PaymentProvider, PaymentSession, PaymentResult, RefundResult } from "./types";

export class BkashProvider implements PaymentProvider {
  name = "bkash";

  async initiate(amount: number, orderId: string): Promise<PaymentSession> {
    // Structure only - no implementation yet
    return {
      sessionId: `bk_${Math.random().toString(36).substring(7)}`,
      redirectUrl: "https://example.com/bkash/pay",
      expiresAt: new Date(Date.now() + 30 * 60000),
    };
  }

  async verify(sessionId: string): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `BK-${Date.now()}`,
      amount: 100,
      currency: "BDT",
      paidAt: new Date(),
    };
  }

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    return {
      success: true,
      refundId: `RF-${Date.now()}`,
      amount,
    };
  }
}
