"use client";

import { useState, useTransition } from "react";
import { Ico } from "@/components/ui/icon";
import type { BillingCycle, PlanKey } from "@/lib/billing/plans";
import { annualSavingLabel, usd, type PricingPlanView } from "@/lib/billing/pricing-view";
import { cn } from "@/lib/cn";
import { startCheckoutAction } from "@/server/billing-actions";

type Tier = PricingPlanView & { isCurrent: boolean };

const TOGGLE_ON = "px-4 py-1.5 rounded-full text-body-sm-medium transition-all bg-surface-container-lowest text-on-surface shadow-sm focus:outline-none";
const TOGGLE_OFF = "px-4 py-1.5 rounded-full text-body-sm-medium transition-all text-on-surface-variant hover:text-on-surface focus:outline-none";
const PRIMARY = "bg-primary text-on-primary hover:bg-primary-container";
const NEUTRAL = "bg-surface-container-low hover:bg-surface-container text-on-surface";
const BUTTON = "w-full h-10 px-4 rounded-[10px] text-body-sm-medium shadow-sm transition-colors inline-flex items-center justify-center disabled:opacity-60";

/**
 * The plan cards (design: billing_plan, "Available Studio Tiers"). Choosing a plan starts a payment with Paystack and
 * takes the owner to its page. The plan changes only after the payment is confirmed.
 */
export function BillingPlans({
  tiers,
  initialCycle,
  highlightKey,
}: {
  tiers: Tier[];
  initialCycle: BillingCycle;
  highlightKey: PlanKey | null;
}) {
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle);
  const [busy, setBusy] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [, startTransition] = useTransition();

  function choose(planKey: PlanKey) {
    if (planKey === "free") return;
    setError(undefined);
    setBusy(planKey);
    startTransition(async () => {
      const result = await startCheckoutAction({ planKey, cycle });
      if (result.ok) {
        window.location.assign(result.url);
        return;
      }
      setBusy(null);
      setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-space-md pt-space-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-headline-md text-on-surface font-semibold tracking-tight">Available Studio Tiers</h2>
          <p className="text-body-sm text-secondary">Choose a plan and pay with Paystack. Renewal is manual: pay again before the period ends.</p>
        </div>
        <div role="radiogroup" aria-label="Billing cycle" className="inline-flex items-center p-1 rounded-full bg-surface-container shadow-sm select-none self-start">
          <button type="button" role="radio" aria-checked={cycle === "monthly"} onClick={() => setCycle("monthly")} className={cycle === "monthly" ? TOGGLE_ON : TOGGLE_OFF}>
            Monthly
          </button>
          <button type="button" role="radio" aria-checked={cycle === "annual"} onClick={() => setCycle("annual")} className={cn(cycle === "annual" ? TOGGLE_ON : TOGGLE_OFF, "flex items-center gap-1.5")}>
            <span>Yearly</span>
            <span className="text-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-semibold">{annualSavingLabel()}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {tiers.map((tier) => {
          const paid = tier.key !== "free";
          const perMonth = cycle === "annual" ? Math.round(tier.annualMinor / 12) : tier.monthlyMinor;
          return (
            <div
              key={tier.key}
              className={cn(
                "bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between transition-all hover:shadow-md",
                tier.isCurrent && "relative ring-2 ring-primary",
                !tier.isCurrent && highlightKey === tier.key && "ring-2 ring-primary-container/50",
              )}
            >
              {tier.isCurrent ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-on-primary text-label-sm uppercase tracking-wider">Current Tier</div>
              ) : null}
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="text-headline-sm text-on-surface font-semibold">{tier.name}</span>
                  <span className="text-label-sm uppercase tracking-wider text-secondary">{tier.badge}</span>
                </div>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-headline-lg text-on-surface font-semibold tabular-nums">{usd(perMonth)}</span>
                  <span className="text-body-sm text-secondary">/ month</span>
                </div>
                <p className="text-body-sm text-secondary">
                  {paid && cycle === "annual" ? `Billed ${usd(tier.annualMinor)} yearly. ` : null}
                  {tier.summary}
                </p>
                <div className="pt-space-md flex flex-col gap-2">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-body-sm text-on-surface">
                      <Ico name="done" size={16} className="text-primary shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-space-lg">
                {tier.isCurrent && !paid ? (
                  <button type="button" disabled className={cn(BUTTON, "bg-surface-container-high text-secondary cursor-not-allowed shadow-none")}>
                    Current plan
                  </button>
                ) : !paid ? (
                  <a href="#cancel" className={cn(BUTTON, NEUTRAL)}>
                    Cancel to switch to Free
                  </a>
                ) : (
                  <button type="button" onClick={() => choose(tier.key)} disabled={busy !== null} className={cn(BUTTON, tier.isCurrent || tier.featured ? PRIMARY : NEUTRAL)}>
                    {busy === tier.key ? "Opening Paystack…" : tier.isCurrent ? "Renew plan" : `Choose ${tier.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="rounded-lg bg-danger-subtle p-3 text-body-sm text-danger">{error}</p>
      ) : null}
    </div>
  );
}
