import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gt, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { user } from "@/db/auth-schema";
import type { db as DbClient } from "@/db/client";
import {
  accountDeletionRequests,
  changeRequests,
  clients,
  invitations,
  memberships,
  milestones,
  notificationOutbox,
  payments,
  projectContacts,
  projectEvents,
  projectFiles,
  projects,
  proposals,
  signatures,
  studios,
} from "@/db/schema";
import type { EventActor, EventKind, ProjectEvent } from "@/server/event-types";
import {
  OPEN_PAYMENT_TTL_MS,
  type ChangeRequestRecord,
  type CoreStore,
  type Effects,
  type FileRecord,
  type InvitationRecord,
  type MilestoneRecord,
  type PaymentRecord,
  type ProjectRecord,
  type ProposalRecord,
} from "./types";

type Db = typeof DbClient;

/** Serialises project creation so two studios cannot be given the same reference. */
const REFERENCE_LOCK = 7_203_001;

function toMilestone(m: typeof milestones.$inferSelect): MilestoneRecord {
  return {
    position: m.position,
    title: m.title,
    description: m.description ?? undefined,
    terms: m.terms ?? undefined,
    amountMinor: m.amountMinor,
    status: m.status,
    dueDate: m.dueDate ?? undefined,
  };
}

function toProposal(p: typeof proposals.$inferSelect): ProposalRecord {
  return {
    id: p.id,
    projectId: p.projectId,
    version: p.version,
    status: p.status,
    revisionTerms: p.revisionTerms,
    issuedOn: p.issuedAt ? p.issuedAt.toISOString().slice(0, 10) : "",
    startOn: p.startOn ?? undefined,
    endOn: p.endOn ?? undefined,
    termsLabel: p.termsLabel ?? undefined,
    revisionRounds: p.revisionRounds ?? undefined,
    revisionSummary: p.revisionSummary ?? undefined,
    deliverables: p.deliverables ?? undefined,
  };
}

/**
 * Writes a change's events and notification rows. Pass the transaction the change ran in (cast to Db: a transaction has
 * the same insert methods), so they commit or roll back with the change.
 */
export async function applyEffects(database: Db, effects?: Effects): Promise<void> {
  if (!effects) return;
  if (effects.events.length > 0) {
    await database.insert(projectEvents).values(
      effects.events.map((e) => ({
        id: e.id,
        projectId: e.projectId,
        kind: e.kind,
        actor: e.actor,
        summary: e.summary,
        clientVisible: e.clientVisible,
        at: new Date(e.at),
      })),
    );
  }
  if (effects.outbox.length > 0) {
    await database
      .insert(notificationOutbox)
      .values(
        effects.outbox.map((m) => ({
          id: randomUUID(),
          dedupeKey: m.dedupeKey,
          toAddress: m.to,
          subject: m.subject,
          textBody: m.text,
          htmlBody: m.html,
        })),
      )
      .onConflictDoNothing({ target: notificationOutbox.dedupeKey });
  }
}

function toInvitation(r: typeof invitations.$inferSelect): InvitationRecord {
  return {
    id: r.id,
    projectId: r.projectId,
    email: r.email,
    tokenHash: r.tokenHash,
    invitedByUserId: r.invitedByUserId,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    acceptedAt: r.acceptedAt ? r.acceptedAt.toISOString() : undefined,
    revoked: r.revoked,
  };
}

function toChangeRequest(r: typeof changeRequests.$inferSelect): ChangeRequestRecord {
  return {
    id: r.id,
    projectId: r.projectId,
    position: r.position,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    reply: r.replyBody !== null && r.repliedAt ? { body: r.replyBody, repliedAt: r.repliedAt.toISOString() } : undefined,
  };
}

