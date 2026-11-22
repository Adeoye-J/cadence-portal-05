"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { replyToChangeRequestAction, type ReplyFormState } from "@/server/milestone-actions";

const initial: ReplyFormState = { status: "idle" };

/** One change request with its reply. Shows the reply form only when the studio can write and no reply exists. */
export function ChangeRequestReply({
  projectId,
  changeRequestId,
  body,
  createdAt,
  reply,
  writable,
}: {
  projectId: string;
  changeRequestId: string;
  body: string;
  createdAt: string;
  reply?: { body: string; repliedAt: string };
  writable: boolean;
}) {
  const [state, formAction, pending] = useActionState(replyToChangeRequestAction, initial);
  return (
    <li className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <p className="tnum text-label-md text-ink-muted">Client request · {createdAt}</p>
      <p className="text-body-sm text-ink">{body}</p>
      {reply ? (
        <div className="flex flex-col gap-1 border-l-2 border-primary pl-3">
          <p className="tnum text-label-md text-ink-muted">Studio reply · {reply.repliedAt}</p>
          <p className="text-body-sm text-ink">{reply.body}</p>
        </div>
      ) : writable ? (
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="changeRequestId" value={changeRequestId} />
          <label htmlFor={`reply-${changeRequestId}`} className="text-body-sm font-medium text-ink">Reply to the client</label>
          <textarea id={`reply-${changeRequestId}`} name="body" rows={3} className="w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-body-sm text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15" />
          {state.status === "error" ? <p role="alert" className="text-body-sm text-danger">{state.message}</p> : null}
          <div>
            <Button type="submit" variant="secondary" size="sm" loading={pending}>Send reply</Button>
          </div>
        </form>
      ) : (
        <p className="text-label-md text-ink-muted">Awaiting a reply from the studio.</p>
      )}
    </li>
  );
}
