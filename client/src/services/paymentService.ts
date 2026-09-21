import type { PaymentStatus } from "@/types/domain";

export type PaymentMethod = "pix" | "card";

export type CheckoutResult = {
  checkoutId: string;
  status: PaymentStatus;
  mode: "mock";
};

export interface PaymentService {
  createCheckout(publicCode: string, method: PaymentMethod): Promise<CheckoutResult>;
  getPaymentStatus(checkoutId: string): Promise<PaymentStatus>;
}

export class MockPaymentService implements PaymentService {
  async createCheckout(publicCode: string, _method: PaymentMethod): Promise<CheckoutResult> {
    return { checkoutId: `mock-${publicCode}`, status: "awaiting_payment", mode: "mock" };
  }

  async getPaymentStatus(_checkoutId: string): Promise<PaymentStatus> {
    return "awaiting_payment";
  }
}

export const paymentService: PaymentService = new MockPaymentService();
