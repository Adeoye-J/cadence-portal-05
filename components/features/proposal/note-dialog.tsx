"use client";

import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { addProposalNoteAction, type NoteResult } from "@/server/proposal-note-actions";

type Props = {
  /** Visible text of the button. Kept for the design source; the children are what show. */
  label?: string;
  kind: "general" | "section" | "change";
  proposalId: string;
  projectId: string;
  sectionRef?: string;
  viewerName: string;
  className?: string;
  children: ReactNode;
};

/**
 * The button that opens the note dialog. Used for "Add General Note", "Request changes" and the section comments.
 * Notes are saved through the server and the studio is told through the activity log.
 */
export function NoteButton({ kind, proposalId, sectionRef, viewerName, className, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldId = useId();
  const [body, setBody] = useState("");
  const [result, setResult] = useState<NoteResult | null>(null);
  const [pending, startTransition] = useTransition();

  const title = kind === "change" ? "Request changes" : "Section note";

  function open() {
    setResult(null);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function save() {
    startTransition(async () => {
      const r = await addProposalNoteAction({ proposalId, kind, sectionRef, body });
      setResult(r);
      if (r.ok) setBody("");
    });
  }

  return (
    <>
      <button type="button" className={className} onClick={open}>
        {children}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`${fieldId}-title`}
        className="w-[min(560px,calc(100vw-2rem))] rounded-xl bg-surface-container-lowest p-0 text-on-surface shadow-xl backdrop:bg-overlay"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id={`${fieldId}-title`} className="text-headline-md">{title}</h2>
            {sectionRef ? <span className="rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">{sectionRef}</span> : null}
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Author: {viewerName}. Your studio sees this note on the project. It is not an attachment.
          </p>
          <label htmlFor={fieldId} className="text-body-sm-medium text-on-surface">Your note</label>
          <textarea
            id={fieldId}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={2000}
            className="rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {result && !result.ok ? <p role="alert" className="text-body-sm text-danger">{result.error}</p> : null}
          {result?.ok ? <p role="status" className="text-body-sm text-done">Saved. Your studio has been told.</p> : null}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={close} className="rounded-lg bg-surface-container px-4 py-2.5 text-body-sm-medium text-on-surface hover:bg-surface-container-high">
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending || body.trim().length < 3}
              className="rounded-lg bg-primary px-4 py-2.5 text-body-sm-medium text-on-primary shadow-sm hover:bg-primary-container disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save note"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
