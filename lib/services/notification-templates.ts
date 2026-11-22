import { escapeHtml } from "@/lib/services/email-templates";
import type { EventKind } from "@/server/event-types";

export type Audience = "client" | "studio";

/** Subject lead-in per event kind. null means no notification is sent for that kind. */
const SUBJECT: Record<EventKind, string | null> = {
  proposal_drafted: null,
  proposal_sent: "A proposal is ready to review",
  proposal_signed: "A client signed the proposal",
  invitation_sent: null,
  invitation_accepted: "A client accepted the invitation",
  payment_started: null,
  payment_settled: "Payment received",
  milestone_delivered: "A milestone is ready for review",
  milestone_approved: "A milestone was approved",
  changes_requested: "Changes were requested",
  changes_responded: "The studio replied to your change request",
  project_completed: "The project is complete",
  file_added: "A deliverable was added",
  file_removed: null,
};

export type NotificationContext = {
  projectTitle: string;
  summary: string;
  link: string;
  audience: Audience;
};

/**
 * Email for one event. The summary is already free of payment details and message text, so the
 * body can carry it as it is. Returns null for kinds that never notify.
 */
export function notificationFor(
  kind: EventKind,
  ctx: NotificationContext,
): { subject: string; text: string; html: string } | null {
  const lead = SUBJECT[kind];
  if (!lead) return null;
  const subject = `${lead}: ${ctx.projectTitle}`;
  const footer = "You are receiving this because you are on this project. Full details are in the project's activity log.";
  return {
    subject,
    text: `${ctx.summary}.\n\nOpen the project: ${ctx.link}\n\n${footer}`,
    html: `<!doctype html><html lang="en"><body style="margin:0;background:#f7f6f2;font-family:Inter,Arial,sans-serif;color:#13181f"><div style="max-width:520px;margin:0 auto;padding:32px 24px"><p style="font-size:12px;color:#5b6370;margin:0 0 8px">Cadence</p><h1 style="font-size:20px;font-weight:600;margin:0 0 12px">${escapeHtml(lead)}</h1><p style="font-size:16px;line-height:24px;margin:0 0 8px">${escapeHtml(ctx.projectTitle)}</p><p style="font-size:16px;line-height:24px;margin:0 0 24px">${escapeHtml(ctx.summary)}.</p><a href="${escapeHtml(ctx.link)}" style="display:inline-block;background:#0e5a4f;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 20px;font-weight:500">Open the project</a><p style="font-size:14px;line-height:20px;color:#5b6370;margin:24px 0 0">${escapeHtml(footer)}</p></div></body></html>`,
  };
}
