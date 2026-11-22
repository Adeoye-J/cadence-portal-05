"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inviteClientAction, type InviteFormState } from "@/server/invitation-actions";

const initial: InviteFormState = { status: "idle" };

/** Invites a client by email. The address is validated on the server, and the result is announced to assistive technology. */
export function InviteClientForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(inviteClientAction, initial);
  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label htmlFor="invite-email" className="text-body-sm font-medium text-ink">
          Client email
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="off"
          required
          className="h-11 rounded-control border border-border bg-surface px-3.5 text-body-sm text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
        />
      </div>
      <Button type="submit" variant="secondary" loading={pending}>
        Send invitation
      </Button>
      {state.status === "sent" ? (
        <p role="status" className="text-body-sm text-done sm:basis-full">
          Invitation sent to {state.email}.
        </p>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="text-body-sm text-danger sm:basis-full">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
