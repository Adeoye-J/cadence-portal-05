import { randomUUID } from "node:crypto";
import { and, asc, eq, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { notificationOutbox } from "@/db/schema";
import { backoffMs, MAX_ATTEMPTS, type OutboxInput, type OutboxMessage, type OutboxStore } from "@/server/outbox";

/**
 * Production outbox on PostgreSQL. Not run yet: needs a generated and applied migration.
 * Unverified against the installed drizzle-orm version (docs/verification.md).
 */
export class DrizzleOutbox implements OutboxStore {
  async enqueue(input: OutboxInput, now: Date): Promise<boolean> {
    const inserted = await db
      .insert(notificationOutbox)
      .values({
        id: randomUUID(),
        dedupeKey: input.dedupeKey,
        toAddress: input.to,
        subject: input.subject,
        textBody: input.text,
        htmlBody: input.html,
        status: "pending",
        attempts: 0,
        nextAttemptAt: now,
      })
      .onConflictDoNothing({ target: notificationOutbox.dedupeKey })
      .returning({ id: notificationOutbox.id });
    return inserted.length > 0;
  }

  async claimDue(now: Date, limit: number): Promise<OutboxMessage[]> {
    const rows = await db
      .select()
      .from(notificationOutbox)
      .where(and(eq(notificationOutbox.status, "pending"), lte(notificationOutbox.nextAttemptAt, now)))
      .orderBy(asc(notificationOutbox.nextAttemptAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      dedupeKey: r.dedupeKey,
      to: r.toAddress,
      subject: r.subject,
      text: r.textBody,
      html: r.htmlBody,
      attempts: r.attempts,
      status: r.status,
      nextAttemptAt: r.nextAttemptAt.toISOString(),
      lastErrorCode: r.lastErrorCode ?? undefined,
    }));
  }

  async markSent(id: string, now: Date): Promise<void> {
    await db
      .update(notificationOutbox)
      .set({ status: "sent", sentAt: now })
      .where(eq(notificationOutbox.id, id));
  }

  async markFailed(id: string, errorCodeValue: string, now: Date): Promise<"retry" | "dead"> {
    const [row] = await db
      .select({ attempts: notificationOutbox.attempts })
      .from(notificationOutbox)
      .where(eq(notificationOutbox.id, id))
      .limit(1);
    const attempts = (row?.attempts ?? 0) + 1;
    const dead = attempts >= MAX_ATTEMPTS;
    await db
      .update(notificationOutbox)
      .set({
        attempts,
        lastErrorCode: errorCodeValue,
        status: dead ? "dead" : "pending",
        nextAttemptAt: new Date(now.getTime() + backoffMs(attempts)),
      })
      .where(eq(notificationOutbox.id, id));
    return dead ? "dead" : "retry";
  }
}
