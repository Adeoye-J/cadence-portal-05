import { timingSafeEqual } from "node:crypto";

/**
 * True only when the Authorization header equals "Bearer <secret>". Vercel cron sends this form.
 * The comparison is constant-time, and an unset secret refuses every request.
 */
export function isCronAuthorised(header: string | null, secret: string | undefined): boolean {
  if (!secret) return false;
  const given = Buffer.from(header ?? "", "utf8");
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
