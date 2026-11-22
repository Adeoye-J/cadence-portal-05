import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BillingPlans } from "@/components/features/billing/billing-plans";
import { CancelPlan } from "@/components/features/billing/cancel-plan";
import { Ico } from "@/components/ui/icon";
import { buildBillingView } from "@/lib/billing/billing-view";
import { BILLING_CYCLES, PLAN_KEYS, type BillingCycle, type PlanKey } from "@/lib/billing/plans";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { settleReturnedCheckout, type ReturnedCheckoutOutcome } from "@/server/billing";
import { billingDeps } from "@/server/billing-runtime";
import { getStudioMembership } from "@/server/studio";
import { getStore } from "@/server/store/registry";

export const metadata: Metadata = { title: "Billing" };

type SearchParams = Promise<{ plan?: string; cycle?: string; reference?: string; return?: string }>;

const STATUS_CHIP = {
  paid: "bg-done-subtle text-done",
  pending: "bg-waiting-subtle text-waiting",
  failed: "bg-danger-subtle text-danger",
} as const;

function noticeFor(outcome: ReturnedCheckoutOutcome): { tone: "ok" | "wait" | "bad"; text: string } | null {
  switch (outcome) {
    case "settled":
    case "already_settled":
      return { tone: "ok", text: "Payment confirmed. Your plan is active." };
    case "not_successful":
      return { tone: "wait", text: "We have not received confirmation of this payment yet. This can take a minute. Refresh the page to check again." };
    case "amount_mismatch":
      return { tone: "bad", text: "The amount paid did not match the plan price, so the plan was not changed. Contact support." };
    default:
      return null;
  }
}

/**
 * Billing (design: billing_plan). Owner only. Shows the plan in force, project usage, the tiers with checkout, invoices
 * and cancellation. Coming back from Paystack, the page confirms the payment itself, so the new plan shows at once.
 */
