"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDateTimeUtc } from "@/lib/format";
import { requestAccountDeletionAction, type DeletionState } from "@/server/account-actions";

const initial: DeletionState = { status: "idle" };

/** Asks for account deletion. Recorded, then handled by a person. Confirmation is a required checkbox. */
export function DeletionRequestForm({ alreadyRequestedAt }: { alreadyRequestedAt: string | null }) {
  const [state, action, pending] = useActionState(requestAccountDeletionAction, initial);
  const [ticked, setTicked] = useState(false);
  const requestedAt = state.status === "requested" ? state.requestedAt : alreadyRequestedAt;

  if (requestedAt) {
    return (
      <p role="status" className="text-body-sm text-ink">
        Deletion requested on {formatDateTimeUtc(requestedAt)}. It is being handled. Nothing has been deleted yet.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-body-sm text-ink">
        <input
          type="checkbox"
          name="understand"
          checked={ticked}
          onChange={(e) => setTicked(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-primary"
        />
        <span>I understand that deleting my account removes my access to every project, and that this cannot be undone once it is processed.</span>
      </label>
      {state.status === "error" ? (
        <p role="alert" className="text-body-sm text-danger">{state.message}</p>
      ) : null}
      <Button type="submit" variant="destructive" loading={pending} className="w-fit px-0">
        Request account deletion
      </Button>
    </form>
  );
}
