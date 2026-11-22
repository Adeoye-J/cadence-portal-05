/**
 * Payment provider interface. Adapters (Paystack, later Flutterwave) implement
 * this. Business logic depends only on it, so tests can use a fake (tests/support).
 * No environment access here, so this module can be imported anywhere.
 */

export type PaymentCurrency = "USD" | "NGN";

export type InitiateInput = {
  reference: string;
  email: string;
  amountMinor: number;
  currency: PaymentCurrency;
  callbackUrl: string;
  metadata: Record<string, string>;
};

export type InitiateResult = { authorizationUrl: string };

export type VerifiedCharge = {
  reference: string;
  status: "success" | "failed" | "abandoned" | "pending";
  amountMinor: number;
  currency: string;
};

export interface PaymentProvider {
  readonly name: string;
  initiate(input: InitiateInput): Promise<InitiateResult>;
  /** Asks the provider for the charge's current state. Never trust a webhook body alone. */
  verify(reference: string): Promise<VerifiedCharge>;
}

/** Errors whose message is safe to show to the user. `retryable` marks transient failures. */
export class PaymentProviderError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = "PaymentProviderError";
  }
}
