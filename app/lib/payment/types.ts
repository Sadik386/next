export interface PaymentSession {
  sessionId: string;
  redirectUrl?: string;
  qrCode?: string;
  expiresAt: Date;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  paidAt: Date;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
}

export interface PaymentProvider {
  name: string;
  initiate(amount: number, orderId: string): Promise<PaymentSession>;
  verify(sessionId: string): Promise<PaymentResult>;
  refund(transactionId: string, amount: number): Promise<RefundResult>;
}
