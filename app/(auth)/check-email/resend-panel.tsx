"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { icons } from "@/lib/icons";
import { authClient } from "@/lib/auth-client";

const COOLDOWN = 60;

/** Resend timer and resend action. The button stays off until the cooldown ends, then sends a new link. */
export function ResendPanel({ email }: { email: string }) {
  const [seconds, setSeconds] = useState(COOLDOWN);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();
  const Refresh = icons.refresh;

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  async function resend() {
    setPending(true);
    setNotice(undefined);
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: "/projects", errorCallbackURL: "/access-problem" });
    setPending(false);
    if (error) {
      setNotice("We could not send another link. Try again in a moment.");
      return;
    }
    setSeconds(COOLDOWN);
    setNotice("A new link has been sent.");
  }

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <div className="mt-5 flex flex-col items-center gap-2.5 pt-4">
      <div className="flex w-full items-center justify-between text-secondary">
        <span className="text-body-sm">Didn&apos;t receive it?</span>
        <div className="flex items-center gap-1.5 rounded bg-surface-container px-2 py-1 text-on-surface">
          <icons.pending size={14} aria-hidden="true" className="text-primary" />
          <span className="font-mono text-label-sm tabular-nums" aria-live="polite">
            {seconds > 0 ? `Resend available in (${mm}:${ss})` : "You can resend now"}
          </span>
        </div>
      </div>
      <div className="flex w-full items-center justify-between pt-1">
        <button
          type="button"
          onClick={resend}
          disabled={seconds > 0 || pending}
          className="flex items-center gap-1 text-body-sm-medium text-secondary transition-opacity hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Refresh size={16} aria-hidden="true" />
          {pending ? "Sending…" : "Resend link"}
        </button>
        <Link href="/log-in" className="text-body-sm text-secondary underline transition-colors hover:text-on-surface">
          Use a different email
        </Link>
      </div>
      {notice ? <p role="status" className="w-full text-label-md text-secondary">{notice}</p> : null}
    </div>
  );
}
