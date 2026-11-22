import type { Currency, MilestoneStatus, ProjectStage, ProposalDeliverable } from "@/db/schema";
import type { PaymentCurrency } from "@/lib/services/payments";
import type { EventAudience, NewEvent, ProjectEvent } from "@/server/event-types";
import type { OutboxInput } from "@/server/outbox";

/**
 * The core domain records and the commands that change them. Each command is one unit of work: it happens completely
 * or not at all, and a command that depends on a current state checks that state in the same statement.
 */

export type StudioRole = "owner" | "admin" | "member" | "viewer";

export type MilestoneRecord = {
  position: number;
  title: string;
  description?: string;
  terms?: string;
  amountMinor: number;
  status: MilestoneStatus;
  dueDate?: string;
};

export type ProjectRecord = {
  id: string;
  studioId: string;
  reference: string;
  title: string;
  studioName: string;
  clientName: string;
  currency: Currency;
  stage: ProjectStage;
  contactUserIds: string[];
  milestones: MilestoneRecord[];
};

export type DeliverableRecord = ProposalDeliverable;

export type ProposalRecord = {
  id: string;
  projectId: string;
  version: number;
  issuedOn: string;
  revisionTerms: string;
  status: "draft" | "sent" | "signed";
  startOn?: string;
  endOn?: string;
  termsLabel?: string;
  revisionRounds?: string;
  revisionSummary?: string;
  deliverables?: DeliverableRecord[];
};

export type MembershipRecord = { studioId: string; studioName: string; role: StudioRole };
export type MemberRecord = { userId: string; role: StudioRole; email: string | null };

/** What a change leaves behind, written in the same transaction as the change. */
export type Effects = { events: NewEvent[]; outbox: OutboxInput[] };

export type InvitationRecord = {
  id: string;
  projectId: string;
  email: string;
  tokenHash: string;
  invitedByUserId: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  revoked: boolean;
};

export type ChangeRequestRecord = {
  id: string;
  projectId: string;
  position: number;
  body: string;
  createdAt: string;
  reply?: { body: string; repliedAt: string };
};

export type FileRecord = {
  id: string;
  projectId: string;
  position: number;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  status: "pending" | "ready";
  createdAt: string;
};

/** A payment that has been started and not settled or failed is open. Only one is open for a milestone at a time. */
export type PaymentRecord = {
  reference: string;
  projectId: string;
  milestonePosition: number;
  provider: string;
  amountMinor: number;
  currency: PaymentCurrency;
  status: "pending" | "paid" | "failed";
  createdAt: string;
  settledAt?: string;
  authorizationUrl?: string;
};

/** An open payment that is older than this is treated as abandoned, and a new payment may be started. */
export const OPEN_PAYMENT_TTL_MS = 30 * 60 * 1000;

export type NewDraftProject = {
  /** Ids may be chosen by the caller, so the creation event can name the project. */
  projectId?: string;
  proposalId?: string;
  studioId: string;
  clientName: string;
  title: string;
  currency: Currency;
  revisionTerms: string;
  milestones: { title: string; description?: string; amountMinor: number; dueDate?: string }[];
};

export type MilestoneTransition = {
  projectId: string;
  position: number;
  /** The status the milestone must be in now. If it is not, nothing changes. */
  from: MilestoneStatus;
  to: MilestoneStatus;
  /** Move the next milestone from upcoming to payment due. */
  activateNext?: boolean;
  /** Complete the project when every milestone is approved. */
  completeIfAllApproved?: boolean;
  /** Written with the change when it applies. */
  effects?: Effects;
  /** Written as well when this change completed the project. */
  completionEffects?: Effects;
  /** A change request recorded with the change when it applies. */
  changeRequest?: ChangeRequestRecord;
};
export type TransitionOutcome = { applied: boolean; projectCompleted: boolean };

export type SignatureCommit = {
  proposalId: string;
  signerUserId: string;
  typedName: string;
  documentSha256: string;
  signedAt: string;
};

export interface CoreStore {
  getMembership(userId: string): Promise<MembershipRecord | null>;
  listMembers(studioId: string): Promise<MemberRecord[]>;
  /** Email addresses by user id. Users with no address on file are left out. */
  getEmails(userIds: readonly string[]): Promise<Record<string, string>>;

