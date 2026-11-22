"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { downloadLinkAction } from "@/server/file-actions";

/** Asks for a short-lived link, then sends the browser to it. The link forces a download. */
export function DownloadButton({ projectId, fileId, filename }: { projectId: string; fileId: string; filename: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={pending}
        aria-label={`Download ${filename}`}
        onClick={() => {
          setError(undefined);
          startTransition(async () => {
            const result = await downloadLinkAction(projectId, fileId);
            if (result.ok) window.location.assign(result.url);
            else setError(result.message);
          });
        }}
      >
        Download
      </Button>
      {error ? <p role="alert" className="text-label-md text-danger">{error}</p> : null}
    </div>
  );
}
