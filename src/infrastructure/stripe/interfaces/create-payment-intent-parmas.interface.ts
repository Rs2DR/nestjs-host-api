export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}
