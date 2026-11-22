"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvitationAction, type AcceptState } from "@/server/invitation-actions";

const initial: AcceptState = { status: "idle" };

/** Accept is a button, not a link, so a link preview or prefetch cannot accept an invitation. */
export function AcceptForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInvitationAction, initial);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      {state.status === "error" ? (
        <p role="alert" className="rounded-control border border-danger-border bg-danger-subtle p-3 text-body-sm text-danger">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        Open proposal
      </Button>
    </form>
  );
}
