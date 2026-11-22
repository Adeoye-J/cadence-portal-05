import type { SignatureRecord } from "@/server/store/types";
import { getStore } from "@/server/store/registry";
import { buildEffects } from "@/server/effects";
import { createHash } from "node:crypto";
import type { ProjectRecord, ProposalRecord } from "@/server/core/types";

/**
 * Data access for proposals and sign-off.
 *
 * Every function checks that the viewer is a contact on the project before it
 * reads or writes. Missing and forbidden both return null or not_found, so a
 * caller cannot probe for IDs.
 */

export type Signature = SignatureRecord;

export type ProposalView = {
  project: ProjectRecord;
  proposal: ProposalRecord;
  signature: Signature | undefined;
};


async function findAuthorised(viewerUserId: string, proposalId: string) {
  const store = getStore();
  const proposal = await store.getProposal(proposalId);
  if (!proposal) return null;
  const project = await store.getProject(proposal.projectId);
  if (!project || !project.contactUserIds.includes(viewerUserId)) return null;
  return { project, proposal };
}

/**
 * SHA-256 over the terms being signed: reference, version, milestones and
 * revision terms. Key order is fixed, so the same terms always give the same digest.
 */
export function documentDigest(project: ProjectRecord, proposal: ProposalRecord): string {
  const canonical = JSON.stringify({
    reference: project.reference,
    version: proposal.version,
    title: project.title,
    currency: project.currency,
    milestones: project.milestones.map((m) => ({
      position: m.position,
      title: m.title,
      amountMinor: m.amountMinor,
      description: m.description ?? null,
    })),
    revisionTerms: proposal.revisionTerms,
    revisionRounds: proposal.revisionRounds ?? null,
    termsLabel: proposal.termsLabel ?? null,
    startOn: proposal.startOn ?? null,
    endOn: proposal.endOn ?? null,
    deliverables: (proposal.deliverables ?? []).map((d) => ({
      code: d.code,
      title: d.title,
      description: d.description,
      hours: d.hours,
      reviewNote: d.reviewNote,
      targetDate: d.targetDate,
      items: d.items,
    })),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export async function getProposalView(viewerUserId: string, proposalId: string): Promise<ProposalView | null> {
  const found = await findAuthorised(viewerUserId, proposalId);
  if (!found) return null;
  return {
    ...found,
    signature: (await getStore().getSignature(proposalId)) ?? undefined,
  };
}

export type SignResult =
  | { ok: true; signature: Signature }
  | { ok: false; reason: "not_found" | "already_signed" | "not_sent"; message: string };

/**
 * Records a sign-off. Idempotent for the same signer: a repeat submit returns the
 * existing signature. A different contact cannot sign a proposal that is already signed.
 * On success the project moves to the Signed stage and milestone 1 becomes payment due.
 */
export async function signProposal(
  viewerUserId: string,
  proposalId: string,
  typedName: string,
): Promise<SignResult> {
  const found = await findAuthorised(viewerUserId, proposalId);
  if (!found) return { ok: false, reason: "not_found", message: "Proposal not found." };
  const { project, proposal } = found;

  const existing = await getStore().getSignature(proposalId);
  if (existing) {
    if (existing.signerUserId === viewerUserId) return { ok: true, signature: existing };
    return { ok: false, reason: "already_signed", message: "This proposal has already been signed." };
  }
  if (proposal.status !== "sent") {
    return { ok: false, reason: "not_sent", message: "This proposal is not open for signing." };
  }

  const signature: Signature = {
    proposalId,
    signerUserId: viewerUserId,
    typedName,
    documentSha256: documentDigest(project, proposal),
    signedAt: new Date().toISOString(),
  };
  const effects = await buildEffects({ projectId: project.id, kind: "proposal_signed", actor: "client", summary: "Proposal signed" });
  const outcome = await getStore().commitSignature(signature, effects);
  if (outcome === "not_open") {
    // Another signing won between our check and our write. Say what is true now.
    const winner = await getStore().getSignature(proposalId);
    if (winner && winner.signerUserId === viewerUserId) return { ok: true, signature: winner };
    if (winner) return { ok: false, reason: "already_signed", message: "This proposal has already been signed." };
    return { ok: false, reason: "not_sent", message: "This proposal is not open for signing." };
  }
  return { ok: true, signature };
}
