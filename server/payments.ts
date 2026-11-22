import { randomUUID } from "node:crypto";
import type { PaymentProvider } from "@/lib/services/payments";
import { PaymentProviderError } from "@/lib/services/payments";
import type { PaymentRecord as CorePayment, ProjectRecord } from "@/server/core/types";
import { buildEffects } from "@/server/effects";
import { getStore } from "@/server/store/registry";

/**
 * Milestone payments. A milestone has one open payment at a time: the database refuses a second, so two clicks cannot
 * start two charges, and the second click is given the first one's payment page. A payment is marked paid, and its
 * milestone moved to in progress, in one transaction, and only after the provider confirms the charge.
 */

export type PaymentRecord = CorePayment;

export type SettleOutcome =
  | "settled"
  | "already_settled"
  | "unknown_reference"
  | "amount_mismatch"
  | "not_successful";

const BEING_STARTED = "A payment for this milestone is already being started. Try again in a moment.";

async function authorise(viewerUserId: string, projectId: string): Promise<ProjectRecord | null> {
  const project = await getStore().getProject(projectId);
  if (!project || !project.contactUserIds.includes(viewerUserId)) return null;
  return project;
}

export type StartResult =
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; message: string };

/**
 * Starts a payment for a milestone that is payment due. The amount and currency come from the milestone, never from
 * the browser. If an open payment already exists, the client is sent to it.
 */
export async function startMilestonePayment(input: {
  viewerUserId: string;
  viewerEmail: string;
  projectId: string;
  position: number;
  provider: PaymentProvider;
  appUrl: string;
}): Promise<StartResult> {
  const project = await authorise(input.viewerUserId, input.projectId);
  if (!project) return { ok: false, message: "Project not found." };
  const milestone = project.milestones.find((m) => m.position === input.position);
  if (!milestone) return { ok: false, message: "Milestone not found." };
  if (milestone.status !== "payment_due") return { ok: false, message: "This milestone is not ready for payment." };

  const store = getStore();
  const open = await store.findOpenPayment(project.id, milestone.position);
  if (open) {
    if (open.authorizationUrl) return { ok: true, authorizationUrl: open.authorizationUrl, reference: open.reference };
    return { ok: false, message: BEING_STARTED };
  }

  const reference = `${project.reference}-M${milestone.position}-${randomUUID().slice(0, 8)}`.toUpperCase();
  const effects = await buildEffects({
    projectId: project.id,
    kind: "payment_started",
    actor: "client",
    summary: `Payment started for milestone ${milestone.position}`,
  });
  const created = await store.createPayment(
    {
      reference,
      projectId: project.id,
      milestonePosition: milestone.position,
      provider: input.provider.name,
      amountMinor: milestone.amountMinor,
      currency: project.currency,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    effects,
  );
  if (created === "open_exists") return { ok: false, message: BEING_STARTED };

  try {
    const { authorizationUrl } = await input.provider.initiate({
      reference,
      email: input.viewerEmail,
      amountMinor: milestone.amountMinor,
      currency: project.currency,
      callbackUrl: `${input.appUrl}/projects/${project.id}/payments/${reference}`,
      metadata: { projectId: project.id, milestonePosition: String(milestone.position) },
    });
    await store.setPaymentAuthorization(reference, authorizationUrl);
    return { ok: true, authorizationUrl, reference };
  } catch (err) {
    await store.failPayment(reference);
    if (err instanceof PaymentProviderError) return { ok: false, message: err.message };
    return { ok: false, message: "We could not start the payment. Try again." };
  }
}

/**
 * Settles a payment after the provider says it succeeded. The charge is checked with the provider, not taken from the
 * webhook body. Repeating it changes nothing.
 */
export async function settlePayment(reference: string, provider: PaymentProvider): Promise<SettleOutcome> {
  const store = getStore();
  const record = await store.getPayment(reference);
  if (!record) return "unknown_reference";
  if (record.status === "paid") return "already_settled";

  const charge = await provider.verify(reference);
  if (charge.status !== "success") {
    if (charge.status === "failed" || charge.status === "abandoned") await store.failPayment(reference);
    return "not_successful";
  }
  if (charge.amountMinor !== record.amountMinor || charge.currency !== record.currency) return "amount_mismatch";

  const effects = await buildEffects({
    projectId: record.projectId,
    kind: "payment_settled",
    actor: "system",
    summary: `Milestone ${record.milestonePosition} payment settled`,
  });
  const result = await store.settlePayment({ reference, settledAt: new Date().toISOString() }, effects);
  if (result.outcome === "unknown_reference") return "unknown_reference";
  if (result.outcome === "already_settled") return "already_settled";
  // A charge for a milestone that was not payment due (for example a second payment) is still a paid charge.
  if (!result.milestoneActivated) console.warn(`[payments] settled, but the milestone was not payment due: reference=${reference}`);
  return "settled";
}

/** A payment as one of the project's contacts sees it. Null for a stranger or a payment on another project. */
export async function getPaymentForViewer(
  viewerUserId: string,
  projectId: string,
  reference: string,
): Promise<PaymentRecord | null> {
  if (!(await authorise(viewerUserId, projectId))) return null;
  const record = await getStore().getPayment(reference);
  if (!record || record.projectId !== projectId) return null;
  return record;
}

/** Payments across projects, newest first. The caller has already checked access to each project. */
export async function listPaymentsForProjects(projectIds: readonly string[]): Promise<PaymentRecord[]> {
  return getStore().listPaymentsForProjects(projectIds);
}