  getProject(projectId: string): Promise<ProjectRecord | null>;
  listProjectsForContact(userId: string): Promise<ProjectRecord[]>;
  listProjectsForStudio(studioId: string): Promise<ProjectRecord[]>;
  getProposal(proposalId: string): Promise<ProposalRecord | null>;
  /** Every proposal of a project, oldest version first. */
  listProposals(projectId: string): Promise<ProposalRecord[]>;
  listProposalsForProjects(projectIds: readonly string[]): Promise<ProposalRecord[]>;

  createStudioWithOwner(userId: string, studioName: string): Promise<{ studioId: string }>;
  /** Creates the client (if new), the project, its milestones and a draft proposal. Gives the next reference. */
  createDraftProject(input: NewDraftProject, effects?: Effects): Promise<{ projectId: string; proposalId: string; reference: string }>;
  /** Sends the project's draft proposal as the next version. Null when there is no draft to send. */
  sendDraftProposal(projectId: string, issuedOn: string, version: number, effects?: Effects): Promise<{ version: number } | null>;
  /**
   * Signs a sent proposal: records the signature, marks the proposal signed, moves the project to Signed and makes
   * milestone 1 payment due. "not_open" when the proposal is not in the sent state, including when another signing won.
   */
  commitSignature(record: SignatureCommit, effects?: Effects): Promise<"signed" | "not_open">;
  applyMilestoneTransition(input: MilestoneTransition): Promise<TransitionOutcome>;
  addProjectContact(projectId: string, userId: string): Promise<void>;

  /** The activity log, newest first. A client sees only the events marked visible to clients. */
  listEvents(projectId: string, audience: EventAudience): Promise<ProjectEvent[]>;
  /** Writes effects that have no change of their own to go with. */
  appendEffects(effects: Effects): Promise<void>;

  createInvitation(record: InvitationRecord, effects?: Effects): Promise<void>;
  findInvitationByHash(tokenHash: string): Promise<InvitationRecord | null>;
  /** Accepts once: marks it accepted and adds the contact together. "unavailable" when it was used, revoked or expired. */
  acceptInvitation(input: { invitationId: string; userId: string; acceptedAt: string }, effects?: Effects): Promise<"accepted" | "unavailable">;
  revokeInvitation(invitationId: string): Promise<void>;
  listInvitations(projectId: string): Promise<InvitationRecord[]>;

  listChangeRequests(projectId: string): Promise<ChangeRequestRecord[]>;
  /** Records the studio's reply once. */
  replyToChangeRequest(
    input: { id: string; projectId: string; body: string; repliedAt: string },
    effects?: Effects,
  ): Promise<"replied" | "already_replied" | "not_found">;

  createFile(record: FileRecord): Promise<void>;
  getFile(fileId: string): Promise<FileRecord | null>;
  /** Pending to ready, once. False when it was not pending. */
  markFileReady(fileId: string, effects?: Effects): Promise<boolean>;
  removeFile(fileId: string, effects?: Effects): Promise<boolean>;
  listReadyFiles(projectId: string, position: number): Promise<FileRecord[]>;
  listPendingFilesBefore(isoCutoff: string): Promise<FileRecord[]>;

  findOpenPayment(projectId: string, position: number): Promise<PaymentRecord | null>;
  /** Records a started payment. "open_exists" when the milestone already has an open payment: nothing is written. */
  createPayment(record: PaymentRecord, effects?: Effects): Promise<"created" | "open_exists">;
  setPaymentAuthorization(reference: string, url: string): Promise<void>;
  failPayment(reference: string): Promise<void>;
  getPayment(reference: string): Promise<PaymentRecord | null>;
  listPaymentsForProjects(projectIds: readonly string[]): Promise<PaymentRecord[]>;
  /**
   * Marks the payment paid and moves its milestone from payment due to in progress, with its effects, in one
   * transaction. Only one call can settle a payment. milestoneActivated is false when the milestone was not payment due.
   */
  settlePayment(
    input: { reference: string; settledAt: string },
    effects?: Effects,
  ): Promise<{ outcome: "settled" | "already_settled" | "unknown_reference"; milestoneActivated: boolean }>;

  requestDeletion(userId: string, requestedAt: string): Promise<{ requestedAt: string; alreadyRequested: boolean }>;
  getDeletionRequest(userId: string): Promise<string | null>;
}
