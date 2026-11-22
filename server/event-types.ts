/** The activity log's vocabulary. Plain types and data, so the store, the notification planner and the tests share it. */

export type EventKind =
  | "proposal_drafted"
  | "proposal_sent"
  | "proposal_signed"
  | "invitation_sent"
  | "invitation_accepted"
  | "payment_started"
  | "payment_settled"
  | "milestone_delivered"
  | "milestone_approved"
  | "changes_requested"
  | "changes_responded"
  | "file_added"
  | "file_removed"
  | "project_completed";

export type EventActor = "studio" | "client" | "system";
export type EventAudience = "client" | "studio";

/** Whether the client sees an event on their own timeline. Studio-internal events stay off it. */
export const CLIENT_VISIBLE: Record<EventKind, boolean> = {
  proposal_drafted: false,
  proposal_sent: true,
  proposal_signed: true,
  invitation_sent: false,
  invitation_accepted: true,
  payment_started: false,
  payment_settled: true,
  milestone_delivered: true,
  milestone_approved: true,
  changes_requested: true,
  changes_responded: true,
  file_added: true,
  file_removed: false,
  project_completed: true,
};

/** An event before it is stored. The id is made by the caller so notifications can refer to it. */
export type NewEvent = {
  id: string;
  projectId: string;
  kind: EventKind;
  actor: EventActor;
  summary: string;
  at: string;
  clientVisible: boolean;
};

/** A stored event. The sequence number is given by the store and gives the order. */
export type ProjectEvent = NewEvent & { seq: number };
