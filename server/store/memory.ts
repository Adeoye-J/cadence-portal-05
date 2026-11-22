import { createMemoryCore } from "@/server/core/memory";
import { MemoryOutbox, type OutboxStore } from "@/server/outbox";
import type { PendingSignupRecord, ProposalNoteRecord, SignatureRecord, Store } from "./types";

/** In-memory store. The default outside production, and what the unit tests use. Data resets on restart. */
export function createMemoryStore(options: { outbox?: OutboxStore } = {}): Store {
  const signatures = new Map<string, SignatureRecord>();
  const notes: ProposalNoteRecord[] = [];
  const pending = new Map<string, PendingSignupRecord>();
  const core = createMemoryCore(signatures, options.outbox ?? new MemoryOutbox());
  return {
    ...core,
    async getSignature(proposalId) {
      const found = signatures.get(proposalId);
      return found ? { ...found } : null;
    },
    async insertSignature(record) {
      if (signatures.has(record.proposalId)) return false;
      signatures.set(record.proposalId, { ...record });
      return true;
    },
    async addNote(note, effects) {
      notes.push({ ...note });
      if (effects) await core.appendEffects(effects);
    },
    async listNotes(proposalId) {
      return notes.filter((n) => n.proposalId === proposalId).map((n) => ({ ...n }));
    },
    async putPendingSignup(record) {
      pending.set(record.email, { ...record });
    },
    async getPendingSignup(email) {
      const found = pending.get(email);
      return found ? { ...found } : null;
    },
    async takePendingSignup(email) {
      const found = pending.get(email) ?? null;
      pending.delete(email);
      return found;
    },
  };
}