function toFile(r: typeof projectFiles.$inferSelect): FileRecord {
  return {
    id: r.id,
    projectId: r.projectId,
    position: r.position,
    key: r.storageKey,
    filename: r.filename,
    contentType: r.contentType,
    size: r.sizeBytes,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

function selectPayments(database: Db) {
  return database
    .select({ payment: payments, projectId: milestones.projectId, position: milestones.position })
    .from(payments)
    .innerJoin(milestones, eq(payments.milestoneId, milestones.id));
}

function toPayment(row: { payment: typeof payments.$inferSelect; projectId: string; position: number }): PaymentRecord {
  const p = row.payment;
  return {
    reference: p.providerReference,
    projectId: row.projectId,
    milestonePosition: row.position,
    provider: p.provider,
    amountMinor: p.amountMinor,
    currency: p.currency,
    status: p.status === "paid" ? "paid" : p.status === "failed" ? "failed" : "pending",
    createdAt: p.createdAt.toISOString(),
    settledAt: p.settledAt ? p.settledAt.toISOString() : undefined,
    authorizationUrl: p.authorizationUrl ?? undefined,
  };
}

async function hydrate(database: Db, ids: readonly string[]): Promise<ProjectRecord[]> {
  if (ids.length === 0) return [];
  const list = [...ids];
  const rows = await database
    .select({ project: projects, clientName: clients.name, studioName: studios.name })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .innerJoin(studios, eq(projects.studioId, studios.id))
    .where(inArray(projects.id, list))
    .orderBy(asc(projects.reference));
  const ms = await database.select().from(milestones).where(inArray(milestones.projectId, list)).orderBy(asc(milestones.position));
  const contacts = await database.select().from(projectContacts).where(inArray(projectContacts.projectId, list));
  return rows.map(({ project, clientName, studioName }) => ({
    id: project.id,
    studioId: project.studioId,
    reference: project.reference,
    title: project.title,
    studioName,
    clientName,
    currency: project.currency,
    stage: project.stage,
    contactUserIds: contacts.filter((c) => c.projectId === project.id).map((c) => c.userId),
    milestones: ms.filter((m) => m.projectId === project.id).map(toMilestone),
  }));
}

/**
 * The core store in Postgres. Every command that changes more than one row runs in a transaction, and every command
 * that depends on a current state puts that state in its WHERE clause, so a race changes nothing the second time.
 * Needs the core migration (pnpm db:generate, then pnpm db:migrate) and the seed for the demo data.
 */
export function createDrizzleCore(database: Db): CoreStore {
  return {
    async getMembership(userId) {
      const [row] = await database
        .select({ studioId: studios.id, studioName: studios.name, role: memberships.role })
        .from(memberships)
        .innerJoin(studios, eq(memberships.studioId, studios.id))
        .where(eq(memberships.userId, userId))
        .orderBy(asc(studios.createdAt), asc(studios.id))
        .limit(1);
      return row ?? null;
    },
    async listMembers(studioId) {
      const rows = await database
        .select({ userId: memberships.userId, role: memberships.role, email: user.email })
        .from(memberships)
        .innerJoin(user, eq(memberships.userId, user.id))
        .where(eq(memberships.studioId, studioId));
      return rows;
    },
    async getEmails(userIds) {
      if (userIds.length === 0) return {};
      const rows = await database.select({ id: user.id, email: user.email }).from(user).where(inArray(user.id, [...userIds]));
      return Object.fromEntries(rows.map((r) => [r.id, r.email]));
    },

    async getProject(projectId) {
      const [found] = await hydrate(database, [projectId]);
      return found ?? null;
    },
    async listProjectsForContact(userId) {
      const rows = await database.select({ id: projectContacts.projectId }).from(projectContacts).where(eq(projectContacts.userId, userId));
      return hydrate(database, rows.map((r) => r.id));
    },
    async listProjectsForStudio(studioId) {
      const rows = await database.select({ id: projects.id }).from(projects).where(eq(projects.studioId, studioId));
      return hydrate(database, rows.map((r) => r.id));
    },
    async getProposal(proposalId) {
      const [row] = await database.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
      return row ? toProposal(row) : null;
    },
    async listProposals(projectId) {
      const rows = await database.select().from(proposals).where(eq(proposals.projectId, projectId)).orderBy(asc(proposals.version));
      return rows.map(toProposal);
    },
    async listProposalsForProjects(projectIds) {
      if (projectIds.length === 0) return [];
      const rows = await database.select().from(proposals).where(inArray(proposals.projectId, [...projectIds])).orderBy(asc(proposals.version));
      return rows.map(toProposal);
    },

    async createStudioWithOwner(userId, studioName) {
      const studioId = `stu_${randomUUID().slice(0, 12)}`;
      await database.transaction(async (tx) => {
        await tx.insert(studios).values({ id: studioId, name: studioName });
        await tx.insert(memberships).values({ studioId, userId, role: "owner" });
      });
      return { studioId };
    },
    async createDraftProject(input, effects) {
      const projectId = input.projectId ?? `prj_${randomUUID().slice(0, 12)}`;
      const proposalId = input.proposalId ?? `prp_${randomUUID().slice(0, 12)}`;
      return database.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(${REFERENCE_LOCK})`);
        const [latest] = await tx
          .select({ n: sql<number>`coalesce(max(cast(substring(${projects.reference}, '[0-9]+$') as integer)), 0)` })
          .from(projects);
        const reference = `CAD-2026-${String((latest?.n ?? 0) + 1).padStart(3, "0")}`;

        const [existing] = await tx
          .select({ id: clients.id })
          .from(clients)
          .where(and(eq(clients.studioId, input.studioId), eq(clients.name, input.clientName)))
          .limit(1);
        const clientId = existing?.id ?? `cli_${randomUUID().slice(0, 12)}`;
        if (!existing) await tx.insert(clients).values({ id: clientId, studioId: input.studioId, name: input.clientName });

        await tx.insert(projects).values({
          id: projectId,
          studioId: input.studioId,
          clientId,
          reference,
          title: input.title,
          currency: input.currency,
          stage: "proposal",
        });
        await tx.insert(milestones).values(
          input.milestones.map((m, i) => ({
            id: `ms_${projectId}_${i + 1}`,
            projectId,
            position: i + 1,
            title: m.title,
            description: m.description ?? null,
            amountMinor: m.amountMinor,
            status: "upcoming" as const,
            dueDate: m.dueDate ?? null,
          })),
        );
        await tx.insert(proposals).values({
          id: proposalId,
          projectId,
          version: 0,
          status: "draft",
          revisionTerms: input.revisionTerms,
        });
        await applyEffects(tx as unknown as Db, effects);
        return { projectId, proposalId, reference };
      });
    },
    async sendDraftProposal(projectId, issuedOn, version, effects) {
      return database.transaction(async (tx) => {
        const sent = await tx
          .update(proposals)
          .set({ status: "sent", version, issuedAt: new Date(`${issuedOn}T00:00:00Z`) })
          .where(and(eq(proposals.projectId, projectId), eq(proposals.status, "draft")))
          .returning({ id: proposals.id });
        if (sent.length !== 1) return null;
        await applyEffects(tx as unknown as Db, effects);
        return { version };
      });
    },
    async commitSignature(record, effects) {
      return database.transaction(async (tx): Promise<"signed" | "not_open"> => {
        // The conditional update takes the row lock: a second signing waits, then matches nothing.
        const [opened] = await tx
          .update(proposals)
          .set({ status: "signed" })
          .where(and(eq(proposals.id, record.proposalId), eq(proposals.status, "sent")))
          .returning({ projectId: proposals.projectId });
        if (!opened) return "not_open";
        await tx.insert(signatures).values({
          id: `sig_${randomUUID().slice(0, 16)}`,
          proposalId: record.proposalId,
          signerUserId: record.signerUserId,
          typedName: record.typedName,
          documentSha256: record.documentSha256,
          signedAt: new Date(record.signedAt),
        });
        await tx.update(projects).set({ stage: "signed" }).where(eq(projects.id, opened.projectId));
        await tx
          .update(milestones)
          .set({ status: "payment_due" })
          .where(and(eq(milestones.projectId, opened.projectId), eq(milestones.position, 1), eq(milestones.status, "upcoming")));
        await applyEffects(tx as unknown as Db, effects);
        return "signed";
      });
    },
    async applyMilestoneTransition(t) {
      return database.transaction(async (tx) => {
        const moved = await tx
          .update(milestones)
          .set({ status: t.to })
          .where(and(eq(milestones.projectId, t.projectId), eq(milestones.position, t.position), eq(milestones.status, t.from)))
          .returning({ id: milestones.id });
        if (moved.length === 0) return { applied: false, projectCompleted: false };
        if (t.changeRequest) {
          await tx.insert(changeRequests).values({
            id: t.changeRequest.id,
            projectId: t.changeRequest.projectId,
            position: t.changeRequest.position,
            body: t.changeRequest.body,
            createdAt: new Date(t.changeRequest.createdAt),
          });
        }
        if (t.activateNext) {
          await tx
            .update(milestones)
            .set({ status: "payment_due" })
            .where(and(eq(milestones.projectId, t.projectId), eq(milestones.position, t.position + 1), eq(milestones.status, "upcoming")));
        }
        let projectCompleted = false;
        if (t.completeIfAllApproved) {
          const [open] = await tx
            .select({ n: sql<number>`count(*)::int` })
            .from(milestones)
            .where(and(eq(milestones.projectId, t.projectId), sql`${milestones.status} <> 'approved'`));
          if ((open?.n ?? 1) === 0) {
            const done = await tx
              .update(projects)
              .set({ stage: "completed" })
              .where(and(eq(projects.id, t.projectId), sql`${projects.stage} <> 'completed'`))
              .returning({ id: projects.id });
            projectCompleted = done.length === 1;
          }
        }
        await applyEffects(tx as unknown as Db, t.effects);
        if (projectCompleted) await applyEffects(tx as unknown as Db, t.completionEffects);
        return { applied: true, projectCompleted };
      });
    },
    async addProjectContact(projectId, userId) {
      await database.insert(projectContacts).values({ projectId, userId }).onConflictDoNothing();
    },

    async listEvents(projectId, audience) {
      const rows = await database
        .select()
        .from(projectEvents)
        .where(
          audience === "studio"
            ? eq(projectEvents.projectId, projectId)
            : and(eq(projectEvents.projectId, projectId), eq(projectEvents.clientVisible, true)),
        )
        .orderBy(desc(projectEvents.seq));
      return rows.map(
        (r): ProjectEvent => ({
          id: r.id,
          seq: r.seq,
          projectId: r.projectId,
          kind: r.kind as EventKind,
          actor: r.actor as EventActor,
          summary: r.summary,
          clientVisible: r.clientVisible,
          at: r.at.toISOString(),
        }),
      );
    },
    async appendEffects(effects) {
      await database.transaction(async (tx) => {
        await applyEffects(tx as unknown as Db, effects);
      });
    },

    async createInvitation(r, effects) {
      await database.transaction(async (tx) => {
        await tx.insert(invitations).values({
          id: r.id,
          projectId: r.projectId,
          email: r.email,
          tokenHash: r.tokenHash,
          invitedByUserId: r.invitedByUserId,
          createdAt: new Date(r.createdAt),
          expiresAt: new Date(r.expiresAt),
          acceptedAt: r.acceptedAt ? new Date(r.acceptedAt) : null,
          revoked: r.revoked,
        });
        await applyEffects(tx as unknown as Db, effects);
      });
    },
    async findInvitationByHash(tokenHash) {
      const [row] = await database.select().from(invitations).where(eq(invitations.tokenHash, tokenHash)).limit(1);
      return row ? toInvitation(row) : null;
    },
    async acceptInvitation({ invitationId, userId, acceptedAt }, effects) {
      return database.transaction(async (tx): Promise<"accepted" | "unavailable"> => {
        const at = new Date(acceptedAt);
        // Conditional on the invitation still being unused, unrevoked and unexpired: one acceptance can win.
        const [row] = await tx
          .update(invitations)
          .set({ acceptedAt: at })
          .where(and(eq(invitations.id, invitationId), isNull(invitations.acceptedAt), eq(invitations.revoked, false), gt(invitations.expiresAt, at)))
          .returning({ projectId: invitations.projectId });
        if (!row) return "unavailable";
        await tx.insert(projectContacts).values({ projectId: row.projectId, userId }).onConflictDoNothing();
        await applyEffects(tx as unknown as Db, effects);
        return "accepted";
      });
    },
    async revokeInvitation(invitationId) {
      await database.update(invitations).set({ revoked: true }).where(eq(invitations.id, invitationId));
    },
    async listInvitations(projectId) {
      const rows = await database.select().from(invitations).where(eq(invitations.projectId, projectId)).orderBy(asc(invitations.createdAt));
      return rows.map(toInvitation);
    },

    async listChangeRequests(projectId) {
      const rows = await database.select().from(changeRequests).where(eq(changeRequests.projectId, projectId)).orderBy(asc(changeRequests.createdAt));
      return rows.map(toChangeRequest);
    },
    async replyToChangeRequest({ id, projectId, body, repliedAt }, effects) {
      return database.transaction(async (tx): Promise<"replied" | "already_replied" | "not_found"> => {
        const [row] = await tx
          .update(changeRequests)
          .set({ replyBody: body, repliedAt: new Date(repliedAt) })
          .where(and(eq(changeRequests.id, id), eq(changeRequests.projectId, projectId), isNull(changeRequests.replyBody)))
          .returning({ id: changeRequests.id });
        if (!row) {
          const [exists] = await tx
            .select({ id: changeRequests.id })
            .from(changeRequests)
            .where(and(eq(changeRequests.id, id), eq(changeRequests.projectId, projectId)))
            .limit(1);
          return exists ? "already_replied" : "not_found";
        }
        await applyEffects(tx as unknown as Db, effects);
        return "replied";
      });
    },

    async createFile(f) {
      await database.insert(projectFiles).values({
        id: f.id,
        projectId: f.projectId,
        position: f.position,
        storageKey: f.key,
        filename: f.filename,
        contentType: f.contentType,
        sizeBytes: f.size,
        status: f.status,
        createdAt: new Date(f.createdAt),
      });
    },
    async getFile(fileId) {
      const [row] = await database.select().from(projectFiles).where(eq(projectFiles.id, fileId)).limit(1);
      return row ? toFile(row) : null;
    },
    async markFileReady(fileId, effects) {
      return database.transaction(async (tx) => {
        const moved = await tx
          .update(projectFiles)
          .set({ status: "ready" })
          .where(and(eq(projectFiles.id, fileId), eq(projectFiles.status, "pending")))
          .returning({ id: projectFiles.id });
        if (moved.length === 0) return false;
        await applyEffects(tx as unknown as Db, effects);
        return true;
      });
    },
    async removeFile(fileId, effects) {
      return database.transaction(async (tx) => {
        const removed = await tx.delete(projectFiles).where(eq(projectFiles.id, fileId)).returning({ id: projectFiles.id });
        if (removed.length === 0) return false;
        await applyEffects(tx as unknown as Db, effects);
        return true;
      });
    },
    async listReadyFiles(projectId, position) {
      const rows = await database
        .select()
        .from(projectFiles)
        .where(and(eq(projectFiles.projectId, projectId), eq(projectFiles.position, position), eq(projectFiles.status, "ready")))
        .orderBy(asc(projectFiles.createdAt));
      return rows.map(toFile);
    },
    async listPendingFilesBefore(isoCutoff) {
      const rows = await database
        .select()
        .from(projectFiles)
        .where(and(eq(projectFiles.status, "pending"), lt(projectFiles.createdAt, new Date(isoCutoff))));
      return rows.map(toFile);
    },

    async findOpenPayment(projectId, position) {
      const [row] = await selectPayments(database)
        .where(
          and(
            eq(milestones.projectId, projectId),
            eq(milestones.position, position),
            eq(payments.status, "pending"),
            gt(payments.createdAt, new Date(Date.now() - OPEN_PAYMENT_TTL_MS)),
          ),
        )
        .limit(1);
      return row ? toPayment(row) : null;
    },
    async createPayment(record, effects) {
      if (record.provider !== "paystack" && record.provider !== "flutterwave") {
        throw new Error(`Unknown payment provider: ${record.provider}`);
      }
      const provider = record.provider;
      return database.transaction(async (tx): Promise<"created" | "open_exists"> => {
        const [milestone] = await tx
          .select({ id: milestones.id })
          .from(milestones)
          .where(and(eq(milestones.projectId, record.projectId), eq(milestones.position, record.milestonePosition)))
          .limit(1);
        if (!milestone) throw new Error("Milestone not found for the payment.");
        // An open payment older than the limit was abandoned. Free the milestone for a new one.
        await tx
          .update(payments)
          .set({ status: "failed" })
          .where(and(eq(payments.milestoneId, milestone.id), eq(payments.status, "pending"), lt(payments.createdAt, new Date(Date.now() - OPEN_PAYMENT_TTL_MS))));
        // The partial unique index allows one pending payment per milestone: a second insert changes nothing.
        const inserted = await tx
          .insert(payments)
          .values({
            id: `pay_${randomUUID().slice(0, 16)}`,
            milestoneId: milestone.id,
            provider,
            providerReference: record.reference,
            amountMinor: record.amountMinor,
            currency: record.currency,
            status: "pending",
            createdAt: new Date(record.createdAt),
          })
          .onConflictDoNothing()
          .returning({ id: payments.id });
        if (inserted.length === 0) return "open_exists";
        await applyEffects(tx as unknown as Db, effects);
        return "created";
      });
    },
    async setPaymentAuthorization(reference, url) {
      await database.update(payments).set({ authorizationUrl: url }).where(eq(payments.providerReference, reference));
    },
    async failPayment(reference) {
      await database
        .update(payments)
        .set({ status: "failed" })
        .where(and(eq(payments.providerReference, reference), eq(payments.status, "pending")));
    },
    async getPayment(reference) {
      const [row] = await selectPayments(database).where(eq(payments.providerReference, reference)).limit(1);
      return row ? toPayment(row) : null;
    },
    async listPaymentsForProjects(projectIds) {
      if (projectIds.length === 0) return [];
      const rows = await selectPayments(database).where(inArray(milestones.projectId, [...projectIds])).orderBy(desc(payments.createdAt));
      return rows.map(toPayment);
    },
    async settlePayment({ reference, settledAt }, effects) {
      return database.transaction(async (tx) => {
        // Only one settlement can match: a paid payment is excluded by the condition.
        const [paid] = await tx
          .update(payments)
          .set({ status: "paid", settledAt: new Date(settledAt) })
          .where(and(eq(payments.providerReference, reference), ne(payments.status, "paid")))
          .returning({ milestoneId: payments.milestoneId });
        if (!paid) {
          const [exists] = await tx.select({ id: payments.id }).from(payments).where(eq(payments.providerReference, reference)).limit(1);
          return { outcome: exists ? ("already_settled" as const) : ("unknown_reference" as const), milestoneActivated: false };
        }
        const [moved] = await tx
          .update(milestones)
          .set({ status: "in_progress" })
          .where(and(eq(milestones.id, paid.milestoneId), eq(milestones.status, "payment_due")))
          .returning({ projectId: milestones.projectId });
        if (moved) await tx.update(projects).set({ stage: "in_progress" }).where(eq(projects.id, moved.projectId));
        await applyEffects(tx as unknown as Db, effects);
        return { outcome: "settled" as const, milestoneActivated: Boolean(moved) };
      });
    },

    async requestDeletion(userId, requestedAt) {
      const inserted = await database
        .insert(accountDeletionRequests)
        .values({ userId, requestedAt: new Date(requestedAt) })
        .onConflictDoNothing()
        .returning({ requestedAt: accountDeletionRequests.requestedAt });
      const first = inserted[0];
      if (first) return { requestedAt: first.requestedAt.toISOString(), alreadyRequested: false };
      const [existing] = await database.select().from(accountDeletionRequests).where(eq(accountDeletionRequests.userId, userId)).limit(1);
      return { requestedAt: existing ? existing.requestedAt.toISOString() : requestedAt, alreadyRequested: true };
    },
    async getDeletionRequest(userId) {
      const [row] = await database.select().from(accountDeletionRequests).where(eq(accountDeletionRequests.userId, userId)).limit(1);
      return row ? row.requestedAt.toISOString() : null;
    },
  };
}
