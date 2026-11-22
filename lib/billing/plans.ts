/**
 * Studio plans. One canonical set, taken from the pricing and billing designs and limited to what the product
 * enforces today. Features the product does not have (automated escrow, SLA response times, custom domains, seat
 * limits, automatic renewals) are not sold. See docs/design-decisions.md, "Pricing and billing".
 */

export const PLAN_KEYS = ["free", "pro", "studio"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const BILLING_CYCLES = ["monthly", "annual"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

/** Subscriptions are charged in USD. Confirm the Paystack account accepts USD before launch. */
export const BILLING_CURRENCY = "USD" as const;

export type Plan = {
  key: PlanKey;
  name: string;
  monthlyMinor: number;
  /** Projects that may be active (not closed) at the same time. null means no limit. */
  activeProjectLimit: number | null;
  summary: string;
  features: readonly string[];
};

/** The only difference between plans that the product enforces is how many projects may be active at once. */
function projectsFeature(limit: number | null): string {
  if (limit === null) return "Unlimited active projects";
  return limit === 1 ? "1 active project at a time" : `Up to ${limit} active projects at a time`;
}

const EVERYTHING_PLANS_HAVE = [
  "Clients sign in with an email link, no password",
  "Milestone payments in USD and NGN",
  "Change requests with replies on every milestone",
  "Activity log and file downloads",
] as const;

export const PLANS: Record<PlanKey, Plan> = {
  free: {
    key: "free",
    name: "Free",
    monthlyMinor: 0,
    activeProjectLimit: 1,
    summary: "Ideal for solo operators starting clean, contractual delivery.",
    features: [projectsFeature(1), ...EVERYTHING_PLANS_HAVE],
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyMinor: 2900,
    activeProjectLimit: 5,
    summary: "For busy freelancers and boutique studios running several client projects.",
    features: [projectsFeature(5), "Everything in Free"],
  },
  studio: {
    key: "studio",
    name: "Studio",
    monthlyMinor: 7900,
    activeProjectLimit: null,
    summary: "For agencies running many client projects at once.",
    features: [projectsFeature(null), "Everything in Free"],
  },
};

/** Annual billing is 20% off twelve months. */
export const ANNUAL_DISCOUNT = 0.2;

export function priceMinor(plan: Plan, cycle: BillingCycle): number {
  if (cycle === "monthly") return plan.monthlyMinor;
  return Math.round(plan.monthlyMinor * 12 * (1 - ANNUAL_DISCOUNT));
}

export function periodDays(cycle: BillingCycle): number {
  return cycle === "monthly" ? 30 : 365;
}

export function isPaidPlan(key: PlanKey): boolean {
  return key !== "free";
}
