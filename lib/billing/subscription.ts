import { periodDays, PLANS, type BillingCycle, type PlanKey } from "./plans";

const DAY_MS = 86_400_000;

export type SubscriptionRecord = {
  studioId: string;
  planKey: PlanKey;
  cycle: BillingCycle;
  /** When the paid period ends. After this moment the studio is back on the free plan. */
  periodEnd: string;
  /** Set when the owner cancels. The plan stays until periodEnd, then the studio is on Free. */
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
};

/** The plan a studio is on right now. Lapsed or missing subscriptions are Free. */
export function effectivePlan(subscription: SubscriptionRecord | null, now: Date): PlanKey {
  if (!subscription) return "free";
  return Date.parse(subscription.periodEnd) > now.getTime() ? subscription.planKey : "free";
}

/**
 * The end of the period after a successful charge. Paying for the plan already in force adds a period to what remains,
 * so early renewal is not lost. Changing plan starts a new period from now. Remaining time on the old plan is not
 * credited in this release (no proration).
 */
export function nextPeriodEnd(input: {
  current: SubscriptionRecord | null;
  planKey: PlanKey;
  cycle: BillingCycle;
  now: Date;
}): string {
  const { current, planKey, cycle, now } = input;
  const stillRunning = current !== null && current.planKey === planKey && Date.parse(current.periodEnd) > now.getTime();
  const base = stillRunning ? Date.parse(current.periodEnd) : now.getTime();
  return new Date(base + periodDays(cycle) * DAY_MS).toISOString();
}

export function projectLimitFor(plan: PlanKey): number | null {
  return PLANS[plan].activeProjectLimit;
}
