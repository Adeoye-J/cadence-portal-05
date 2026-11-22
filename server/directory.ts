import { getStore } from "@/server/store/registry";

/** Email lookups and notification recipients. Read from the store, so they work against the database. */
export async function emailFor(userId: string): Promise<string | undefined> {
  return (await getStore().getEmails([userId]))[userId];
}

/** Owners and admins of a studio are told about things that need the studio's attention. */
export async function studioNotifiees(studioId: string): Promise<string[]> {
  const members = await getStore().listMembers(studioId);
  return members.filter((m) => m.role === "owner" || m.role === "admin").map((m) => m.userId);
}
