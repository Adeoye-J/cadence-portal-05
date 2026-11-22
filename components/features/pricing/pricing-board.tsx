"use client";

import Link from "next/link";
import { useState } from "react";
import { Ico } from "@/components/ui/icon";
import { annualSavingLabel, usd, type PricingPlanView } from "@/lib/billing/pricing-view";
import type { BillingCycle } from "@/lib/billing/plans";
import { cn } from "@/lib/cn";
import { routeTo } from "@/lib/routes";

const TOGGLE_ON = "px-5 py-2 rounded-full text-body-sm-medium transition-all duration-200 bg-surface-container-lowest text-on-surface shadow-sm focus:outline-none";
const TOGGLE_OFF = "px-5 py-2 rounded-full text-body-sm-medium transition-all duration-200 text-on-surface-variant hover:text-on-surface focus:outline-none";

const CARD = "flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg relative";
const CTA = "w-full inline-flex items-center justify-center h-11 px-5 rounded-[10px] text-body-sm-medium transition-colors focus:outline-none focus:ring-2";

/**
 * The hero, the billing toggle and the plan cards. The toggle changes the prices shown and where the buttons go. Prices
 * and limits come from the plans, so the page cannot disagree with what the product enforces.
 */
export function PricingBoard({ plans }: { plans: PricingPlanView[] }) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <>
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-md uppercase tracking-wider mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Predictable Operational Scale
        </div>
        <h1 className="text-headline-xl text-on-surface tracking-tight mb-3">Transparent pricing for calm delivery</h1>
        <p className="text-body-lg text-on-surface-variant max-w-xl">
          Start on your next project free. Upgrade when you need more projects running at once.
        </p>
        <div role="radiogroup" aria-label="Billing cycle" className="mt-8 inline-flex items-center p-1 rounded-full bg-surface-container shadow-sm select-none">
          <button type="button" role="radio" aria-checked={cycle === "monthly"} onClick={() => setCycle("monthly")} className={cycle === "monthly" ? TOGGLE_ON : TOGGLE_OFF}>
            Monthly
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={cycle === "annual"}
            onClick={() => setCycle("annual")}
            className={cn(cycle === "annual" ? TOGGLE_ON : TOGGLE_OFF, "flex items-center gap-1.5")}
          >
            <span>Annual</span>
            <span className="text-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-semibold">{annualSavingLabel()}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-2">
        {plans.map((plan) => {
          const paid = plan.key !== "free";
          const perMonth = cycle === "annual" ? Math.round(plan.annualMinor / 12) : plan.monthlyMinor;
          return (
            <div key={plan.key} className={cn(CARD, plan.featured ? "shadow-xl -mt-0 md:-mt-2 mb-0 md:mb-2" : "shadow-sm hover:shadow-md transition-shadow")}>
              {plan.featured ? <div className="absolute top-0 inset-x-0 h-1.5 bg-primary rounded-t-xl" /> : null}
              <div>
                <div className={cn("flex items-center justify-between mb-4", plan.featured && "pt-1")}>
                  <h2 className="text-headline-sm text-on-surface">{plan.name}</h2>
                  <span
                    className={cn(
                      "text-label-sm px-2.5 py-1 rounded-full uppercase tracking-wider",
                      plan.featured ? "bg-primary-container text-on-primary font-semibold" : "bg-surface-container text-on-surface-variant",
                    )}
                  >
                    {plan.badge}
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant mb-6 min-h-[40px]">{plan.summary}</p>
                <div className="flex items-baseline gap-1 mb-6 pb-6">
                  <span className="text-headline-xl text-on-surface tracking-tight font-semibold tabular-nums">{usd(perMonth)}</span>
                  <span className="text-body-sm text-on-surface-variant">/ month</span>
                </div>
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Ico name="done" size={20} className="text-primary shrink-0 mt-0.5" />
                      <span className={cn("text-body-sm text-on-surface", plan.featured && i === 0 && "font-semibold")}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                {paid ? (
                  <Link
                    href={routeTo(`/studio/billing?plan=${plan.key}&cycle=${cycle}`)}
                    className={cn(CTA, plan.featured ? "bg-primary text-on-primary hover:bg-primary-container shadow-md focus:ring-primary focus:ring-offset-2" : "bg-surface-container text-on-surface hover:bg-surface-container-high focus:ring-primary-container")}
                  >
                    Choose {plan.name}
                  </Link>
                ) : (
                  <Link href="/sign-up" className={cn(CTA, "bg-surface-container text-on-surface hover:bg-surface-container-high focus:ring-primary-container")}>
                    Start free
                  </Link>
                )}
                <p className="text-label-sm text-center text-on-surface-variant mt-2">
                  {!paid ? "No credit card required" : cycle === "annual" ? `Billed ${usd(plan.annualMinor)} yearly. Cancel anytime.` : "Billed monthly. Cancel anytime."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
