import { parseServerEnv, type ServerEnv } from "@/lib/env-schema";

export type { ServerEnv } from "@/lib/env-schema";

/**
 * Server environment, validated once when this module first loads (see instrumentation.ts).
 * Import it only from server code. Nothing here is NEXT_PUBLIC_, so it never reaches the browser.
 */
export const env: ServerEnv = parseServerEnv();
