import { getStore } from "@/server/store/registry";
import { notificationFor, type Audience } from "@/lib/services/notification-templates";
import type { EventKind, NewEvent } from "@/server/event-types";
import type { OutboxInput } from "@/server/outbox";
import { studioNotifiees } from "@/server/directory";

/**
 * Notification rules. Turns one event into outbox messages, one per recipient. No environment access,
 * so the rules can be tested without a database or an email provider.
 */

/** Who hears about each event kind. Kinds not listed here queue nothing. */
const PLAN: Partial<Record<EventKind, Audience[]>> = {
  proposal_sent: ["client"],
  proposal_signed: ["studio"],
  invitation_accepted: ["studio"],
  payment_settled: ["client", "studio"],
  milestone_delivered: ["client"],
  milestone_approved: ["studio"],
  changes_requested: ["studio"],
  changes_responded: ["client"],
  project_completed: ["client", "studio"],
  file_added: ["client"],
};

export async function recipientsFor(projectId: string, audiences: Audience[]): Promise<{ audience: Audience; email: string }[]> {
  const store = getStore();
  const project = await store.getProject(projectId);
  if (!project) return [];
  const wanted = new Map<Audience, string[]>();
  for (const audience of audiences) {
    wanted.set(audience, audience === "client" ? project.contactUserIds : await studioNotifiees(project.studioId));
  }
  const emails = await store.getEmails([...new Set([...wanted.values()].flat())]);
  const seen = new Set<string>();
  const out: { audience: Audience; email: string }[] = [];
  for (const audience of audiences) {
    for (const userId of wanted.get(audience) ?? []) {
      const email = emails[userId];
      if (!email || seen.has(email)) continue;
      seen.add(email);
      out.push({ audience, email });
    }
  }
  return out;
}

export async function planNotifications(event: NewEvent, appUrl: string): Promise<OutboxInput[]> {
  const audiences = PLAN[event.kind];
  const project = await getStore().getProject(event.projectId);
  if (!audiences || !project) return [];

  const messages: OutboxInput[] = [];
  for (const recipient of await recipientsFor(event.projectId, audiences)) {
    const link =
      recipient.audience === "client"
        ? `${appUrl}/projects/${project.id}`
        : `${appUrl}/studio/projects/${project.id}`;
    const message = notificationFor(event.kind, {
      projectTitle: project.title,
      summary: event.summary,
      link,
      audience: recipient.audience,
    });
    if (!message) continue;
    messages.push({
      dedupeKey: `${event.id}:${recipient.email}`,
      to: recipient.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
  return messages;
}
