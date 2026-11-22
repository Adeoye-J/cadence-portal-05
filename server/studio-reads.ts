import { getStore } from "@/server/store/registry";
import { listPaymentsForProjects, type PaymentRecord } from "@/server/payments";
import { getStudioMembership, type StudioRole } from "@/server/studio";

/**
 * Studio read models: clients, the payments ledger and the team. Each starts from the viewer's
 * membership. Null means the viewer may not see that list at all.
 */

const ACTIVE_STAGES = new Set(["signed", "in_progress", "review"]);

export type StudioClientRow = {
  name: string;
  projectCount: number;
  activeCount: number;
  projects: { id: string; reference: string; title: string }[];
};

export async function listStudioClients(userId: string): Promise<StudioClientRow[] | null> {
  const membership = await getStudioMembership(userId);
  if (!membership) return null;
  const mine = await getStore().listProjectsForStudio(membership.studioId);
  const names = [...new Set(mine.map((p) => p.clientName))];
  return names.map((name) => {
    const projects = mine.filter((p) => p.clientName === name);
    return {
      name,
      projectCount: projects.length,
      activeCount: projects.filter((p) => ACTIVE_STAGES.has(p.stage)).length,
      projects: projects.map((p) => ({ id: p.id, reference: p.reference, title: p.title })),
    };
  });
}

export type StudioPaymentRow = PaymentRecord & { projectReference: string; projectTitle: string; clientName: string };

/** The payments ledger. Owners and admins only; members and viewers get null. */
export async function listStudioPayments(userId: string): Promise<StudioPaymentRow[] | null> {
  const membership = await getStudioMembership(userId);
  if (!membership) return null;
  if (membership.role !== "owner" && membership.role !== "admin") return null;
  const mine = await getStore().listProjectsForStudio(membership.studioId);
  return (await listPaymentsForProjects(mine.map((p) => p.id))).map((payment) => {
    const project = mine.find((p) => p.id === payment.projectId);
    return {
      ...payment,
      projectReference: project?.reference ?? "",
      projectTitle: project?.title ?? "",
      clientName: project?.clientName ?? "",
    };
  });
}

export type StudioMemberRow = { role: StudioRole; contact: string };

/** Everyone in the viewer's studio, with their role. Any member may see the team. */
export async function listStudioMembers(userId: string): Promise<StudioMemberRow[] | null> {
  const membership = await getStudioMembership(userId);
  if (!membership) return null;
  const members = await getStore().listMembers(membership.studioId);
  return members.map((m) => ({ role: m.role, contact: m.email ?? "Email not on file" }));
}
