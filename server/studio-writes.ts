import { randomUUID } from "node:crypto";
import { buildEffects } from "@/server/effects";
import { canWrite } from "@/lib/authz";
import { toMinor, type CreateProposalInput } from "@/lib/validation/proposal";
import { getStudioMembership } from "@/server/studio";
import { getStore } from "@/server/store/registry";

/**
 * Studio write operations. Each one checks membership, then role, then ownership of the
 * project. A failed check returns a message that is safe to show. It never says whether
 * another studio's project exists.
 *
 * DEVELOPMENT STORE. Writes go to the in-memory fixtures and reset on restart.
 */

export type WriteResult = { ok: true } | { ok: false; message: string };

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createDraftProposal(
  userId: string,
  input: CreateProposalInput,
): Promise<{ ok: true; projectId: string } | { ok: false; message: string }> {
  const membership = await getStudioMembership(userId);
  if (!membership) return { ok: false, message: "Studio not found." };
  if (!canWrite(membership.role)) return { ok: false, message: "Your role cannot create proposals." };

  const projectId = `prj_${randomUUID().slice(0, 12)}`;
  const proposalId = `prp_${randomUUID().slice(0, 12)}`;
  const effects = await buildEffects({ projectId, kind: "proposal_drafted", actor: "studio", summary: "Draft proposal created" });
  const created = await getStore().createDraftProject({
    projectId,
    proposalId,
    studioId: membership.studioId,
    clientName: input.clientName,
    title: input.title,
    currency: input.currency,
    revisionTerms: input.revisionTerms,
    milestones: input.milestones.map((m) => ({
      title: m.title,
      description: m.description || undefined,
      amountMinor: toMinor(m.amount),
      dueDate: m.dueDate || undefined,
    })),
  }, effects);
  return { ok: true, projectId: created.projectId };
}

/**
 * Sends the project's draft proposal to the client. Needs at least one contact, because
 * the client sees a proposal only through a project they are listed on. Client invitations
 * are not built yet, so the contact must already exist.
 */
export async function sendProposal(userId: string, projectId: string): Promise<WriteResult> {
  const membership = await getStudioMembership(userId);
  if (!membership) return { ok: false, message: "Studio not found." };
  if (!canWrite(membership.role)) return { ok: false, message: "Your role cannot send proposals." };

  const store = getStore();
  const project = await store.getProject(projectId);
  if (!project || project.studioId !== membership.studioId) return { ok: false, message: "Project not found." };
  if (project.stage !== "proposal") return { ok: false, message: "This project has already moved past proposal." };
  if (project.contactUserIds.length === 0) {
    return { ok: false, message: "Add a client contact before sending. Client invitations are not built yet." };
  }
  const earlier = (await store.listProposals(projectId)).filter((p) => p.status !== "draft");
  const version = Math.max(0, ...earlier.map((p) => p.version)) + 1;
  const effects = await buildEffects({ projectId, kind: "proposal_sent", actor: "studio", summary: `Proposal version ${version} sent` });
  const sent = await store.sendDraftProposal(projectId, todayIso(), version, effects);
  if (!sent) return { ok: false, message: "There is no draft to send." };
  return { ok: true };
}
