/**
 * Seed rows built from the development fixtures. Pure: no database, no environment, so the mapping
 * is tested directly. The inserts are in db/seed/index.ts.
 *
 * The seed is for development and staging only. It writes the design's sample studio, its client
 * and its projects, and nothing else. It must never run against production data.
 */
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

export function buildSeedRows() {
  const users = [
    { id: demoViewerId, email: demoViewerEmail, name: "Sofia Marin", emailVerified: true },
    { id: demoStudioOwnerId, email: demoStudioOwnerEmail, name: "Studio Owner", emailVerified: true },
  ];

  const studios = demoStudios.map((s) => ({ id: s.id, name: s.name }));

  const memberships = demoMemberships.map((m) => ({ studioId: m.studioId, userId: m.userId, role: m.role }));

  // One client record per studio and client name. Projects point at it.
  const clientKey = (studioId: string, name: string) => `cli_${studioId}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const clientMap = new Map<string, { id: string; studioId: string; name: string }>();
  for (const p of demoProjects) {
    const id = clientKey(p.studioId, p.clientName);
    if (!clientMap.has(id)) clientMap.set(id, { id, studioId: p.studioId, name: p.clientName });
  }
  const clients = [...clientMap.values()];

  const projects = demoProjects.map((p) => ({
    id: p.id,
    studioId: p.studioId,
    clientId: clientKey(p.studioId, p.clientName),
    reference: p.reference,
    title: p.title,
    currency: p.currency,
    stage: p.stage,
  }));

  const projectContacts = demoProjects.flatMap((p) => p.contactUserIds.map((userId) => ({ projectId: p.id, userId })));

  const milestones = demoProjects.flatMap((p) =>
    p.milestones.map((m) => ({
      id: `ms_${p.id}_${m.position}`,
      projectId: p.id,
      position: m.position,
      title: m.title,
      description: m.description ?? null,
      terms: m.terms ?? null,
      amountMinor: m.amountMinor,
      status: m.status,
      dueDate: m.dueDate ?? null,
    })),
  );

  const proposals = demoProposals.map((p) => ({
    id: p.id,
    projectId: p.projectId,
    version: p.version,
    status: p.status,
    revisionTerms: p.revisionTerms,
    issuedAt: p.issuedOn ? new Date(`${p.issuedOn}T00:00:00Z`) : null,
    startOn: p.startOn ?? null,
    endOn: p.endOn ?? null,
    termsLabel: p.termsLabel ?? null,
    revisionRounds: p.revisionRounds ?? null,
    revisionSummary: p.revisionSummary ?? null,
    deliverables: p.deliverables ?? null,
  }));

  return { users, studios, memberships, clients, projects, projectContacts, milestones, proposals };
}
