import Link from "next/link";
import { StatusChip } from "@/components/ui/status-chip";
import { isPaid } from "@/lib/milestones";
import { formatDate, formatMoney } from "@/lib/format";
import type { Currency, MilestoneStatus } from "@/db/schema";

export type MilestoneCardData = {
  position: number;
  title: string;
  amountMinor: number;
  status: MilestoneStatus;
  dueDate?: string;
};

/**
 * One milestone in the roadmap. Status text and icon come from the status
 * value, never from colour alone. This card is read-only: actions live in the
 * action panel, and no button is shown until its route exists.
 */
export function MilestoneCard({
  milestone,
  currency,
  projectId,
}: {
  milestone: MilestoneCardData;
  currency: Currency;
  projectId: string;
}) {
  const amount = formatMoney(milestone.amountMinor, currency);
  return (
    <li className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="tnum text-label-md text-ink-muted">Milestone {milestone.position}</p>
          <h3 className="text-headline-sm text-ink">{milestone.title}</h3>
        </div>
        <p className="tnum text-headline-sm text-ink">{amount}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-body-sm text-ink-muted">
        <MilestoneStateChip status={milestone.status} />
        {milestone.dueDate ? (
          <span className="tnum">
            {isPaid(milestone.status) ? "Settled" : "Due"} {formatDate(milestone.dueDate)}
          </span>
        ) : null}
      </div>
      <Link
        href={`/projects/${projectId}/milestones/${milestone.position}`}
        className="inline-flex min-h-11 w-fit items-center text-body-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        View milestone
      </Link>
    </li>
  );
}

function MilestoneStateChip({ status }: { status: MilestoneStatus }) {
  switch (status) {
    case "approved":
      return <StatusChip tone="done" label="Paid and approved" />;
    case "payment_due":
      return <StatusChip tone="waiting" label="Payment due" />;
    case "in_progress":
      return <StatusChip tone="neutral" label="In progress" />;
    case "delivered":
      return <StatusChip tone="waiting" label="Awaiting your review" />;
    case "upcoming":
      return <StatusChip tone="neutral" label="Upcoming" />;
  }
}
