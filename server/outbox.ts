import { randomUUID } from "node:crypto";

/**
 * Email outbox: the queue behind notifications. Pure logic, so the retry rules are tested directly.
 * Two stores implement OutboxStore: MemoryOutbox (tests and local runs) and DrizzleOutbox (production).
 *
 * Delivery is at least once. A crash between a successful send and markSent can send the same email
 * again. The dedupe key stops the same event from being queued twice, but not from being sent twice in that case.
 */

export const MAX_ATTEMPTS = 5;

export type OutboxInput = {
  dedupeKey: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type OutboxMessage = OutboxInput & {
  id: string;
  attempts: number;
  status: "pending" | "sent" | "dead";
  nextAttemptAt: string;
  lastErrorCode?: string;
};

export interface OutboxStore {
  /** Returns false when a message with the same dedupe key already exists. */
  enqueue(input: OutboxInput, now: Date): Promise<boolean>;
  claimDue(now: Date, limit: number): Promise<OutboxMessage[]>;
  markSent(id: string, now: Date): Promise<void>;
  /** Records a failed attempt. Returns "dead" once MAX_ATTEMPTS is reached, otherwise "retry". */
  markFailed(id: string, errorCode: string, now: Date): Promise<"retry" | "dead">;
}

export type Sender = {
  send(email: { to: string; subject: string; text: string; html: string }): Promise<void>;
};

/** Wait after the nth failed attempt: 2, 4, 8, 16 minutes, capped at an hour. */
export function backoffMs(attempts: number): number {
  return Math.min(60 * 60_000, 2 ** attempts * 60_000);
}

/** A short, safe error code. Only a plain error name is kept. Messages can contain addresses, so they are dropped. */
export function errorCode(err: unknown): string {
  if (err instanceof Error && /^[A-Za-z]{1,40}$/.test(err.name)) return err.name;
  return "SendError";
}

export type DrainResult = { sent: number; retried: number; dead: number };

/** Sends due messages. A failure is recorded and retried later, and never stops the rest of the batch. */
export async function drain(store: OutboxStore, sender: Sender, now: Date, limit = 50): Promise<DrainResult> {
  const result: DrainResult = { sent: 0, retried: 0, dead: 0 };
  for (const message of await store.claimDue(now, limit)) {
    try {
      await sender.send({ to: message.to, subject: message.subject, text: message.text, html: message.html });
      await store.markSent(message.id, now);
      result.sent += 1;
    } catch (err) {
      const outcome = await store.markFailed(message.id, errorCode(err), now);
      if (outcome === "dead") result.dead += 1;
      else result.retried += 1;
    }
  }
  return result;
}

/** In-memory store for tests and local runs. Not shared between processes. */
export class MemoryOutbox implements OutboxStore {
  private readonly rows: OutboxMessage[] = [];
  private readonly keys = new Set<string>();

  async enqueue(input: OutboxInput, now: Date): Promise<boolean> {
    if (this.keys.has(input.dedupeKey)) return false;
    this.keys.add(input.dedupeKey);
    this.rows.push({ ...input, id: randomUUID(), attempts: 0, status: "pending", nextAttemptAt: now.toISOString() });
    return true;
  }

  async claimDue(now: Date, limit: number): Promise<OutboxMessage[]> {
    return this.rows
      .filter((r) => r.status === "pending" && new Date(r.nextAttemptAt) <= now)
      .sort((a, b) => a.nextAttemptAt.localeCompare(b.nextAttemptAt))
      .slice(0, limit);
  }

  async markSent(id: string): Promise<void> {
    const row = this.rows.find((r) => r.id === id);
    if (row) row.status = "sent";
  }

  async markFailed(id: string, code: string, now: Date): Promise<"retry" | "dead"> {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return "dead";
    row.attempts += 1;
    row.lastErrorCode = code;
    if (row.attempts >= MAX_ATTEMPTS) {
      row.status = "dead";
      return "dead";
    }
    row.nextAttemptAt = new Date(now.getTime() + backoffMs(row.attempts)).toISOString();
    return "retry";
  }

  /** Test helper. A copy of every row. */
  snapshot(): OutboxMessage[] {
    return this.rows.map((r) => ({ ...r }));
  }
}
