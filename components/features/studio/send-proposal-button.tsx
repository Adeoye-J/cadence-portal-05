"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendProposalAction } from "@/server/studio-actions";

/** Sends the draft to the client, then refreshes the page to show the sent state. */
export function SendProposalButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function onClick() {
    setError(undefined);
    startTransition(async () => {
      const result = await sendProposalAction(projectId);
      if (result.ok) {
        router.refresh();
        return;
      }
      setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={onClick} loading={pending} className="w-fit">
        Send to client
      </Button>
      {error ? (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
