import type { ProjectRecord } from "@/server/core/types";
import { getStore } from "@/server/store/registry";

/** A project as its client contact sees it. Null unless the viewer is a contact on that project. */
export async function getClientProjectView(viewerUserId: string, projectId: string): Promise<ProjectRecord | null> {
  const project = await getStore().getProject(projectId);
  if (!project) return null;
  if (!project.contactUserIds.includes(viewerUserId)) return null;
  return project;
}

export type ClientProjectSummary = {
  id: string;
  reference: string;
  title: string;
  studioName: string;
  stage: ProjectRecord["stage"];
  openProposalId: string | null;
};

/** The projects the viewer is a contact on, each with the proposal waiting for them, if any. */
export async function listClientProjects(viewerUserId: string): Promise<ClientProjectSummary[]> {
  const store = getStore();
  const mine = await store.listProjectsForContact(viewerUserId);
  const proposals = await store.listProposalsForProjects(mine.map((p) => p.id));
  return mine.map((p) => ({
    id: p.id,
    reference: p.reference,
    title: p.title,
    studioName: p.studioName,
    stage: p.stage,
    openProposalId: proposals.find((d) => d.projectId === p.id && d.status === "sent")?.id ?? null,
  }));
}
