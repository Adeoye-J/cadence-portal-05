import { ANNUAL_DISCOUNT, PLAN_KEYS, PLANS, priceMinor, type PlanKey } from "./plans";

/** What the pricing page shows, worked out from the plans so the page cannot disagree with what is enforced. */

export type PricingPlanView = {
  key: PlanKey;
  name: string;
  badge: string;
  summary: string;
  monthlyMinor: number;
  annualMinor: number;
  features: string[];
  featured: boolean;
};

const BADGES: Record<PlanKey, string> = { free: "Starter", pro: "Recommended", studio: "Scale" };

/** US dollars without cents when the amount is whole: $29, $23.20. */
export function usd(minor: number): string {
  return minor % 100 === 0 ? `$${minor / 100}` : `$${(minor / 100).toFixed(2)}`;
}

export function buildPricingPlans(): PricingPlanView[] {
  return PLAN_KEYS.map((key) => {
    const plan = PLANS[key];
    return {
      key,
      name: plan.name,
      badge: BADGES[key],
      summary: plan.summary,
      monthlyMinor: plan.monthlyMinor,
      annualMinor: priceMinor(plan, "annual"),
      features: [...plan.features],
      featured: key === "pro",
    };
  });
}

export function annualSavingLabel(): string {
  return `Save ${Math.round(ANNUAL_DISCOUNT * 100)}%`;
}

export type MatrixCell = { kind: "text"; text: string } | { kind: "check" } | { kind: "none" };
export type MatrixRow = { label: string; cells: [MatrixCell, MatrixCell, MatrixCell] };
export type MatrixGroup = { title: string; rows: MatrixRow[] };

const check: MatrixCell = { kind: "check" };
const none: MatrixCell = { kind: "none" };
const all = (): [MatrixCell, MatrixCell, MatrixCell] => [check, check, check];

function limitText(limit: number | null): string {
  if (limit === null) return "Unlimited";
  return limit === 1 ? "1 project" : `${limit} projects`;
}

/** The comparison table. Every row is something the product does or enforces. */
export function buildMatrix(): MatrixGroup[] {
  const [free, pro, studio] = PLAN_KEYS.map((k) => PLANS[k]);
  return [
    {
      title: "Projects & Clients",
      rows: [
        {
          label: "Active projects at a time",
          cells: [
            { kind: "text", text: limitText(free!.activeProjectLimit) },
            { kind: "text", text: limitText(pro!.activeProjectLimit) },
            { kind: "text", text: limitText(studio!.activeProjectLimit) },
          ],
        },
        { label: "Clients sign in with an email link, no password", cells: all() },
        { label: "Change requests with replies on every milestone", cells: all() },
      ],
    },
    {
      title: "Milestones & Payments",
      rows: [
        { label: "Milestone payments in USD and NGN", cells: all() },
        { label: "Payment confirmed with the provider before work starts", cells: all() },
        { label: "Typed-name sign-off with a fingerprint of the terms", cells: all() },
      ],
    },
    {
      title: "Files & Activity",
      rows: [
        { label: "Deliverable downloads with short-lived links", cells: all() },
        { label: "Activity log on every project", cells: all() },
      ],
    },
    {
      title: "Billing",
      rows: [
        { label: "Pay monthly, or yearly at 20% off", cells: [none, check, check] },
        { label: "Cancel any time; the plan runs to the end of the paid period", cells: [none, check, check] },
      ],
    },
  ];
}
