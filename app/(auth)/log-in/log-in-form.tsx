"use client";

import { routeTo } from "@/lib/routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BrandLogo, GoogleMark } from "@/components/ui/brand";
import { icons } from "@/lib/icons";
import { authClient } from "@/lib/auth-client";
import { useBrowserFeature } from "@/lib/use-browser-feature";
import { signInSchema } from "@/lib/validation/auth";
import { rememberSignInEmailAction } from "@/server/login-actions";

type Busy = "magic" | "google" | "passkey" | null;

const supportsPasskeys = () => typeof window.PublicKeyCredential !== "undefined";

/**
 * The log-in card, ported from the design. Every control works: the magic link is requested, Google starts
 * its flow when configured, and a passkey signs in on a device that has one. Controls that cannot work here are
 * disabled with the reason beside them, never left silent.
 */
export function LogInForm({ nextPath, googleEnabled }: { nextPath: string; googleEnabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState<Busy>(null);
  const passkeySupported = useBrowserFeature(supportsPasskeys);

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signInSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setFieldError(undefined);
    setError(undefined);
    setBusy("magic");
    const { error: requestError } = await authClient.signIn.magicLink({
      email: parsed.data.email,
      callbackURL: nextPath,
      errorCallbackURL: "/access-problem",
    });
    setBusy(null);
    if (requestError) {
      setError("We could not send the link. Try again in a moment.");
      return;
    }
    await rememberSignInEmailAction(parsed.data.email);
    router.push("/check-email");
  }

  async function signInWithGoogle() {
    setError(undefined);
    setBusy("google");
    const { error: googleError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: nextPath,
      errorCallbackURL: "/access-problem",
    });
    setBusy(null);
    if (googleError) setError("Google sign-in did not start. Try again.");
  }

  async function signInWithPasskey() {
    setError(undefined);
    setBusy("passkey");
    const { error: passkeyError } = await authClient.signIn.passkey();
    setBusy(null);
    if (passkeyError) {
      setError("No passkey was used. Try again, or use the email link.");
      return;
    }
    router.push(routeTo(nextPath));
    router.refresh();
  }

  const Mail = icons.mail;
  const Send = icons.send;
  const ShieldCheck = icons.shieldCheck;
  const Fingerprint = icons.fingerprint;

  return (
    <div className="relative flex w-full max-w-[440px] flex-col items-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
        <span className="text-label-sm font-medium uppercase tracking-wider text-secondary">Operational Portal</span>
      </div>

      <div className="relative flex w-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-fixed-dim to-primary" />

        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-8 items-center justify-center">
            <BrandLogo />
          </div>
          <h1 className="text-headline-md tracking-tight text-on-surface">Log in to Cadence</h1>
          <p className="mt-1.5 max-w-[320px] text-body-sm text-secondary">Access your active client workspaces and delivery pipelines.</p>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-lg bg-surface-container-low p-3.5">
          <ShieldCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-body-sm-medium text-on-surface">Passwordless Verification</p>
            <p className="mt-0.5 text-body-sm leading-snug text-secondary">No password to remember. We use secure magic links and passkeys.</p>
          </div>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={sendLink} noValidate>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="work-email" className="text-label-md uppercase tracking-wider text-on-surface">Work Email</label>
              <span className="text-label-sm text-secondary">One-time link</span>
            </div>
            <div className="relative flex items-center">
              <Mail size={20} aria-hidden="true" className="pointer-events-none absolute left-3.5 text-secondary" />
              <input
                id="work-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={fieldError ? "work-email-error" : undefined}
                className="h-11 w-full rounded-lg bg-surface-container-low pl-11 pr-4 text-body-sm text-on-surface placeholder:text-secondary transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {fieldError ? <p id="work-email-error" role="alert" className="text-body-sm text-danger">{fieldError}</p> : null}
          </div>

          <button
            type="submit"
            disabled={busy !== null}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-body-sm-medium text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.99] disabled:opacity-60"
          >
            {busy === "magic" ? <span className="text-body-sm-medium">Sending…</span> : (<><Send size={18} aria-hidden="true" /><span>Email me a sign-in link</span></>)}
          </button>
        </form>
        {error ? <p role="alert" className="mt-4 rounded-lg bg-danger-subtle p-3 text-body-sm text-danger">{error}</p> : null}

        <div className="relative my-6 flex items-center justify-center">
          <div className="h-px w-full bg-surface-container-high" />
          <span className="absolute bg-surface-container-lowest px-3 text-label-sm uppercase tracking-wider text-secondary">or</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={!googleEnabled || busy !== null}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-surface-container-low text-body-sm-medium text-on-surface transition-all hover:bg-surface-container active:scale-[0.99] disabled:opacity-60"
          >
            <GoogleMark />
            <span>Continue with Google</span>
          </button>
          {googleEnabled ? null : <p className="text-label-sm text-secondary">Google sign-in is not set up for this site.</p>}

          <button
            type="button"
            onClick={signInWithPasskey}
            disabled={!passkeySupported || busy !== null}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-surface-container-low text-body-sm-medium text-on-surface transition-all hover:bg-surface-container active:scale-[0.99] disabled:opacity-60"
          >
            <Fingerprint size={20} aria-hidden="true" className="text-primary" />
            <span>{busy === "passkey" ? "Waiting for your device…" : "Sign in with a passkey"}</span>
          </button>
          {passkeySupported ? null : <p className="text-label-sm text-secondary">This browser does not support passkeys.</p>}
        </div>

        <div className="mt-8 flex items-center justify-center bg-surface-container-lowest pt-6">
          <p className="text-body-sm text-secondary">
            New here?
            <Link href="/sign-up" className="ml-1 text-body-sm-medium text-primary hover:underline">Create an account</Link>
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-4 text-label-sm text-secondary">
          <Link href="/privacy" className="hover:text-on-surface">Privacy</Link>
          <span className="inline-block h-1 w-1 rounded-full bg-surface-variant" />
          <Link href="/terms" className="hover:text-on-surface">Terms</Link>
          <span className="inline-block h-1 w-1 rounded-full bg-surface-variant" />
          <Link href="/help" className="hover:text-on-surface">Help</Link>
        </div>
        <p className="text-label-sm text-secondary/60">Cadence © 2026</p>
      </div>
    </div>
  );
}
