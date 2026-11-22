"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type ChangeEvent } from "react";
import { completeUploadAction, requestUploadAction } from "@/server/file-actions";

/**
 * Uploads one deliverable to a milestone. The browser sends the bytes straight to object storage,
 * and the server then confirms them. Each step reports its own failure in plain words.
 */
export function FileUpload({ projectId, position }: { projectId: string; position: number }) {
  const router = useRouter();
  const inputId = useId();
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState<string | undefined>();

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setStatus("working");
    setMessage("Preparing upload…");
    const intent = await requestUploadAction(projectId, position, file.name, file.type, file.size);
    if (!intent.ok) return fail(intent.message);

    setMessage("Uploading…");
    let put: Response;
    try {
      put = await fetch(intent.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    } catch {
      return fail("The upload could not reach storage. Check your connection and try again.");
    }
    if (!put.ok) return fail("The upload was refused by storage. Try again.");

    setMessage("Checking the file…");
    const done = await completeUploadAction(projectId, intent.fileId);
    if (!done.ok) return fail(done.message);

    setStatus("idle");
    setMessage(`${file.name} added.`);
    router.refresh();
  }

  function fail(text: string) {
    setStatus("error");
    setMessage(text);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="inline-flex min-h-11 w-fit cursor-pointer items-center rounded-control border border-border bg-surface px-4 text-body-sm font-medium text-ink hover:border-ink">
        Add deliverable
      </label>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,image/png,image/jpeg,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="sr-only"
        onChange={onChange}
        disabled={status === "working"}
      />
      {message ? (
        <p role={status === "error" ? "alert" : "status"} className={status === "error" ? "text-label-md text-danger" : "text-label-md text-ink-muted"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
