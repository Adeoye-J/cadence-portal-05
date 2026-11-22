"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { createProposalSchema } from "@/lib/validation/proposal";
import { projectAllowanceForUser } from "@/server/billing-runtime";
import { createDraftProposal, sendProposal } from "@/server/studio-writes";

export type ProposalFormState = { status: "idle" } | { status: "error"; messages: string[] };

/**
 * Server Action: creates a draft proposal. The form sends one JSON payload, which is validated
 * with the shared schema. Success redirects to the project. Failures come back as a list of messages.
 */
export async function createProposalAction(_previous: ProposalFormState, formData: FormData): Promise<ProposalFormState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", messages: ["Your session has ended. Sign in again to continue."] };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { status: "error", messages: ["Something went wrong. Reload the page and try again."] };
  }

  const parsed = createProposalSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", messages: [...new Set(parsed.error.issues.map((i) => i.message))] };
  }

  const allowance = await projectAllowanceForUser(viewer.userId);
  if (!allowance.ok) return { status: "error", messages: [allowance.message] };

  const result = await createDraftProposal(viewer.userId, parsed.data);
  if (!result.ok) return { status: "error", messages: [result.message] };
  redirect(`/studio/projects/${result.projectId}`);
}

/** Server Action: sends a project's draft proposal to its client. */
export async function sendProposalAction(projectId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Your session has ended. Sign in again to continue." };
  return sendProposal(viewer.userId, projectId);
}
