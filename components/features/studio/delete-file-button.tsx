"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteFileAction } from "@/server/file-actions";

/**
 * Removes a deliverable. The first press asks for confirmation, and the second press removes it.
 * Keeping the choice inside the control avoids a modal, and the confirmation text stays in place for screen readers.
 */
export function DeleteFileButton({ projectId, fileId, filename }: { projectId: string; fileId: string; filename: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="flex flex-col items-end gap-1">
      {armed ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            loading={pending}
            onClick={() => {
              setError(undefined);
              startTransition(async () => {
                const result = await deleteFileAction(projectId, fileId);
                if (result.ok) router.refresh();
                else setError(result.message);
              });
            }}
          >
            Remove {filename}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setArmed(false)}>
            Keep it
          </Button>
        </div>
      ) : (
        <Button type="button" variant="destructive" size="sm" onClick={() => setArmed(true)} aria-label={`Remove ${filename}`}>
          Remove
        </Button>
      )}
      {error ? <p role="alert" className="text-label-md text-danger">{error}</p> : null}
    </div>
  );
}
