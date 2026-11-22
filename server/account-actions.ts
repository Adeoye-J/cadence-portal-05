"use server";

import { z } from "zod";
import { getViewer } from "@/lib/session";
import { requestAccountDeletion } from "@/server/account";

export type DeletionState = { status: "idle" } | { status: "requested"; requestedAt: string } | { status: "error"; message: string };

/** Records a request to delete the account. A person handles it; nothing is deleted here. */
export async function requestAccountDeletionAction(_previous: DeletionState, formData: FormData): Promise<DeletionState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "Your session has ended. Sign in again to continue." };
  const confirmed = z.literal("on").safeParse(formData.get("understand"));
  if (!confirmed.success) return { status: "error", message: "Tick the box to confirm you understand what deletion means." };
  const result = await requestAccountDeletion(viewer.userId);
  return { status: "requested", requestedAt: result.requestedAt };
}
