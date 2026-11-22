import type { Currency, MilestoneStatus, ProjectStage } from "@/db/schema";
import { retainerTotals } from "@/lib/milestones";
import type { ProjectRecord, ProposalRecord, StudioRole as CoreRole } from "@/server/core/types";
import { getStore } from "@/server/store/registry";

/**
 * Studio-side reads. Everything starts from the signed-in user's membership: a studio sees only its own projects.
 */
export type StudioRole = CoreRole;
export type StudioMembership = { studioId: string; studioName: string; role: StudioRole };

export async function getStudioMembership(userId: string): Promise<StudioMembership | null> {
  return getStore().getMembership(userId);
}

export type StudioProjectRow = {
  id: string;
  reference: string;
  title: string;
  clientName: string;
  stage: ProjectStage;
  currency: Currency;
  remainingMinor: number;
  awaitingPayment: boolean;
};

/** The studio's projects with what is left to pay. Null when the user is not in a studio. */
export async function listStudioProjects(userId: string): Promise<StudioProjectRow[] | null> {
  const membership = await getStudioMembership(userId);
  if (!membership) return null;
  const mine = await getStore().listProjectsForStudio(membership.studioId);
  return mine.map((p) => {
    const statuses: MilestoneStatus[] = p.milestones.map((m) => m.status);
    return {
      id: p.id,
      reference: p.reference,
      title: p.title,
      clientName: p.clientName,
      stage: p.stage,
      currency: p.currency,
      remainingMinor: retainerTotals(p.milestones).remainingMinor,
      awaitingPayment: statuses.includes("payment_due"),
    };
  });
}

export type StudioProjectDetail = {
  project: ProjectRecord;
  proposal: ProposalRecord | undefined;
  membership: StudioMembership;
};

/** One project of the user's own studio, with its latest proposal. Null for another studio's project. */
export async function getStudioProject(userId: string, projectId: string): Promise<StudioProjectDetail | null> {
  const membership = await getStudioMembership(userId);
  if (!membership) return null;
  const store = getStore();
  const project = await store.getProject(projectId);
  if (!project || project.studioId !== membership.studioId) return null;
  const proposal = (await store.listProposals(projectId)).at(-1);
  return { project, proposal, membership };
}
