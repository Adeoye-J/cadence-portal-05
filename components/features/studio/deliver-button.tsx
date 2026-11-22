"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deliverMilestoneAction } from "@/server/milestone-actions";

/** Marks one in-progress milestone delivered, then refreshes so the client sees it. */
export function DeliverMilestoneButton({ projectId, position }: { projectId: string; position: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={() => {
          setError(undefined);
          startTransition(async () => {
            const result = await deliverMilestoneAction(projectId, position);
            if (result.ok) router.refresh();
            else setError(result.message);
          });
        }}
      >
        Mark delivered
      </Button>
      {error ? <p role="alert" className="text-label-md text-danger">{error}</p> : null}
    </div>
  );
}
