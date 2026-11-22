import { randomUUID } from "node:crypto";
import { BILLING_CURRENCY, PLANS, priceMinor, isPaidPlan, type BillingCycle, type PlanKey } from "@/lib/billing/plans";
import { effectivePlan, nextPeriodEnd, projectLimitFor, type SubscriptionRecord } from "@/lib/billing/subscription";
import { PaymentProviderError, type PaymentProvider } from "@/lib/services/payments";
import type { BillingInvoice, BillingStore } from "@/server/billing-store";
import { getStore } from "@/server/store/registry";
import { getStudioMembership } from "@/server/studio";

/** Everything the billing rules need from outside. Tests pass the in-memory store and a fake provider. */
export type BillingDeps = { store: BillingStore; provider: PaymentProvider };

export type StartCheckoutInput = {
  userId: string;
  email: string;
  planKey: "pro" | "studio";
  cycle: BillingCycle;
  callbackUrl: string;
};

export type StartCheckoutResult = { ok: true; authorizationUrl: string } | { ok: false; message: string };

/** Starts a Paystack payment for a plan. Only the studio owner may change the plan. */
export async function startSubscriptionCheckout(deps: BillingDeps, input: StartCheckoutInput): Promise<StartCheckoutResult> {
  const membership = await getStudioMembership(input.userId);
  if (!membership) return { ok: false, message: "Studio not found." };
  if (membership.role !== "owner") return { ok: false, message: "Only the studio owner can change the plan." };
  if (!isPaidPlan(input.planKey)) return { ok: false, message: "The free plan needs no payment." };

  const plan = PLANS[input.planKey];
  const amountMinor = priceMinor(plan, input.cycle);
  const reference = `sub_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const invoice: BillingInvoice = {
    reference,
    studioId: membership.studioId,
    planKey: input.planKey,
    cycle: input.cycle,
    amountMinor,
    currency: BILLING_CURRENCY,
    status: "pending",
    createdAt: new Date().toISOString(),
    paidAt: null,
  };
  await deps.store.createInvoice(invoice);

  try {
    const started = await deps.provider.initiate({
      reference,
      email: input.email,
      amountMinor,
      currency: BILLING_CURRENCY,
      callbackUrl: input.callbackUrl,
      metadata: { kind: "subscription", studioId: membership.studioId, planKey: input.planKey, cycle: input.cycle },
    });
    return { ok: true, authorizationUrl: started.authorizationUrl };
  } catch (error) {
    await deps.store.markFailed(reference);
    if (error instanceof PaymentProviderError) return { ok: false, message: error.message };
    throw error;
  }
}

export type SubscriptionSettleOutcome =
  | "settled"
  | "unknown_reference"
  | "already_settled"
  | "not_successful"
  | "amount_mismatch";

/**
 * Settles a subscription payment. The charge is checked with the provider, not taken from the webhook body. Settling
 * the same reference twice has no further effect.
 */
export async function settleSubscription(
  deps: BillingDeps,
  reference: string,
  now: Date = new Date(),
): Promise<SubscriptionSettleOutcome> {
  const invoice = await deps.store.getInvoice(reference);
  if (!invoice) return "unknown_reference";
  if (invoice.status === "paid") return "already_settled";

  const charge = await deps.provider.verify(reference);
  if (charge.status !== "success") {
    if (charge.status === "failed" || charge.status === "abandoned") await deps.store.markFailed(reference);
    return "not_successful";
  }
  if (charge.amountMinor !== invoice.amountMinor || charge.currency !== invoice.currency) return "amount_mismatch";

  const nowIso = now.toISOString();
  return deps.store.settleInvoice(reference, nowIso, (paid, current) => ({
    studioId: paid.studioId,
    planKey: paid.planKey,
    cycle: paid.cycle,
    periodEnd: nextPeriodEnd({ current, planKey: paid.planKey, cycle: paid.cycle, now }),
    cancelAtPeriodEnd: false,
    updatedAt: nowIso,
  }));
}

export type ReturnedCheckoutOutcome = SubscriptionSettleOutcome | "not_this_studio";

/**
 * Confirms a checkout the owner has just come back from. Paystack's return link carries the payment reference, so the
 * page can ask the provider instead of waiting for the webhook. It only acts on an invoice of the owner's own studio, and
 * settling is idempotent, so the webhook arriving afterwards changes nothing.
 */
export async function settleReturnedCheckout(
  deps: BillingDeps,
  studioId: string,
  reference: string,
  now: Date = new Date(),
): Promise<ReturnedCheckoutOutcome> {
  const invoice = await deps.store.getInvoice(reference);
  if (!invoice || invoice.studioId !== studioId) return "not_this_studio";
  return settleSubscription(deps, reference, now);
}

/** The owner cancels. The studio keeps the plan until the period ends, then returns to Free. Nothing is refunded. */
export async function cancelSubscription(store: BillingStore, studioId: string, now: Date = new Date()): Promise<void> {
  const current = await store.getSubscription(studioId);
  if (!current || effectivePlan(current, now) === "free") return;
  await store.saveSubscription({ ...current, cancelAtPeriodEnd: true, updatedAt: now.toISOString() });
}

export async function currentPlanFor(store: BillingStore, studioId: string, now: Date = new Date()): Promise<PlanKey> {
  return effectivePlan(await store.getSubscription(studioId), now);
}

export type ProjectAllowance = { ok: true } | { ok: false; message: string };

/**
 * Whether the studio may start another active project. A project is active until it is closed. The limit comes
 * from the studio's current plan.
 */
export async function checkNewActiveProject(
  store: BillingStore,
  studioId: string,
  now: Date = new Date(),
): Promise<ProjectAllowance> {
  const plan = await currentPlanFor(store, studioId, now);
  const limit = projectLimitFor(plan);
  if (limit === null) return { ok: true };
  const active = (await getStore().listProjectsForStudio(studioId)).filter((p) => p.stage !== "closed").length;
  if (active < limit) return { ok: true };
  const noun = limit === 1 ? "project" : "projects";
  return {
    ok: false,
    message: `Your ${PLANS[plan].name} plan includes ${limit} active ${noun}. Close one, or upgrade to create another.`,
  };
}

export type { SubscriptionRecord };
