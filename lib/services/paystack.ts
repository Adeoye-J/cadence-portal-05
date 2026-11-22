import { z } from "zod";
import { env } from "@/lib/env";
import { verifyPaystackSignature } from "@/lib/services/paystack-signature";
import { PaymentProviderError, type PaymentProvider, type VerifiedCharge } from "@/lib/services/payments";

const API = "https://api.paystack.co";

const initializeResponse = z.object({
  status: z.boolean(),
  data: z.object({ authorization_url: z.url() }),
});

const verifyResponse = z.object({
  status: z.boolean(),
  data: z.object({
    reference: z.string(),
    status: z.string(),
    amount: z.number().int(),
    currency: z.string(),
  }),
});

function secretKey(): string {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new PaymentProviderError("Card payments are not set up yet. Try again later.", false);
  }
  return env.PAYSTACK_SECRET_KEY;
}

async function request(path: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new PaymentProviderError("The payment provider is not responding. Try again.", res.status >= 500);
  }
  return res.json();
}

function mapStatus(status: string): VerifiedCharge["status"] {
  if (status === "success" || status === "failed" || status === "abandoned") return status;
  return "pending";
}

/** Paystack adapter. Amounts are sent in minor units (kobo, cents), as Paystack expects. */
export const paystack: PaymentProvider = {
  name: "paystack",

  async initiate(input) {
    const json = initializeResponse.parse(
      await request("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
          email: input.email,
          amount: input.amountMinor,
          currency: input.currency,
          reference: input.reference,
          callback_url: input.callbackUrl,
          metadata: input.metadata,
        }),
      }),
    );
    return { authorizationUrl: json.data.authorization_url };
  },

  async verify(reference) {
    const json = verifyResponse.parse(
      await request(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" }),
    );
    return {
      reference: json.data.reference,
      status: mapStatus(json.data.status),
      amountMinor: json.data.amount,
      currency: json.data.currency,
    };
  },
};

/** Returns false when the secret is not set, so an unconfigured server rejects every webhook. */
export function verifyPaystackWebhook(rawBody: string, signature: string | null): boolean {
  return verifyPaystackSignature(rawBody, signature, env.PAYSTACK_SECRET_KEY ?? "");
}
