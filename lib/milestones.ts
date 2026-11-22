import type { MilestoneStatus, ProjectStage } from "@/db/schema";

/** A milestone whose status means its payment has settled and work has started or finished. */
const PAID_STATUSES: ReadonlySet<MilestoneStatus> = new Set(["in_progress", "delivered", "approved"]);

/** Order of the six stages on the progress stepper. */
const STAGE_ORDER: readonly ProjectStage[] = [
  "proposal",
  "signed",
  "in_progress",
  "review",
  "completed",
  "closed",
];

export function stageIndex(stage: ProjectStage): number {
  const i = STAGE_ORDER.indexOf(stage);
  if (i === -1) throw new RangeError(`Unknown project stage "${stage}"`);
  return i;
}

export function stageLabel(stage: ProjectStage): string {
  const labels: Record<ProjectStage, string> = {
    proposal: "Proposal",
    signed: "Signed",
    in_progress: "In progress",
    review: "Review",
    completed: "Completed",
    closed: "Closed",
  };
  return labels[stage];
}

export function isPaid(status: MilestoneStatus): boolean {
  return PAID_STATUSES.has(status);
}

/** Sums paid and remaining amounts for a retainer. Pure, so it can be unit tested. */
export function retainerTotals(
  items: ReadonlyArray<{ amountMinor: number; status: MilestoneStatus }>,
): { totalMinor: number; paidMinor: number; remainingMinor: number } {
  let totalMinor = 0;
  let paidMinor = 0;
  for (const item of items) {
    totalMinor += item.amountMinor;
    if (isPaid(item.status)) paidMinor += item.amountMinor;
  }
  return { totalMinor, paidMinor, remainingMinor: totalMinor - paidMinor };
}
