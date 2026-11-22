import type { Metadata } from "next";
import { Fragment } from "react";
import { PricingBoard } from "@/components/features/pricing/pricing-board";
import { Ico } from "@/components/ui/icon";
import { buildMatrix, buildPricingPlans, type MatrixCell } from "@/lib/billing/pricing-view";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free for one active project. Pro and Studio raise the number of projects you can run at once.",
};

const QUESTIONS = [
  {
    icon: "exchange",
    tone: "bg-secondary-container text-on-secondary-container",
    question: "Can I switch currencies per project?",
    answer: "Yes. Each project is set to USD or NGN when it is created, and keeps that currency for all of its milestones.",
  },
  {
    icon: "shield",
    tone: "bg-primary-container/10 text-primary",
    question: "What happens if a client doesn't pay?",
    answer: "Work on a milestone starts once its payment has been confirmed by the payment provider. Cadence does not hold funds or chase payments for you.",
  },
  {
    icon: "eventRepeat",
    tone: "bg-surface-container-high text-on-surface",
    question: "Can I cancel or switch tiers anytime?",
    answer: "Yes. Cancel from billing and your plan runs to the end of the period you paid for, then returns to Free. Changing plan starts a new period from the day you pay. Unused time is not credited, and nothing is refunded.",
  },
] as const;

function Cell({ cell, column }: { cell: MatrixCell; column: 0 | 1 | 2 }) {
  const shade = column === 1 ? " bg-primary/5" : "";
  if (cell.kind === "check") {
    return (
      <td className={`py-3.5 px-6 text-center${shade}`}>
        <Ico name="check" size={20} className="inline text-primary" />
        <span className="sr-only">Included</span>
      </td>
    );
  }
  if (cell.kind === "none") {
    return (
      <td className={`py-3.5 px-6 text-center text-on-surface-variant${shade}`}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not included</span>
      </td>
    );
  }
  return (
    <td
      className={cn(
        "py-3.5 px-6 text-center tabular-nums",
        column === 0 && "text-body-sm text-on-surface-variant",
        column === 1 && "text-body-sm-medium text-primary bg-primary/5",
        column === 2 && "text-body-sm-medium text-on-surface",
      )}
    >
      {cell.text}
    </td>
  );
}

/** Pricing (design: pricing). Plans, prices and the comparison come from lib/billing, so they match what is enforced. */
export default function PricingPage() {
  const plans = buildPricingPlans();
  const matrix = buildMatrix();
  return (
    <main className="w-full flex-1 pt-16 bg-canvas">
      <div className="flex flex-col w-full">
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-primary-container/10 via-primary-container/5 to-transparent blur-3xl pointer-events-none rounded-full" />
          <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin pt-12 pb-16 relative">
            <PricingBoard plans={plans} />
          </div>
        </div>

        <section className="w-full py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
            <div className="max-w-2xl mb-10">
              <h2 className="text-headline-lg text-on-surface tracking-tight mb-2">Compare plans in detail</h2>
              <p className="text-body-lg text-on-surface-variant">The plans differ in one thing: how many projects can be active at once.</p>
            </div>
            <div className="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/60">
                    <th scope="col" className="py-4 px-6 text-headline-sm text-on-surface w-2/5">Capabilities</th>
                    <th scope="col" className="py-4 px-6 text-headline-sm text-on-surface text-center w-1/5">Free</th>
                    <th scope="col" className="py-4 px-6 text-headline-sm text-primary text-center w-1/5 bg-primary/5">Pro</th>
                    <th scope="col" className="py-4 px-6 text-headline-sm text-on-surface text-center w-1/5">Studio</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {matrix.map((group) => (
                    <Fragment key={group.title}>
                      <tr className="bg-surface-container-low/70">
                        <th scope="colgroup" colSpan={4} className="py-3 px-6 text-label-md uppercase tracking-wider text-on-surface font-bold text-left">
                          {group.title}
                        </th>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.label} className="hover:bg-surface-container-low/30 transition-colors">
                          <th scope="row" className="py-3.5 px-6 text-body-sm text-on-surface font-normal text-left">{row.label}</th>
                          <Cell cell={row.cells[0]} column={0} />
                          <Cell cell={row.cells[1]} column={1} />
                          <Cell cell={row.cells[2]} column={2} />
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="w-full py-16">
          <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
            <div className="flex flex-col items-center text-center max-w-xl mx-auto mb-10">
              <h2 className="text-headline-lg text-on-surface tracking-tight mb-2">Frequently Answered Questions</h2>
              <p className="text-body-sm text-on-surface-variant">Short answers about billing, payments and changing plan.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {QUESTIONS.map((q) => (
                <div key={q.question} className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-start">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", q.tone)}>
                    <Ico name={q.icon} size={22} />
                  </div>
                  <h3 className="text-headline-sm text-on-surface mb-2">{q.question}</h3>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">{q.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
