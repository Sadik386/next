import { PaymentProvider, PaymentSession, PaymentResult, RefundResult } from "./types";

export class NagadProvider implements PaymentProvider {
  name = "nagad";

  async initiate(amount: number, orderId: string): Promise<PaymentSession> {
    return {
      sessionId: `ng_${Math.random().toString(36).substring(7)}`,
      redirectUrl: "https://example.com/nagad/pay",
      expiresAt: new Date(Date.now() + 30 * 60000),
    };
  }

  async verify(sessionId: string): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `NG-${Date.now()}`,
      amount: 100,
      currency: "BDT",
      paidAt: new Date(),
    };
  }

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    return {
      success: true,
      refundId: `RF-NG-${Date.now()}`,
      amount,
    };
  }
}
