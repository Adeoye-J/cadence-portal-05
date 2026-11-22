import {
  PaymentProviderError,
  type InitiateInput,
  type PaymentProvider,
  type VerifiedCharge,
} from "@/lib/services/payments";

/**
 * Test double for a payment provider. Records what was started and returns
 * charges the test sets. An unknown reference fails the lookup, as the real API would.
 */
export class FakePaymentProvider implements PaymentProvider {
  readonly name = "fake";
  readonly initiated: InitiateInput[] = [];
  private readonly charges = new Map<string, VerifiedCharge>();

  setCharge(charge: VerifiedCharge): void {
    this.charges.set(charge.reference, charge);
  }

  async initiate(input: InitiateInput): Promise<{ authorizationUrl: string }> {
    this.initiated.push(input);
    return { authorizationUrl: `https://checkout.example/${input.reference}` };
  }

  async verify(reference: string): Promise<VerifiedCharge> {
    const charge = this.charges.get(reference);
    if (!charge) throw new PaymentProviderError("Provider lookup failed.", true);
    return charge;
  }
}
