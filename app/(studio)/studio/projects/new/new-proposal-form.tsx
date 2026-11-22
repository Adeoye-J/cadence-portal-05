"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { icons } from "@/lib/icons";
import { MAX_MILESTONES } from "@/lib/validation/proposal";
import { createProposalAction, type ProposalFormState } from "@/server/studio-actions";

type MilestoneDraft = { title: string; description: string; amount: string; dueDate: string };

const blankMilestone: MilestoneDraft = { title: "", description: "", amount: "", dueDate: "" };
const INPUT = "h-11 w-full rounded-control border border-border bg-surface px-3.5 text-body-sm text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15";
const LABEL = "text-body-sm font-medium text-ink";

/**
 * Proposal builder. Milestones are edited in local state and sent as one JSON payload,
 * so the server validates the same shape the form produced. Amounts are typed in major units.
 */
export function NewProposalForm() {
  const [state, formAction, pending] = useActionState<ProposalFormState, FormData>(createProposalAction, { status: "idle" });
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  const [revisionTerms, setRevisionTerms] = useState("Two formal revision cycles per deliverable phase.");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([{ ...blankMilestone }]);

  const payload = JSON.stringify({
    clientName,
    title,
    currency,
    revisionTerms,
    milestones: milestones.map((m) => ({
      title: m.title,
      description: m.description,
      amount: m.amount === "" ? Number.NaN : Number(m.amount),
      dueDate: m.dueDate,
    })),
  });

  function update(index: number, patch: Partial<MilestoneDraft>) {
    setMilestones((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  const AddIcon = icons.add;
  const RemoveIcon = icons.delete;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-8">
      <input type="hidden" name="payload" value={payload} />

      {state.status === "error" ? (
        <div role="alert" className="flex flex-col gap-1 rounded-control border border-danger-border bg-danger-subtle p-3 text-body-sm text-danger">
          {state.messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 text-headline-sm text-ink">Project</legend>
        <div className="flex flex-col gap-2">
          <label htmlFor="clientName" className={LABEL}>Client name</label>
          <input id="clientName" className={INPUT} value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className={LABEL}>Project title</label>
          <input id="title" className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="currency" className={LABEL}>Currency (locked for the project)</label>
          <select id="currency" className={INPUT} value={currency} onChange={(e) => setCurrency(e.target.value as "USD" | "NGN")}>
            <option value="USD">USD ($)</option>
            <option value="NGN">NGN (₦)</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="revisionTerms" className={LABEL}>Revision terms</label>
          <textarea id="revisionTerms" rows={2} className={cn(INPUT, "h-auto py-2.5")} value={revisionTerms} onChange={(e) => setRevisionTerms(e.target.value)} />
        </div>
      </fieldset>

      <section aria-labelledby="milestones-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="milestones-heading" className="text-headline-sm text-ink">Milestones</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={milestones.length >= MAX_MILESTONES}
            onClick={() => setMilestones((list) => [...list, { ...blankMilestone }])}
          >
            <AddIcon size={16} aria-hidden="true" />
            Add milestone
          </Button>
        </div>

        {milestones.map((m, i) => (
          <fieldset key={i} className="grid gap-4 rounded-card border border-border bg-surface p-4 sm:grid-cols-2 sm:p-6">
            <legend className="px-1 text-label-md text-ink-muted">Milestone {i + 1}</legend>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor={`m${i}-title`} className={LABEL}>Title</label>
              <input id={`m${i}-title`} className={INPUT} value={m.title} onChange={(e) => update(i, { title: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor={`m${i}-desc`} className={LABEL}>Description (optional)</label>
              <textarea id={`m${i}-desc`} rows={2} className={cn(INPUT, "h-auto py-2.5")} value={m.description} onChange={(e) => update(i, { description: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`m${i}-amount`} className={LABEL}>Amount</label>
              <input id={`m${i}-amount`} type="number" inputMode="decimal" min="0" step="0.01" className={cn(INPUT, "tnum")} value={m.amount} onChange={(e) => update(i, { amount: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`m${i}-due`} className={LABEL}>Due date (optional)</label>
              <input id={`m${i}-due`} type="date" className={cn(INPUT, "tnum")} value={m.dueDate} onChange={(e) => update(i, { dueDate: e.target.value })} />
            </div>
            {milestones.length > 1 ? (
              <div className="sm:col-span-2">
                <Button type="button" variant="destructive" size="sm" onClick={() => setMilestones((list) => list.filter((_, j) => j !== i))} aria-label={`Remove milestone ${i + 1}`}>
                  <RemoveIcon size={16} aria-hidden="true" />
                  Remove
                </Button>
              </div>
            ) : null}
          </fieldset>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>Save draft</Button>
        <Link href="/studio/projects" className={buttonVariants({ variant: "ghost" })}>Cancel</Link>
      </div>
    </form>
  );
}
