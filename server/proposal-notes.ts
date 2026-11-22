import { randomUUID } from "node:crypto";
import type { Effects } from "@/server/core/types";
import { getStore } from "@/server/store/registry";
import type { NoteKind, ProposalNoteRecord } from "@/server/store/types";

/**
 * Client notes on a proposal: general notes, notes on a section, and requests for changes. Kept in the store so the
 * studio can read them.
 */
export type ProposalNoteKind = NoteKind;
export type ProposalNote = ProposalNoteRecord;

export async function addProposalNote(
  input: Omit<ProposalNote, "id" | "createdAt">,
  effects?: Effects,
  now: Date = new Date(),
): Promise<ProposalNote> {
  const note: ProposalNote = { ...input, id: randomUUID(), createdAt: now.toISOString() };
  await getStore().addNote(note, effects);
  return note;
}

export async function listProposalNotes(proposalId: string): Promise<ProposalNote[]> {
  return getStore().listNotes(proposalId);
}
