# 0004: Payments

**Status:** Accepted. Paystack is implemented in code and not yet run. Provider keys are needed from the client. Flutterwave is not built.

**Context.** Section 0 of the brief names Paystack as primary and Flutterwave as fallback. Section 3 names Stripe. The product is for a studio working with clients in Nigeria and abroad, and screens show both `₦` and `$`.

**Decision.** **Paystack** for NGN payments and as primary. **Flutterwave** as fallback when Paystack is unavailable or declines a payment method the client needs. **Stripe is not used.** Section 0 is more specific to this product, so it overrides Section 3.

**Rules that follow from the brief.** Webhook signatures are verified before any event is read. Events are idempotent: each provider reference is stored, and a repeat event does nothing. Payment state is set from the webhook, never from the client redirect. A client redirect shows "processing" until the webhook confirms.

**Open question.** Confirm which currencies each provider settles in for the studio's account. The designs allow USD, so a USD route through Flutterwave may be needed.

**Consequences.** Two integrations behind one service interface in `lib/services/payments.ts` (not yet built), with the same states: `pending`, `processing`, `paid`, `failed`, `refunded`.
