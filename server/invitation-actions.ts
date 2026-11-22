"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { getEmailSender } from "@/lib/services/email";
import { invitationEmail } from "@/lib/services/email-templates";
import { getViewer } from "@/lib/session";
import { inviteSchema } from "@/lib/validation/invite";
import { acceptInvitation, inviteClient, revokeInvitation } from "@/server/invitations";

export type InviteFormState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

/** Studio: invites a client by email. The email is sent before the invitation is kept. */
export async function inviteClientAction(_previous: InviteFormState, formData: FormData): Promise<InviteFormState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "Your session has ended. Sign in again to continue." };

  const parsed = inviteSchema.safeParse({ projectId: formData.get("projectId"), email: formData.get("email") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the email address." };

  const result = await inviteClient(viewer.userId, parsed.data.projectId, parsed.data.email);
  if (!result.ok) return { status: "error", message: result.message };

  const url = `${env.APP_URL}/invite/${result.token}`;
  const message = invitationEmail({ url, projectTitle: result.projectTitle, studioName: result.studioName });
  try {
    await getEmailSender().send({ to: result.email, ...message });
  } catch {
    await revokeInvitation(result.invitationId);
    return { status: "error", message: "We could not send the invitation. Try again in a moment." };
  }
  return { status: "sent", email: result.email };
}

export type AcceptState = { status: "idle" } | { status: "error"; message: string };

/** Client: accepts an invitation. On success the viewer is a project contact and the page goes to projects. */
export async function acceptInvitationAction(_previous: AcceptState, formData: FormData): Promise<AcceptState> {
  const viewer = await getViewer();
  const token = z.string().min(20).max(200).safeParse(formData.get("token"));
  if (!viewer) return { status: "error", message: "Sign in with the invited address to continue." };
  if (!token.success) return { status: "error", message: "This invitation is no longer valid." };

  const result = await acceptInvitation(token.data, viewer);
  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "email_mismatch"
          ? "This invitation was sent to a different email address. Sign in with that address to continue."
          : "This invitation is no longer valid.",
    };
  }
  redirect("/projects");
}