export default async function BillingPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in?next=/studio/billing");
  const membership = await getStudioMembership(viewer.userId);
  if (!membership) redirect("/onboarding/workspace");

  if (membership.role !== "owner") {
    return (
      <main className="mx-auto flex w-full max-w-[1360px] flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-headline-lg text-on-surface font-semibold tracking-tight">Billing</h1>
        <p className="text-body-lg text-secondary">Only the studio owner can see or change billing. Ask the owner of {membership.studioName}.</p>
      </main>
    );
  }

  const deps = billingDeps();
  const notice = sp.reference && sp.reference.startsWith("sub_") ? noticeFor(await settleReturnedCheckout(deps, membership.studioId, sp.reference)) : null;

  const [subscription, invoices, projects] = await Promise.all([
    deps.store.getSubscription(membership.studioId),
    deps.store.listInvoices(membership.studioId),
    getStore().listProjectsForStudio(membership.studioId),
  ]);
  const view = buildBillingView({ subscription, invoices, activeProjects: projects.filter((p) => p.stage !== "closed").length, now: new Date() });

  const highlightKey: PlanKey | null = PLAN_KEYS.includes(sp.plan as PlanKey) && sp.plan !== "free" ? (sp.plan as PlanKey) : null;
  const initialCycle: BillingCycle = BILLING_CYCLES.includes(sp.cycle as BillingCycle) ? (sp.cycle as BillingCycle) : "monthly";
  const periodEnd = view.periodEndsOn ? formatDate(view.periodEndsOn) : null;
  const card = "bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between";

  return (
    <main className="mx-auto flex w-full max-w-[1360px] flex-col gap-space-xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-label-sm uppercase tracking-widest text-secondary">Studio billing</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="text-label-sm text-primary font-medium">{membership.studioName}</span>
          </div>
          <h1 className="text-headline-lg text-on-surface font-semibold tracking-tight">Billing &amp; Studio Subscription</h1>
          <p className="text-body-sm text-secondary">Manage your studio plan, how many projects can be active at once, and your payment history.</p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <a href="#invoices" className="h-10 px-4 rounded-[10px] bg-surface-container-lowest text-on-surface text-body-sm-medium shadow-sm hover:bg-surface-container transition-colors inline-flex items-center gap-2">
            <Ico name="history" size={18} className="text-secondary" />
            <span>Payment Activity</span>
          </a>
        </div>
      </div>

      {notice ? (
        <p role="status" className={cn("rounded-lg p-3 text-body-sm", notice.tone === "ok" && "bg-done-subtle text-done", notice.tone === "wait" && "bg-waiting-subtle text-waiting", notice.tone === "bad" && "bg-danger-subtle text-danger")}>
          {notice.text}
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        <div className={cn(card, "lg:col-span-5 relative overflow-hidden")}>
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-primary text-label-sm uppercase tracking-wider">
                <Ico name="done" size={14} />
                {view.cancelScheduled ? "Ending" : "Active"}
              </div>
              {view.current.cycleLabel ? <span className="text-label-sm text-secondary font-mono tracking-tight">{view.current.cycleLabel}</span> : null}
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-headline-lg text-on-surface font-semibold">{view.current.name}</span>
              </div>
              <span className="text-body-sm text-secondary tabular-nums">{view.current.priceText}</span>
            </div>
            <div className="pt-space-sm flex flex-col gap-2.5">
              {view.current.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5 text-on-surface text-body-sm">
                  <Ico name="done" size={18} className="text-primary shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-space-lg pt-space-md bg-surface-container-low rounded-lg p-space-md flex flex-col gap-3">
            <div className="flex items-center justify-between text-secondary">
              <span className="text-label-sm uppercase tracking-wider">Billing period</span>
              <span className="text-label-sm font-mono text-on-surface tabular-nums">{periodEnd ? `Until ${periodEnd}` : "No paid period"}</span>
            </div>
            <p className="text-body-sm text-on-surface">
              {periodEnd
                ? view.cancelScheduled
                  ? `Your plan ends on ${periodEnd} and the studio returns to Free.`
                  : `Your plan runs until ${periodEnd}. To keep it, choose the plan again before then. It does not renew by itself.`
                : "You are on the free plan. Choose a plan below to run more projects at once."}
            </p>
          </div>
        </div>

        <div className={cn(card, "lg:col-span-4")}>
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <span className="text-headline-sm text-on-surface font-semibold">Project allocation</span>
              <Ico name="info" size={20} className="text-secondary" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-secondary">Active projects</span>
                <span className="text-on-surface font-medium tabular-nums">
                  {view.usage.active} / {view.usage.limit ?? "Unlimited"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden" role="progressbar" aria-valuenow={view.usage.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Active projects used">
                <div className="h-full bg-primary" style={{ width: `${view.usage.percent}%` }} />
              </div>
              <p className="text-label-sm text-secondary">
                {view.usage.limit === null ? "Your plan has no limit on active projects." : "A project is active until it is closed."}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(card, "lg:col-span-3")}>
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <span className="text-headline-sm text-on-surface font-semibold">Payment</span>
              <Ico name="payments" size={20} className="text-secondary" />
            </div>
            <p className="text-body-sm text-on-surface">Charged in USD through Paystack.</p>
            <p className="text-body-sm text-secondary">Card details are entered on Paystack&apos;s page. Cadence does not store them.</p>
          </div>
        </div>
      </div>

      <BillingPlans tiers={view.tiers} initialCycle={initialCycle} highlightKey={highlightKey} />

      <div id="invoices" className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col scroll-mt-24">
        <div className="p-space-lg flex flex-col">
          <span className="text-headline-sm text-on-surface font-semibold">Invoice History</span>
          <span className="text-body-sm text-secondary">Every plan payment you have started, newest first.</span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-body-sm text-on-surface">
            <thead className="bg-surface-container-low text-secondary text-label-md uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-space-lg py-3 font-medium">Date</th>
                <th scope="col" className="px-space-lg py-3 font-medium">Reference</th>
                <th scope="col" className="px-space-lg py-3 font-medium">Plan</th>
                <th scope="col" className="px-space-lg py-3 font-medium">Billing</th>
                <th scope="col" className="px-space-lg py-3 font-medium text-right">Amount</th>
                <th scope="col" className="px-space-lg py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {view.invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-space-lg py-6 text-secondary">No payments yet.</td>
                </tr>
              ) : (
                view.invoices.map((invoice, i) => (
                  <tr key={invoice.reference} className={cn("hover:bg-surface-container-low/60 transition-colors", i % 2 === 1 && "bg-surface-container-low/20")}>
                    <td className="px-space-lg py-3 tabular-nums whitespace-nowrap">{invoice.dateLabel}</td>
                    <td className="px-space-lg py-3 font-mono text-label-md text-secondary">{invoice.reference}</td>
                    <td className="px-space-lg py-3">{invoice.planName}</td>
                    <td className="px-space-lg py-3">{invoice.cycleLabel}</td>
                    <td className="px-space-lg py-3 text-right tabular-nums">{invoice.amountText}</td>
                    <td className="px-space-lg py-3">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-label-sm", STATUS_CHIP[invoice.status])}>{invoice.statusLabel}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-space-md bg-surface-container-low/40 flex items-center justify-between text-secondary">
          <span className="text-label-sm">Showing {view.invoices.length} billing {view.invoices.length === 1 ? "event" : "events"}</span>
        </div>
      </div>

      {periodEnd ? <CancelPlan periodEndLabel={periodEnd} cancelScheduled={view.cancelScheduled} /> : null}
    </main>
  );
}
