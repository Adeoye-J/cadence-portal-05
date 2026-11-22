import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paystack signs each webhook body with HMAC-SHA512 using the secret key, and sends the
 * hex digest in the x-paystack-signature header. Compare in constant time. Verify
 * the raw body, not a re-serialised one.
 */
export function verifyPaystackSignature(rawBody: string, signature: string | null, secretKey: string): boolean {
  if (!signature || !secretKey) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
