import type { CoreStore, Effects } from "@/server/core/types";

/**
 * The records the store keeps. Each store method is one unit of work: a method either happens completely or not at all.
 */

export type SignatureRecord = {
  proposalId: string;
  signerUserId: string;
  typedName: string;
  documentSha256: string;
  signedAt: string;
};

export type NoteKind = "general" | "section" | "change";

export type ProposalNoteRecord = {
  id: string;
  proposalId: string;
  projectId: string;
  authorUserId: string;
  kind: NoteKind;
  sectionRef: string | null;
  body: string;
  createdAt: string;
};

export type PendingSignupRecord = {
  email: string;
  fullName: string;
  studioName: string;
  country: string;
  currency: "USD" | "NGN";
  createdAt: string;
};

export interface Store extends CoreStore {
  getSignature(proposalId: string): Promise<SignatureRecord | null>;
  /** Records a signature only if the proposal has none. False when one already exists. Race-safe. */
  insertSignature(record: SignatureRecord): Promise<boolean>;

  addNote(note: ProposalNoteRecord, effects?: Effects): Promise<void>;
  listNotes(proposalId: string): Promise<ProposalNoteRecord[]>;

  putPendingSignup(record: PendingSignupRecord): Promise<void>;
  getPendingSignup(email: string): Promise<PendingSignupRecord | null>;
  /** Removes and returns the pending sign-up for an email. Atomic: a second caller gets null. */
  takePendingSignup(email: string): Promise<PendingSignupRecord | null>;
}
