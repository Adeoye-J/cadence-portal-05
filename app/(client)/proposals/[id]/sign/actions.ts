"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/lib/session";
import { signProposalSchema } from "@/lib/validation/sign";
import { signProposal } from "@/server/proposals";

export type SignState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: { typedName?: string; agreed?: string } };

/**
 * Server Action for sign-off. Validates with the shared schema, checks the
 * session and project access, then records the signature. Field errors come
 * back in the state so the form keeps what the user typed.
 */
export async function signProposalAction(_previous: SignState, formData: FormData): Promise<SignState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "Your session has ended. Sign in again to continue." };

  const parsed = signProposalSchema.safeParse({
    proposalId: formData.get("proposalId"),
    typedName: formData.get("typedName") ?? "",
    agreed: formData.get("agreed") ?? undefined,
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: {
        typedName: fieldErrors.typedName?.[0],
        agreed: fieldErrors.agreed?.[0],
      },
    };
  }

  const result = await signProposal(viewer.userId, parsed.data.proposalId, parsed.data.typedName);
  if (!result.ok) return { status: "error", message: result.message };

  redirect(`/proposals/${parsed.data.proposalId}/signed`);
}
