import { getStore } from "@/server/store/registry";
import type { PendingSignupRecord } from "@/server/store/types";

/**
 * Sign-up details wait between the sign-up form and the first sign-in, then become a studio. Entries expire after
 * 30 minutes and are removed when used.
 *
 */

const TTL_MS = 30 * 60 * 1000;

export type PendingSignup = PendingSignupRecord;

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function recordPendingSignup(
  input: Omit<PendingSignup, "email" | "createdAt">,
  email: string,
  now: Date = new Date(),
): Promise<void> {
  await getStore().putPendingSignup({ ...input, email: normaliseEmail(email), createdAt: now.toISOString() });
}

function fresh(entry: PendingSignup, now: Date): boolean {
  return now.getTime() - new Date(entry.createdAt).getTime() < TTL_MS;
}

/** True when a fresh sign-up is waiting for this email. Does not consume it. */
export async function hasPendingSignup(email: string, now: Date = new Date()): Promise<PendingSignup | null> {
  const entry = await getStore().getPendingSignup(normaliseEmail(email));
  return entry && fresh(entry, now) ? entry : null;
}

/** Takes the pending sign-up for an email, removing it. Null when none is waiting or it has expired. */
export async function takePendingSignup(email: string, now: Date = new Date()): Promise<PendingSignup | null> {
  const entry = await getStore().takePendingSignup(normaliseEmail(email));
  return entry && fresh(entry, now) ? entry : null;
}

/** Creates the studio and makes the signed-in user its owner. Returns the new studio's id. */
export async function createStudioFor(userId: string, studioName: string): Promise<{ studioId: string; name: string }> {
  const { studioId } = await getStore().createStudioWithOwner(userId, studioName);
  return { studioId, name: studioName };
}
