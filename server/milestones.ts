import { randomUUID } from "node:crypto";
import { canWrite } from "@/lib/authz";
import { nextStatus } from "@/lib/milestone-transitions";
import type { ChangeRequestRecord, MilestoneRecord, ProjectRecord } from "@/server/core/types";
import { buildEffects } from "@/server/effects";
import { getStudioMembership } from "@/server/studio";
import { getStore } from "@/server/store/registry";

/**
 * Milestone actions. Each one is a store command that checks the milestone's current status and writes its activity
 * event and notification rows in the same transaction. A stale click gets "this milestone has just changed".
 */

export type ChangeRequest = ChangeRequestRecord;

export type MilestoneResult = { ok: true } | { ok: false; message: string };

const STALE = "This milestone has just changed. Reload and try again.";

const newestFirst = (a: ChangeRequest, b: ChangeRequest) => b.createdAt.localeCompare(a.createdAt);

async function clientProject(viewerUserId: string, projectId: string): Promise<ProjectRecord | null> {
  const project = await getStore().getProject(projectId);
  return project && project.contactUserIds.includes(viewerUserId) ? project : null;
}

async function studioProject(studioId: string, projectId: string): Promise<ProjectRecord | null> {
  const project = await getStore().getProject(projectId);
  return project && project.studioId === studioId ? project : null;
}

function milestoneAt(project: ProjectRecord, position: number): MilestoneRecord | undefined {
  return project.milestones.find((m) => m.position === position);
}

export type ClientMilestoneView = {
  project: ProjectRecord;
  milestone: MilestoneRecord;
  changeRequests: ChangeRequest[];
};

/** One milestone as its client contact sees it, with the change requests made on it. Null if not a contact. */
export async function getClientMilestone(
  viewerUserId: string,
  projectId: string,
  position: number,
): Promise<ClientMilestoneView | null> {
  const project = await clientProject(viewerUserId, projectId);
  if (!project) return null;
  const milestone = milestoneAt(project, position);
  if (!milestone) return null;
  const requests = await getStore().listChangeRequests(projectId);
  return { project, milestone, changeRequests: requests.filter((c) => c.position === position).sort(newestFirst) };
}

/** Studio: marks an in-progress milestone delivered. */
export async function deliverMilestone(userId: string, projectId: string, position: number): Promise<MilestoneResult> {
  const membership = await getStudioMembership(userId);
  if (!membership) return { ok: false, message: "Studio not found." };
  if (!canWrite(membership.role)) return { ok: false, message: "Your role cannot mark milestones delivered." };

  const project = await studioProject(membership.studioId, projectId);
  const milestone = project ? milestoneAt(project, position) : undefined;
  if (!project || !milestone) return { ok: false, message: "Milestone not found." };

  const next = nextStatus(milestone.status, "deliver");
  if (!next) return { ok: false, message: "Only a milestone in progress can be marked delivered." };

  const effects = await buildEffects({ projectId, kind: "milestone_delivered", actor: "studio", summary: `Milestone ${position} delivered` });
  const moved = await getStore().applyMilestoneTransition({ projectId, position, from: milestone.status, to: next, effects });
  if (!moved.applied) return { ok: false, message: STALE };
  return { ok: true };
}

/** Client: approves a delivered milestone. The next milestone becomes payment due. The last approval completes the project. */
export async function approveMilestone(viewerUserId: string, projectId: string, position: number): Promise<MilestoneResult> {
  const project = await clientProject(viewerUserId, projectId);
  const milestone = project ? milestoneAt(project, position) : undefined;
  if (!project || !milestone) return { ok: false, message: "Milestone not found." };

  const next = nextStatus(milestone.status, "approve");
  if (!next) return { ok: false, message: "This milestone is not waiting for your approval." };

  const effects = await buildEffects({ projectId, kind: "milestone_approved", actor: "client", summary: `Milestone ${position} approved` });
  const completionEffects = await buildEffects({ projectId, kind: "project_completed", actor: "system", summary: "All milestones approved" });
  const moved = await getStore().applyMilestoneTransition({
    projectId,
    position,
    from: milestone.status,
    to: next,
    activateNext: true,
    completeIfAllApproved: true,
    effects,
    completionEffects,
  });
  if (!moved.applied) return { ok: false, message: STALE };
  return { ok: true };
}

/** Client: asks for changes to a delivered milestone. The milestone returns to in progress. */
export async function requestChanges(
  viewerUserId: string,
  projectId: string,
  position: number,
  body: string,
): Promise<MilestoneResult> {
  const project = await clientProject(viewerUserId, projectId);
  const milestone = project ? milestoneAt(project, position) : undefined;
  if (!project || !milestone) return { ok: false, message: "Milestone not found." };

  const next = nextStatus(milestone.status, "request_changes");
  if (!next) return { ok: false, message: "This milestone is not waiting for your review." };

  const effects = await buildEffects({ projectId, kind: "changes_requested", actor: "client", summary: `Changes requested on milestone ${position}` });
  const moved = await getStore().applyMilestoneTransition({
    projectId,
    position,
    from: milestone.status,
    to: next,
    effects,
    changeRequest: { id: randomUUID(), projectId, position, body, createdAt: new Date().toISOString() },
  });
  if (!moved.applied) return { ok: false, message: STALE };
  return { ok: true };
}

/** Every change request on a project, newest first. The caller has already checked the viewer's access. */
export async function listProjectChangeRequests(projectId: string): Promise<ChangeRequest[]> {
  return (await getStore().listChangeRequests(projectId)).sort(newestFirst);
}

/** Studio: replies to a change request once. The reply is visible to the client and is logged. */
export async function replyToChangeRequest(
  userId: string,
  projectId: string,
  changeRequestId: string,
  body: string,
): Promise<MilestoneResult> {
  const membership = await getStudioMembership(userId);
  if (!membership) return { ok: false, message: "Studio not found." };
  if (!canWrite(membership.role)) return { ok: false, message: "Your role cannot reply to change requests." };

  const project = await studioProject(membership.studioId, projectId);
  const request = project ? (await getStore().listChangeRequests(projectId)).find((c) => c.id === changeRequestId) : undefined;
  if (!project || !request) return { ok: false, message: "Change request not found." };
  if (request.reply) return { ok: false, message: "This change request already has a reply." };

  const effects = await buildEffects({
    projectId,
    kind: "changes_responded",
    actor: "studio",
    summary: `Studio replied to the change request on milestone ${request.position}`,
  });
  const outcome = await getStore().replyToChangeRequest(
    { id: changeRequestId, projectId, body, repliedAt: new Date().toISOString() },
    effects,
  );
  if (outcome === "already_replied") return { ok: false, message: "This change request already has a reply." };
  if (outcome === "not_found") return { ok: false, message: "Change request not found." };
  return { ok: true };
}

export type ClientChangeRequestView = ChangeRequest & { milestoneTitle: string };

/** All change requests on a project the viewer is a contact on, with each milestone's title. Null if not a contact. */
export async function getClientChangeRequests(viewerUserId: string, projectId: string): Promise<ClientChangeRequestView[] | null> {
  const project = await clientProject(viewerUserId, projectId);
  if (!project) return null;
  return (await getStore().listChangeRequests(projectId)).sort(newestFirst).map((c) => ({
    ...c,
    milestoneTitle: milestoneAt(project, c.position)?.title ?? `Milestone ${c.position}`,
  }));
}
