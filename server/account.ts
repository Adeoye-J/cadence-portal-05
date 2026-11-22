import { getStore } from "@/server/store/registry";

/**
 * Account deletion requests. Recorded, then processed by a person: deleting an account touches signed records that
 * may need to be kept, so it is not automatic. Asking again returns the first request's time.
 */
export async function requestAccountDeletion(
  userId: string,
  now: Date = new Date(),
): Promise<{ requestedAt: string; alreadyRequested: boolean }> {
  return getStore().requestDeletion(userId, now.toISOString());
}

/** When the user asked to delete their account, or null if they have not. */
export async function accountDeletionStatus(userId: string): Promise<string | null> {
  return getStore().getDeletionRequest(userId);
}
