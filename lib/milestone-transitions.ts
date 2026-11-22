import type { MilestoneStatus } from "@/db/schema";

/**
 * Milestone state machine. The only legal moves are listed here, and every write goes through
 * nextStatus(). Anything else is refused, so a stale page cannot skip a step.
 *
 *   upcoming -> payment_due   (previous milestone approved)
 *   payment_due -> in_progress (payment settled, see server/payments.ts)
 *   in_progress -> delivered  (studio marks delivered)
 *   delivered -> approved     (client approves)
 *   delivered -> in_progress  (client requests changes)
 */
export type MilestoneEvent = "deliver" | "approve" | "request_changes";

const TRANSITIONS: Record<MilestoneEvent, { from: MilestoneStatus; to: MilestoneStatus }> = {
  deliver: { from: "in_progress", to: "delivered" },
  approve: { from: "delivered", to: "approved" },
  request_changes: { from: "delivered", to: "in_progress" },
};

/** The status after an event, or null when the event is not allowed from the current status. */
export function nextStatus(current: MilestoneStatus, event: MilestoneEvent): MilestoneStatus | null {
  const rule = TRANSITIONS[event];
  return current === rule.from ? rule.to : null;
}
