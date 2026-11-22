import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { db as DbClient } from "@/db/client";
import { pendingSignups, proposalNotes, signatures as signatureRows } from "@/db/schema";
import { applyEffects, createDrizzleCore } from "@/server/core/drizzle";
import type { PendingSignupRecord, ProposalNoteRecord, SignatureRecord, Store } from "./types";

type Db = typeof DbClient;

/**
 * The Postgres store. Requires the migration that adds proposal_notes and pending_signups (pnpm db:generate, then
 * pnpm db:migrate). Signatures use the table that already exists.
 */
export function createDrizzleStore(database: Db): Store {
  return {
    ...createDrizzleCore(database),
    async getSignature(proposalId) {
      const [row] = await database.select().from(signatureRows).where(eq(signatureRows.proposalId, proposalId)).limit(1);
      if (!row) return null;
      const record: SignatureRecord = {
        proposalId: row.proposalId,
        signerUserId: row.signerUserId,
        typedName: row.typedName,
        documentSha256: row.documentSha256,
        signedAt: row.signedAt.toISOString(),
      };
      return record;
    },
    async insertSignature(record) {
      // The unique index on proposal_id makes this race-safe: only one insert can win.
      const inserted = await database
        .insert(signatureRows)
        .values({
          id: `sig_${randomUUID().slice(0, 16)}`,
          proposalId: record.proposalId,
          signerUserId: record.signerUserId,
          typedName: record.typedName,
          documentSha256: record.documentSha256,
          signedAt: new Date(record.signedAt),
        })
        .onConflictDoNothing()
        .returning({ id: signatureRows.id });
      return inserted.length === 1;
    },
    async addNote(note, effects) {
      await database.transaction(async (tx) => {
        await tx.insert(proposalNotes).values({
          id: note.id,
          proposalId: note.proposalId,
          projectId: note.projectId,
          authorUserId: note.authorUserId,
          kind: note.kind,
          sectionRef: note.sectionRef,
          body: note.body,
          createdAt: new Date(note.createdAt),
        });
        await applyEffects(tx as unknown as Db, effects);
      });
    },
    async listNotes(proposalId) {
      const rows = await database.select().from(proposalNotes).where(eq(proposalNotes.proposalId, proposalId));
      return rows.map(
        (r): ProposalNoteRecord => ({
          id: r.id,
          proposalId: r.proposalId,
          projectId: r.projectId,
          authorUserId: r.authorUserId,
          kind: r.kind,
          sectionRef: r.sectionRef,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
        }),
      );
    },
    async putPendingSignup(record) {
      const values = {
        email: record.email,
        fullName: record.fullName,
        studioName: record.studioName,
        country: record.country,
        currency: record.currency,
        createdAt: new Date(record.createdAt),
      };
      await database.insert(pendingSignups).values(values).onConflictDoUpdate({ target: pendingSignups.email, set: values });
    },
    async getPendingSignup(email) {
      const [row] = await database.select().from(pendingSignups).where(eq(pendingSignups.email, email)).limit(1);
      return row ? toPending(row) : null;
    },
    async takePendingSignup(email) {
      // DELETE ... RETURNING: one statement, so two callers cannot both take the same sign-up.
      const [row] = await database.delete(pendingSignups).where(eq(pendingSignups.email, email)).returning();
      return row ? toPending(row) : null;
    },
  };
}

function toPending(row: typeof pendingSignups.$inferSelect): PendingSignupRecord {
  return {
    email: row.email,
    fullName: row.fullName,
    studioName: row.studioName,
    country: row.country,
    currency: row.currency === "NGN" ? "NGN" : "USD",
    createdAt: row.createdAt.toISOString(),
  };
}
