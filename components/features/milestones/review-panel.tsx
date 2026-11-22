"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { approveMilestoneAction, requestChangesAction, type ReviewFormState } from "@/server/milestone-actions";

const initial: ReviewFormState = { status: "idle" };
const TEXTAREA = "w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-body-sm text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15";

function Alert({ state }: { state: ReviewFormState }) {
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="rounded-control border border-danger-border bg-danger-subtle p-3 text-body-sm text-danger">
      {state.message}
    </p>
  );
}

/** Two forms side by side: approve (with a confirmation box) and request changes (with a required note). */
export function ReviewPanel({ projectId, position }: { projectId: string; position: number }) {
  const [approveState, approveAction, approving] = useActionState(approveMilestoneAction, initial);
  const [changeState, changeAction, requesting] = useActionState(requestChangesAction, initial);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={approveAction} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="position" value={position} />
        <h2 className="text-headline-sm text-ink">Approve this milestone</h2>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-body-sm text-ink">
          <input
            type="checkbox"
            name="agreed"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-primary"
          />
          <span>I have reviewed this deliverable and approve it. Approval starts the next milestone&apos;s payment.</span>
        </label>
        <Alert state={approveState} />
        <Button type="submit" loading={approving} className="w-full sm:w-auto">
          Approve milestone
        </Button>
      </form>

      <form action={changeAction} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="position" value={position} />
        <h2 className="text-headline-sm text-ink">Request changes</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="change-body" className="text-body-sm font-medium text-ink">What should change?</label>
          <textarea id="change-body" name="body" rows={4} className={cn(TEXTAREA)} aria-describedby="change-help" />
          <p id="change-help" className="text-label-md text-ink-muted">At least 10 characters. The studio sees this note.</p>
        </div>
        <Alert state={changeState} />
        <Button type="submit" variant="secondary" loading={requesting} className="w-full sm:w-auto">
          Send change request
        </Button>
      </form>
    </div>
  );
}
