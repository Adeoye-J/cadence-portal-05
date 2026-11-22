import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Currency, ProjectStage } from "@/db/schema";
import { canWrite } from "@/lib/authz";
import type { InvitationRecord } from "@/server/core/types";
import { buildEffects } from "@/server/effects";
import { getStudioMembership } from "@/server/studio";
import { getStore } from "@/server/store/registry";

/**
 * Client invitations. The token is shown once, in the link. Only its SHA-256 is stored, so a database read cannot
 * produce a working link. An invitation is single-use, expires after 14 days, and can be used only by the address it was
 * sent to. Accepting adds the contact and marks the invitation used in one transaction.
 */

export const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type Invitation = InvitationRecord;
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findUsable(token: string, now: Date): Promise<Invitation | null> {
  const found = await getStore().findInvitationByHash(hashToken(token));
  if (!found || found.revoked || found.acceptedAt || new Date(found.expiresAt) <= now) return null;
  return found;
}

export function statusOf(invitation: Invitation, now: Date): InvitationStatus {
  if (invitation.revoked) return "revoked";
  if (invitation.acceptedAt) return "accepted";
  if (new Date(invitation.expiresAt) <= now) return "expired";
  return "pending";
}

export type InviteResult =
  | { ok: true; invitationId: string; token: string; email: string; projectTitle: string; studioName: string }
  | { ok: false; message: string };

/** Studio: creates an invitation for a client address. Returns the raw token once so the caller can email the link. */
export async function inviteClient(
  userId: string,
  projectId: string,
  rawEmail: string,
  now: Date = new Date(),
): Promise<InviteResult> {
  const membership = await getStudioMembership(userId);
  if (!membership) return { ok: false, message: "Studio not found." };
  if (!canWrite(membership.role)) return { ok: false, message: "Your role cannot invite clients." };

  const project = await getStore().getProject(projectId);
  if (!project || project.studioId !== membership.studioId) return { ok: false, message: "Project not found." };

  const token = randomBytes(32).toString("base64url");
  const invitation: Invitation = {
    id: randomUUID(),
    projectId: project.id,
    email: normaliseEmail(rawEmail),
    tokenHash: hashToken(token),
    invitedByUserId: userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + INVITATION_TTL_MS).toISOString(),
    revoked: false,
  };
  const effects = await buildEffects({ projectId: project.id, kind: "invitation_sent", actor: "studio", summary: "Client invitation sent" });
  await getStore().createInvitation(invitation, effects);
  return {
    ok: true,
    invitationId: invitation.id,
    token,
    email: invitation.email,
    projectTitle: project.title,
    studioName: membership.studioName,
  };
}

/** Withdraws an invitation, for example when its email could not be sent. */
export async function revokeInvitation(invitationId: string): Promise<void> {
  await getStore().revokeInvitation(invitationId);
}

export type InvitationPreview = {
  projectTitle: string;
  studioName: string;
  clientName: string;
  email: string;
  reference: string;
  stage: ProjectStage;
  currency: Currency;
  milestones: { position: number; title: string; amountMinor: number; dueDate?: string }[];
};

/** What the invitation page shows before sign-in. Null for an unknown, used, revoked or expired token. */
export async function previewInvitation(token: string, now: Date = new Date()): Promise<InvitationPreview | null> {
  const invitation = await findUsable(token, now);
  if (!invitation) return null;
  const project = await getStore().getProject(invitation.projectId);
  if (!project) return null;
  return {
    projectTitle: project.title,
    studioName: project.studioName,
    clientName: project.clientName,
    email: invitation.email,
    reference: project.reference,
    stage: project.stage,
    currency: project.currency,
    milestones: project.milestones.map((m) => ({
      position: m.position,
      title: m.title,
      amountMinor: m.amountMinor,
      dueDate: m.dueDate,
    })),
  };
}

export type AcceptResult = { ok: true } | { ok: false; reason: "invalid" | "email_mismatch" };

/** Client: accepts an invitation. The signed-in address must be the one invited. */
export async function acceptInvitation(
  token: string,
  viewer: { userId: string; email: string },
  now: Date = new Date(),
): Promise<AcceptResult> {
  const invitation = await findUsable(token, now);
  if (!invitation) return { ok: false, reason: "invalid" };
  if (normaliseEmail(viewer.email) !== invitation.email) return { ok: false, reason: "email_mismatch" };

  const project = await getStore().getProject(invitation.projectId);
  if (!project) return { ok: false, reason: "invalid" };

  const effects = await buildEffects({ projectId: project.id, kind: "invitation_accepted", actor: "client", summary: "Client contact accepted the invitation" });
  const outcome = await getStore().acceptInvitation({ invitationId: invitation.id, userId: viewer.userId, acceptedAt: now.toISOString() }, effects);
  // "unavailable" means another request used or revoked it between our check and the write.
  return outcome === "accepted" ? { ok: true } : { ok: false, reason: "invalid" };
}

export type InvitationRow = { id: string; email: string; createdAt: string; status: InvitationStatus };

/** A project's invitations for the studio's list. Never includes the token or its hash. */
export async function listInvitations(projectId: string, now: Date = new Date()): Promise<InvitationRow[]> {
  const rows = await getStore().listInvitations(projectId);
  return rows
    .map((i) => ({ id: i.id, email: i.email, createdAt: i.createdAt, status: statusOf(i, now) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
