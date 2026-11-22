"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { signProposalAction, type SignState } from "./actions";

const initialState: SignState = { status: "idle" };

/**
 * Sign-off form. Server-side validation runs through the Server Action, and the
 * state holds field errors. Controlled inputs keep the user's entries after an error.
 */
export function SignForm({ proposalId }: { proposalId: string }) {
  const [state, formAction, pending] = useActionState(signProposalAction, initialState);
  const [typedName, setTypedName] = useState("");
  const [agreed, setAgreed] = useState(false);

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const nameError = errors?.typedName;
  const agreeError = errors?.agreed;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="proposalId" value={proposalId} />

      {state.status === "error" ? (
        <p role="alert" className="rounded-control border border-danger-border bg-danger-subtle p-3 text-body-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="typedName" className="text-body-sm font-medium text-ink">
          Type your full name
        </label>
        <input
          id="typedName"
          name="typedName"
          autoComplete="name"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "typedName-error" : "typedName-help"}
          className="h-11 rounded-control border border-border bg-surface px-3.5 text-body-sm text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 aria-[invalid=true]:border-danger"
        />
        <p id="typedName-help" className="text-label-md text-ink-muted">
          This name is recorded with the time you sign.
        </p>
        {nameError ? (
          <p id="typedName-error" className="text-body-sm text-danger">
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-body-sm text-ink">
          <input
            type="checkbox"
            name="agreed"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            aria-invalid={agreeError ? true : undefined}
            aria-describedby={agreeError ? "agreed-error" : undefined}
            className="mt-0.5 size-5 shrink-0 accent-primary"
          />
          <span>I have read the scope, the payment schedule and the revision terms, and I agree to them.</span>
        </label>
        {agreeError ? (
          <p id="agreed-error" className="text-body-sm text-danger">
            {agreeError}
          </p>
        ) : null}
      </div>

      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        Sign proposal
      </Button>
    </form>
  );
}
