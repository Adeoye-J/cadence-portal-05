import { z } from "zod";

/**
 * Server environment schema. Pure: no import-time side effects, so it can be tested directly.
 * lib/env.ts parses process.env with it once, at startup.
 *
 * An empty value (VARIABLE=) counts as unset. A copied .env.example therefore does not fail
 * on its blank optional lines.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ error: "must be a valid postgres:// URL" }),
  AUTH_SECRET: z.string({ error: "is required" }).min(32, { error: "must be at least 32 characters" }),
  APP_URL: z.url({ error: "must be an absolute URL" }),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  /** Development only. Enables a seeded viewer in lib/session.ts. Ignored in production. */
  DEV_DEMO_VIEWER: z.enum(["1", "client", "studio"]).optional(),
  /** Shared secret for the scheduled jobs. Requests without it are refused. */
  CRON_SECRET: z.string().min(16, { error: "must be at least 16 characters" }).optional(),
  /** S3-compatible object storage: Cloudflare R2 (https) or MinIO for local work (http). Path-style URLs. */
  STORAGE_ENDPOINT_URL: z.url().optional(),
  STORAGE_BUCKET: z.string().min(1).optional(),
  STORAGE_REGION: z.string().min(1).optional(),
  STORAGE_ACCESS_KEY_ID: z.string().min(1).optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  /** Address shown on the contact page. Blank means the contact page says contact details are not set up. */
  SUPPORT_EMAIL: z.email({ error: "must be an email address" }).optional(),
  /** Google sign-in. Set both values or neither. */
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
}).refine((v) => Boolean(v.GOOGLE_CLIENT_ID) === Boolean(v.GOOGLE_CLIENT_SECRET), {
  error: "set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither",
});

export type ServerEnv = z.infer<typeof serverSchema>;

/** Treats blank values as unset, then validates. Throws one message that names every bad variable. */
export function parseServerEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
  const cleaned = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value === undefined || value.trim() === "" ? undefined : value]),
  );
  const result = serverSchema.safeParse(cleaned);
  if (!result.success) {
    const lines = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Cadence cannot start: invalid or missing environment variables.\n${lines}\nCopy .env.example to .env.local and fill in the values. Blank optional values can stay blank.`,
    );
  }
  return result.data;
}
