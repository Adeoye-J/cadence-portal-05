import type { EventAudience, ProjectEvent } from "@/server/event-types";
import { getStore } from "@/server/store/registry";

/**
 * The project's activity log, newest first. Events are written by the store commands that cause them, in the same
 * transaction, so an event never exists without its change. See server/effects.ts.
 */
export async function listEvents(projectId: string, audience: EventAudience): Promise<ProjectEvent[]> {
  return getStore().listEvents(projectId, audience);
}
