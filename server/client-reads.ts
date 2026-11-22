import type { ProjectRecord } from "@/server/core/types";
import { getStore } from "@/server/store/registry";
import { listMilestoneFiles, type ReadyFile } from "@/server/files";
import type { ProjectEvent } from "@/server/event-types";
import { listEvents } from "@/server/events";
import { listPaymentsForProjects, type PaymentRecord } from "@/server/payments";
import { getClientChangeRequests, type ClientChangeRequestView } from "@/server/milestones";

/**
 * Read models for the signed-in client: payments, deliverables, notifications and the data export.
 * Every function starts from the viewer's project contacts. Nothing here reads another client's data.
 */

export async function viewerProjects(viewerUserId: string): Promise<ProjectRecord[]> {
  return getStore().listProjectsForContact(viewerUserId);
}

export type ProjectFilesView = {
  project: ProjectRecord;
  byMilestone: { position: number; title: string; files: ReadyFile[] }[];
};

/** Ready deliverables for a project, grouped by milestone. Null when the viewer is not a contact. */
export async function getClientFiles(viewerUserId: string, projectId: string): Promise<ProjectFilesView | null> {
  const project = (await viewerProjects(viewerUserId)).find((p) => p.id === projectId);
  if (!project) return null;
  return {
    project,
    byMilestone: await Promise.all(
      project.milestones.map(async (m) => ({
        position: m.position,
        title: m.title,
        files: await listMilestoneFiles(projectId, m.position),
      })),
    ),
  };
}

export type ViewerPayment = PaymentRecord & { projectTitle: string; projectReference: string };

/** Payments on the viewer's projects, newest first. */
export async function listViewerPayments(viewerUserId: string): Promise<ViewerPayment[]> {
  const projects = await viewerProjects(viewerUserId);
  return (await listPaymentsForProjects(projects.map((p) => p.id))).map((payment) => {
    const project = projects.find((p) => p.id === payment.projectId);
    return { ...payment, projectTitle: project?.title ?? "", projectReference: project?.reference ?? "" };
  });
}

/** One payment, only if it belongs to one of the viewer's projects. */
export async function getViewerPayment(viewerUserId: string, reference: string): Promise<ViewerPayment | null> {
  return (await listViewerPayments(viewerUserId)).find((p) => p.reference === reference) ?? null;
}

export type ViewerNotification = Pick<ProjectEvent, "seq" | "at" | "summary" | "actor" | "projectId"> & {
  projectTitle: string;
};

/** Client-visible activity across the viewer's projects, newest first. Capped at 50. */
export async function listViewerNotifications(viewerUserId: string): Promise<ViewerNotification[]> {
  const projects = await viewerProjects(viewerUserId);
  const perProject = await Promise.all(
    projects.map(async (p) =>
      (await listEvents(p.id, "client")).map((e) => ({
        seq: e.seq,
        at: e.at,
        summary: e.summary,
        actor: e.actor,
        projectId: p.id,
        projectTitle: p.title,
      })),
    ),
  );
  return perProject
    .flat()
    .sort((a, b) => b.at.localeCompare(a.at) || b.seq - a.seq)
    .slice(0, 50);
}

export type ClientDataExport = {
  generatedAt: string;
  account: { email: string; name: string | null };
  projects: { reference: string; title: string; studio: string; stage: string; milestones: { position: number; title: string; amountMinor: number; currency: string; status: string }[] }[];
  payments: { reference: string; project: string; milestonePosition: number; amountMinor: number; currency: string; status: string; createdAt: string }[];
  changeRequests: { project: string; milestone: string; body: string; createdAt: string; studioReply: string | null }[];
  activity: { at: string; project: string; summary: string }[];
};

/**
 * The client's own data, as one JSON document. It holds only what the viewer can already see in the
 * portal, plus their own account fields. It never includes the studio's internal events or other clients' data.
 */
export async function buildClientDataExport(
  viewer: { userId: string; email: string; name: string | null },
  now: Date,
): Promise<ClientDataExport> {
  const projects = await viewerProjects(viewer.userId);
  const changeRequests: ClientChangeRequestView[][] = [];
  for (const p of projects) {
    changeRequests.push((await getClientChangeRequests(viewer.userId, p.id)) ?? []);
  }
  return {
    generatedAt: now.toISOString(),
    account: { email: viewer.email, name: viewer.name },
    projects: projects.map((p) => ({
      reference: p.reference,
      title: p.title,
      studio: p.studioName,
      stage: p.stage,
      milestones: p.milestones.map((m) => ({
        position: m.position,
        title: m.title,
        amountMinor: m.amountMinor,
        currency: p.currency,
        status: m.status,
      })),
    })),
    payments: (await listViewerPayments(viewer.userId)).map((pay) => ({
      reference: pay.reference,
      project: pay.projectReference,
      milestonePosition: pay.milestonePosition,
      amountMinor: pay.amountMinor,
      currency: pay.currency,
      status: pay.status,
      createdAt: pay.createdAt,
    })),
    changeRequests: changeRequests.flat().map((c) => ({
      project: projects.find((p) => p.id === c.projectId)?.reference ?? "",
      milestone: c.milestoneTitle,
      body: c.body,
      createdAt: c.createdAt,
      studioReply: c.reply?.body ?? null,
    })),
    activity: (await listViewerNotifications(viewer.userId)).map((n) => ({
      at: n.at,
      project: projects.find((p) => p.id === n.projectId)?.reference ?? "",
      summary: n.summary,
    })),
  };
}
