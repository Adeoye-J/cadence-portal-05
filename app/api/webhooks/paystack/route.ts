import { z } from "zod";
import { paystack, verifyPaystackWebhook } from "@/lib/services/paystack";
import { settlePayment } from "@/server/payments";
import { settleSubscription } from "@/server/billing";
import { billingDeps } from "@/server/billing-runtime";

export const runtime = "nodejs";

const eventSchema = z.object({
  event: z.string(),
  data: z.object({ reference: z.string() }),
});

/**
 * Paystack webhook. Configure the dashboard URL as {APP_URL}/api/webhooks/paystack.
 * Checks the signature on the raw body, then settles from a provider lookup, not from
 * the body. Unknown events are acknowledged with 200 so the provider stops retrying.
 * Logs carry the outcome only, never the payer's details.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyPaystackWebhook(raw, request.headers.get("x-paystack-signature"))) {
    return new Response(null, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  const event = eventSchema.safeParse(body);
  if (!event.success || event.data.event !== "charge.success") {
    return new Response(null, { status: 200 });
  }

  try {
    const reference = event.data.data.reference;
    const outcome = reference.startsWith("sub_")
      ? await settleSubscription(billingDeps(), reference)
      : await settlePayment(reference, paystack);
    console.info(`[paystack webhook] outcome=${outcome}`);
  } catch {
    // Non-2xx makes Paystack retry the event later.
    console.error("[paystack webhook] provider lookup failed; asking for retry");
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 200 });
}
