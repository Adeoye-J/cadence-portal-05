import { DrizzleOutbox } from "@/server/outbox-drizzle";
import type { OutboxStore } from "@/server/outbox";

/**
 * The notification queue the cron job drains. Rows are added by the store commands, in the same transaction as the
 * change that causes them (see server/effects.ts). Nothing listens for events any more.
 */
export const outbox: OutboxStore = new DrizzleOutbox();
