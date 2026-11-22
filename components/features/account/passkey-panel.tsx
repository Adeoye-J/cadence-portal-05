"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useBrowserFeature } from "@/lib/use-browser-feature";

const supportsPasskeys = () => typeof window.PublicKeyCredential !== "undefined";

/** Adds a passkey to this account on the current device. Shown only where the browser supports passkeys. */
export function PasskeyPanel() {
  const supported = useBrowserFeature(supportsPasskeys);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  async function add() {
    setBusy(true);
    setMessage(undefined);
    const { error } = await authClient.passkey.addPasskey({ name: "This device" });
    setBusy(false);
    setMessage(error ? "The passkey was not added. Try again." : "Passkey added. You can now sign in with it.");
  }

  return (
    <div className="flex flex-col gap-3">
      {supported ? (
        <Button type="button" variant="secondary" loading={busy} onClick={add} className="w-fit">Add a passkey</Button>
      ) : (
        <p className="text-body-sm text-ink-muted">This browser does not support passkeys.</p>
      )}
      {message ? <p role="status" className="text-body-sm text-ink">{message}</p> : null}
    </div>
  );
}
