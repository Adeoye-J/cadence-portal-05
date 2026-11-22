import { randomUUID } from "node:crypto";
import {
  demoMemberships,
  demoProjects,
  demoProposals,
  demoStudioOwnerEmail,
  demoStudioOwnerId,
  demoStudios,
  demoViewerEmail,
  demoViewerId,
} from "@/db/fixtures/cadence-demo";
import type { ProjectEvent } from "@/server/event-types";
import type { OutboxStore } from "@/server/outbox";
import type { SignatureRecord } from "@/server/store/types";
import {
  OPEN_PAYMENT_TTL_MS,
  type ChangeRequestRecord,
  type CoreStore,
  type Effects,
  type FileRecord,
  type InvitationRecord,
  type PaymentRecord,
  type ProjectRecord,
  type ProposalRecord,
} from "./types";

const copy = <T>(value: T): T => structuredClone(value);

const EMAILS: Record<string, string> = {
  [demoViewerId]: demoViewerEmail,
  [demoStudioOwnerId]: demoStudioOwnerEmail,
};

function nextReference(): string {
  const highest = demoProjects.reduce((max, p) => {
    const n = Number(p.reference.slice(-3));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `CAD-2026-${String(highest + 1).padStart(3, "0")}`;
}

/**
 * The in-memory core store. Projects and proposals live in the fixture arrays and every read gives out copies, so code
 * that changes a record without calling a command changes nothing, as it would against the database. Tests that set up
 * state by editing the fixture arrays still work, because reads are taken from them at call time. Events, invitations,
 * change requests, files, payments and deletion requests live in this store instance.
 */
export function createMemoryCore(signatures: Map<string, SignatureRecord>, outbox: OutboxStore): CoreStore {
  const events: ProjectEvent[] = [];
  let sequence = 0;
  const invitations: InvitationRecord[] = [];
  const changeRequests: ChangeRequestRecord[] = [];
  const files: FileRecord[] = [];
  const payments = new Map<string, PaymentRecord>();
  const deletionRequests = new Map<string, string>();

  const project = (id: string): ProjectRecord | undefined => demoProjects.find((p) => p.id === id);
  const byVersion = (a: ProposalRecord, b: ProposalRecord) => a.version - b.version;
  const isOpen = (p: PaymentRecord) => p.status === "pending" && Date.now() - Date.parse(p.createdAt) < OPEN_PAYMENT_TTL_MS;

  /** Events first (synchronously, so order is the order of the commands), then the queue rows. */
  async function applyEffects(effects?: Effects): Promise<void> {
    if (!effects) return;
    for (const event of effects.events) {
      sequence += 1;
      events.push({ ...event, seq: sequence });
    }
    const now = new Date();
    for (const message of effects.outbox) await outbox.enqueue(message, now);
  }

  return {
    async getMembership(userId) {
      const membership = demoMemberships.find((m) => m.userId === userId);
      const studio = membership ? demoStudios.find((s) => s.id === membership.studioId) : undefined;
      if (!membership || !studio) return null;
      return { studioId: studio.id, studioName: studio.name, role: membership.role };
    },
    async listMembers(studioId) {
      return demoMemberships
        .filter((m) => m.studioId === studioId)
        .map((m) => ({ userId: m.userId, role: m.role, email: EMAILS[m.userId] ?? null }));
    },
    async getEmails(userIds) {
      const out: Record<string, string> = {};
      for (const id of userIds) {
        const email = EMAILS[id];
        if (email) out[id] = email;
      }
      return out;
    },

    async getProject(projectId) {
      const found = project(projectId);
      return found ? copy(found) : null;
    },
    async listProjectsForContact(userId) {
      return copy(demoProjects.filter((p) => p.contactUserIds.includes(userId)));
    },
    async listProjectsForStudio(studioId) {
      return copy(demoProjects.filter((p) => p.studioId === studioId));
    },
    async getProposal(proposalId) {
      const found = demoProposals.find((p) => p.id === proposalId);
      return found ? copy(found) : null;
    },
    async listProposals(projectId) {
      return copy(demoProposals.filter((p) => p.projectId === projectId).sort(byVersion));
    },
    async listProposalsForProjects(projectIds) {
      return copy(demoProposals.filter((p) => projectIds.includes(p.projectId)).sort(byVersion));
    },

    async createStudioWithOwner(userId, studioName) {
      const studioId = `stu_${randomUUID().slice(0, 12)}`;
      demoStudios.push({ id: studioId, name: studioName });
      demoMemberships.push({ studioId, userId, role: "owner" });
      return { studioId };
    },
    async createDraftProject(input, effects) {
      const studio = demoStudios.find((s) => s.id === input.studioId);
      const projectId = input.projectId ?? `prj_${randomUUID().slice(0, 12)}`;
      const proposalId = input.proposalId ?? `prp_${randomUUID().slice(0, 12)}`;
      const reference = nextReference();
      demoProjects.push({
        id: projectId,
        studioId: input.studioId,
        reference,
        title: input.title,
        studioName: studio?.name ?? "",
        clientName: input.clientName,
        currency: input.currency,
        stage: "proposal",
        contactUserIds: [],
        milestones: input.milestones.map((m, i) => ({
          position: i + 1,
          title: m.title,
          description: m.description,
          amountMinor: m.amountMinor,
          status: "upcoming" as const,
          dueDate: m.dueDate,
        })),
      });
      demoProposals.push({ id: proposalId, projectId, version: 0, issuedOn: "", revisionTerms: input.revisionTerms, status: "draft" });
      await applyEffects(effects);
      return { projectId, proposalId, reference };
    },
    async sendDraftProposal(projectId, issuedOn, version, effects) {
      const draft = demoProposals.find((p) => p.projectId === projectId && p.status === "draft");
      if (!draft) return null;
      draft.version = version;
      draft.status = "sent";
      draft.issuedOn = issuedOn;
      await applyEffects(effects);
      return { version };
    },
    async commitSignature(record, effects) {
      const proposal = demoProposals.find((p) => p.id === record.proposalId);
      const owner = proposal ? project(proposal.projectId) : undefined;
      if (!proposal || !owner || proposal.status !== "sent" || signatures.has(record.proposalId)) return "not_open";
      signatures.set(record.proposalId, { ...record });
      proposal.status = "signed";
      owner.stage = "signed";
      const first = owner.milestones.find((m) => m.position === 1);
      if (first && first.status === "upcoming") first.status = "payment_due";
      await applyEffects(effects);
      return "signed";
    },
    async applyMilestoneTransition(t) {
      const owner = project(t.projectId);
      const milestone = owner?.milestones.find((m) => m.position === t.position);
      if (!owner || !milestone || milestone.status !== t.from) return { applied: false, projectCompleted: false };
      milestone.status = t.to;
      if (t.activateNext) {
        const following = owner.milestones.find((m) => m.position === t.position + 1);
        if (following && following.status === "upcoming") following.status = "payment_due";
      }
      let projectCompleted = false;
      if (t.completeIfAllApproved && owner.stage !== "completed" && owner.milestones.every((m) => m.status === "approved")) {
        owner.stage = "completed";
        projectCompleted = true;
      }
      if (t.changeRequest) changeRequests.push(copy(t.changeRequest));
      await applyEffects(t.effects);
      if (projectCompleted) await applyEffects(t.completionEffects);
      return { applied: true, projectCompleted };
    },
    async addProjectContact(projectId, userId) {
      const owner = project(projectId);
      if (owner && !owner.contactUserIds.includes(userId)) owner.contactUserIds.push(userId);
    },

    async listEvents(projectId, audience) {
      return copy(
        events
          .filter((e) => e.projectId === projectId && (audience === "studio" || e.clientVisible))
          .sort((a, b) => b.seq - a.seq),
      );
    },
    async appendEffects(effects) {
      await applyEffects(effects);
    },

    async createInvitation(record, effects) {
      invitations.push(copy(record));
      await applyEffects(effects);
    },
    async findInvitationByHash(tokenHash) {
      const found = invitations.find((i) => i.tokenHash === tokenHash);
      return found ? copy(found) : null;
    },
    async acceptInvitation({ invitationId, userId, acceptedAt }, effects) {
      const invitation = invitations.find((i) => i.id === invitationId);
      if (!invitation || invitation.revoked || invitation.acceptedAt || Date.parse(invitation.expiresAt) <= Date.parse(acceptedAt)) {
        return "unavailable";
      }
      invitation.acceptedAt = acceptedAt;
      const owner = project(invitation.projectId);
      if (owner && !owner.contactUserIds.includes(userId)) owner.contactUserIds.push(userId);
      await applyEffects(effects);
      return "accepted";
    },
    async revokeInvitation(invitationId) {
      const invitation = invitations.find((i) => i.id === invitationId);
      if (invitation) invitation.revoked = true;
    },
    async listInvitations(projectId) {
      return copy(invitations.filter((i) => i.projectId === projectId));
    },

    async listChangeRequests(projectId) {
      return copy(changeRequests.filter((c) => c.projectId === projectId));
    },
    async replyToChangeRequest({ id, projectId, body, repliedAt }, effects) {
      const request = changeRequests.find((c) => c.id === id && c.projectId === projectId);
      if (!request) return "not_found";
      if (request.reply) return "already_replied";
      request.reply = { body, repliedAt };
      await applyEffects(effects);
      return "replied";
    },

    async createFile(record) {
      files.push(copy(record));
    },
    async getFile(fileId) {
      const found = files.find((f) => f.id === fileId);
      return found ? copy(found) : null;
    },
    async markFileReady(fileId, effects) {
      const file = files.find((f) => f.id === fileId && f.status === "pending");
      if (!file) return false;
      file.status = "ready";
      await applyEffects(effects);
      return true;
    },
    async removeFile(fileId, effects) {
      const index = files.findIndex((f) => f.id === fileId);
      if (index < 0) return false;
      files.splice(index, 1);
      await applyEffects(effects);
      return true;
    },
    async listReadyFiles(projectId, position) {
      return copy(files.filter((f) => f.projectId === projectId && f.position === position && f.status === "ready"));
    },
    async listPendingFilesBefore(isoCutoff) {
      return copy(files.filter((f) => f.status === "pending" && Date.parse(f.createdAt) < Date.parse(isoCutoff)));
    },

    async findOpenPayment(projectId, position) {
      const found = [...payments.values()].find((p) => p.projectId === projectId && p.milestonePosition === position && isOpen(p));
      return found ? copy(found) : null;
    },
    async createPayment(record, effects) {
      const forMilestone = [...payments.values()].filter((p) => p.projectId === record.projectId && p.milestonePosition === record.milestonePosition);
      if (forMilestone.some(isOpen)) return "open_exists";
      for (const stale of forMilestone) if (stale.status === "pending") stale.status = "failed";
      payments.set(record.reference, copy(record));
      await applyEffects(effects);
      return "created";
    },
    async setPaymentAuthorization(reference, url) {
      const payment = payments.get(reference);
      if (payment) payment.authorizationUrl = url;
    },
    async failPayment(reference) {
      const payment = payments.get(reference);
      if (payment && payment.status === "pending") payment.status = "failed";
    },
    async getPayment(reference) {
      const found = payments.get(reference);
      return found ? copy(found) : null;
    },
    async listPaymentsForProjects(projectIds) {
      return copy([...payments.values()].filter((p) => projectIds.includes(p.projectId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    async settlePayment({ reference, settledAt }, effects) {
      const payment = payments.get(reference);
      if (!payment) return { outcome: "unknown_reference", milestoneActivated: false };
      if (payment.status === "paid") return { outcome: "already_settled", milestoneActivated: false };
      payment.status = "paid";
      payment.settledAt = settledAt;
      const owner = project(payment.projectId);
      const milestone = owner?.milestones.find((m) => m.position === payment.milestonePosition);
      let milestoneActivated = false;
      if (owner && milestone && milestone.status === "payment_due") {
        milestone.status = "in_progress";
        owner.stage = "in_progress";
        milestoneActivated = true;
      }
      await applyEffects(effects);
      return { outcome: "settled", milestoneActivated };
    },

    async requestDeletion(userId, requestedAt) {
      const existing = deletionRequests.get(userId);
      if (existing) return { requestedAt: existing, alreadyRequested: true };
      deletionRequests.set(userId, requestedAt);
      return { requestedAt, alreadyRequested: false };
    },
    async getDeletionRequest(userId) {
      return deletionRequests.get(userId) ?? null;
    },
  };
}
