import { PLANS, priceMinor, type BillingCycle, type PlanKey } from "./plans";
import { buildPricingPlans, usd, type PricingPlanView } from "./pricing-view";
import { effectivePlan, type SubscriptionRecord } from "./subscription";
import { formatDate, formatMoney } from "@/lib/format";
import type { BillingInvoice } from "@/server/billing-store";

/** What the billing page shows, worked out from the subscription, the invoices and the studio's projects. */

export type InvoiceRowView = {
  reference: string;
  dateLabel: string;
  planName: string;
  cycleLabel: string;
  amountText: string;
  status: BillingInvoice["status"];
  statusLabel: string;
};

export type BillingView = {
  current: { key: PlanKey; name: string; priceText: string; cycleLabel: string | null; features: string[] };
  /** When the paid period ends, or null on Free. */
  periodEndsOn: string | null;
  cancelScheduled: boolean;
  usage: { active: number; limit: number | null; percent: number };
  tiers: (PricingPlanView & { isCurrent: boolean })[];
  invoices: InvoiceRowView[];
};

const CYCLE_LABEL: Record<BillingCycle, string> = { monthly: "Monthly", annual: "Yearly" };
const STATUS_LABEL: Record<BillingInvoice["status"], string> = { paid: "Paid", pending: "Waiting for payment", failed: "Not paid" };

export function buildBillingView(input: {
  subscription: SubscriptionRecord | null;
  invoices: BillingInvoice[];
  activeProjects: number;
  now: Date;
}): BillingView {
  const { subscription, invoices, activeProjects, now } = input;
  const key = effectivePlan(subscription, now);
  const plan = PLANS[key];
  const paid = key !== "free" && subscription !== null;
  const limit = plan.activeProjectLimit;

  return {
    current: {
      key,
      name: plan.name,
      priceText: paid && subscription.cycle === "annual" ? `${usd(priceMinor(plan, "annual"))} / year` : `${usd(plan.monthlyMinor)} / month`,
      cycleLabel: paid ? CYCLE_LABEL[subscription.cycle] : null,
      features: [...plan.features],
    },
    periodEndsOn: paid ? subscription.periodEnd : null,
    cancelScheduled: paid && subscription.cancelAtPeriodEnd,
    usage: {
      active: activeProjects,
      limit,
      percent: limit === null ? 0 : Math.min(100, Math.round((activeProjects / limit) * 100)),
    },
    tiers: buildPricingPlans().map((p) => ({ ...p, isCurrent: p.key === key })),
    invoices: invoices.map((i) => ({
      reference: i.reference,
      dateLabel: formatDate(i.createdAt),
      planName: PLANS[i.planKey].name,
      cycleLabel: CYCLE_LABEL[i.cycle],
      amountText: formatMoney(i.amountMinor, "USD"),
      status: i.status,
      statusLabel: STATUS_LABEL[i.status],
    })),
  };
}
