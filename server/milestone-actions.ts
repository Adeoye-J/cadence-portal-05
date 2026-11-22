"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/lib/session";
import { approveSchema, changeRequestSchema, replySchema } from "@/lib/validation/milestones";
import { approveMilestone, deliverMilestone, replyToChangeRequest, requestChanges } from "@/server/milestones";

export type ReviewFormState = { status: "idle" } | { status: "error"; message: string };

const SESSION_ENDED = "Your session has ended. Sign in again to continue.";

/** Client: approves a delivered milestone, then returns to the project. */
export async function approveMilestoneAction(_previous: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: SESSION_ENDED };

  const parsed = approveSchema.safeParse({
    projectId: formData.get("projectId"),
    position: formData.get("position"),
    agreed: formData.get("agreed") ?? undefined,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form." };

  const result = await approveMilestone(viewer.userId, parsed.data.projectId, parsed.data.position);
  if (!result.ok) return { status: "error", message: result.message };
  redirect(`/projects/${parsed.data.projectId}`);
}

/** Client: sends a change request for a delivered milestone, then reloads the milestone page. */
export async function requestChangesAction(_previous: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: SESSION_ENDED };

  const parsed = changeRequestSchema.safeParse({
    projectId: formData.get("projectId"),
    position: formData.get("position"),
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) {
    const { fieldErrors, formErrors } = z.flattenError(parsed.error);
    return { status: "error", message: fieldErrors.body?.[0] ?? formErrors[0] ?? "Check the form." };
  }

  const result = await requestChanges(viewer.userId, parsed.data.projectId, parsed.data.position, parsed.data.body);
  if (!result.ok) return { status: "error", message: result.message };
  redirect(`/projects/${parsed.data.projectId}/milestones/${parsed.data.position}`);
}

/** Studio: marks a milestone delivered. The caller refreshes the page on success. */
export async function deliverMilestoneAction(projectId: string, position: number): Promise<{ ok: true } | { ok: false; message: string }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SESSION_ENDED };
  return deliverMilestone(viewer.userId, projectId, position);
}

export type ReplyFormState = { status: "idle" } | { status: "sent" } | { status: "error"; message: string };

/** Studio: replies to a client's change request. Refreshes the studio and client views on success. */
export async function replyToChangeRequestAction(_previous: ReplyFormState, formData: FormData): Promise<ReplyFormState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: SESSION_ENDED };

  const parsed = replySchema.safeParse({
    projectId: formData.get("projectId"),
    changeRequestId: formData.get("changeRequestId"),
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the reply." };

  const result = await replyToChangeRequest(viewer.userId, parsed.data.projectId, parsed.data.changeRequestId, parsed.data.body);
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath(`/studio/projects/${parsed.data.projectId}`);
  revalidatePath(`/projects/${parsed.data.projectId}`, "layout");
  return { status: "sent" };
}
