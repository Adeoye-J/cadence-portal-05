import { randomUUID } from "node:crypto";
import type { Effects } from "@/server/core/types";
import { CLIENT_VISIBLE, type EventActor, type EventKind, type NewEvent } from "@/server/event-types";
import { planNotifications } from "@/server/notify-core";

/**
 * Builds what a change leaves behind: its activity events and the notification emails those events cause. A store
 * command writes them in the same transaction as the change, so there is no window where the change exists without its
 * event, or an email is queued for a change that did not happen.
 */

const URL_KEY = Symbol.for("cadence.effects.appUrl");
type Holder = { [URL_KEY]?: string };

/** Set once at start-up (instrumentation.ts) so the links in emails point at the real site. Kept on globalThis, like the store. */
export function setEffectsAppUrl(url: string): void {
  (globalThis as Holder)[URL_KEY] = url;
}

function appUrl(): string {
  return (globalThis as Holder)[URL_KEY] ?? "http://localhost:3000";
}

export type EventDraft = { projectId: string; kind: EventKind; actor: EventActor; summary: string };

export function eventFrom(draft: EventDraft): NewEvent {
  return { ...draft, id: randomUUID(), at: new Date().toISOString(), clientVisible: CLIENT_VISIBLE[draft.kind] };
}

/** Plans the events and their notifications. Nothing is written until a store command receives the result. */
export async function buildEffects(...drafts: EventDraft[]): Promise<Effects> {
  const events = drafts.map(eventFrom);
  const outbox = [];
  for (const event of events) outbox.push(...(await planNotifications(event, appUrl())));
  return { events, outbox };
}
