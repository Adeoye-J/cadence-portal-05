"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { rememberSignInEmailAction } from "@/server/login-actions";
import { useState, type FormEvent } from "react";
import { BrandLogo, GoogleMark } from "@/components/ui/brand";
import { authClient } from "@/lib/auth-client";
import { COUNTRIES } from "@/lib/validation/signup";
import { signUpAction, type SignUpState } from "@/server/signup-actions";
import { icons } from "@/lib/icons";

const FIELD = "h-11 w-full rounded-lg bg-surface-container-low/40 px-3.5 text-body-sm text-on-surface transition-all placeholder:text-outline-variant focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20";

/**
 * Sign-up card, ported from the design. The form is checked on the server, the details wait there, and then
 * the sign-in link is sent. Google sign-up uses the same flow. Onboarding turns the details into a studio.
 */
export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "working" | "sent">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage(undefined);
    setErrors({});
    setStatus("working");
    const result: SignUpState = await signUpAction({ status: "idle" }, new FormData(form));
    if (result.status === "error") {
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message);
      setStatus("idle");
      return;
    }
    if (result.status !== "ready") return setStatus("idle");
    const { error } = await authClient.signIn.magicLink({
      email: result.email,
      callbackURL: "/onboarding/workspace",
      errorCallbackURL: "/access-problem",
    });
    if (error) {
      setMessage("We could not send the link. Try again in a moment.");
      setStatus("idle");
      return;
    }
    await rememberSignInEmailAction(result.email);
    router.push("/check-email");
  }

  const Arrow = icons.forward;
  const Verified = icons.shieldCheck;
  const OpenLink = icons.arrowUpRight;
  const ExpandMore = icons.chevronDown;

  return (
    <div className="relative z-10 w-full max-w-[480px] rounded-xl bg-surface-container-lowest p-6 shadow-sm transition-all sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 flex h-8 items-center justify-center">
          <BrandLogo />
        </div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-0.5 text-label-sm uppercase tracking-wider text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
          Studio Operations Portal
        </div>
        <h1 className="text-headline-lg tracking-tight text-on-surface">Create your Cadence account</h1>
        <p className="mt-1 text-body-sm text-secondary">Start delivering projects with milestone precision.</p>
      </div>

      {(
        <form className="mt-6 flex flex-col gap-4" onSubmit={submit} noValidate>
          <Field id="fullName" label="Full name" hint="Legal contact" error={errors.fullName}>
            <input id="fullName" name="fullName" type="text" placeholder="Alex Morgan" autoComplete="name" className={FIELD} />
          </Field>
          <Field id="workEmail" label="Work email" hint="Passwordless inbox" error={errors.workEmail}>
            <input id="workEmail" name="workEmail" type="email" placeholder="alex@studioforma.com" autoComplete="email" className={FIELD} />
          </Field>
          <Field id="studioName" label="Studio or business name" hint="Client-facing entity" error={errors.studioName}>
            <input id="studioName" name="studioName" type="text" placeholder="Forma Design Co." autoComplete="organization" className={FIELD} />
          </Field>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="country" className="text-body-sm-medium text-on-surface">Country</label>
            <div className="relative">
              <select id="country" name="country" defaultValue="US" className={`${FIELD} cursor-pointer appearance-none pr-10`}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <ExpandMore size={20} aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 my-auto text-secondary" />
            </div>
            {errors.country ? <p role="alert" className="text-body-sm text-danger">{errors.country}</p> : null}
          </div>

          <fieldset className="flex flex-col gap-2 pt-0.5">
            <legend className="flex w-full items-center justify-between">
              <span className="text-body-sm-medium text-on-surface">Default currency</span>
              <span className="text-label-sm text-on-surface-variant">Changeable per project</span>
            </legend>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { code: "USD", symbol: "($)", label: "United States Dollar" },
                { code: "NGN", symbol: "(₦)", label: "Nigerian Naira" },
              ].map((c, i) => (
                <label key={c.code} className="flex cursor-pointer select-none flex-col rounded-lg bg-surface-container-low p-3 transition-all hover:bg-surface-container has-[:checked]:ring-2 has-[:checked]:ring-primary">
                  <span className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-1.5 text-body-sm-medium text-on-surface">
                      <span className="font-semibold text-primary">{c.code}</span>
                      <span className="font-normal text-secondary">{c.symbol}</span>
                    </span>
                    <input type="radio" name="currency" value={c.code} defaultChecked={i === 0} className="size-4 accent-primary" />
                  </span>
                  <span className="mt-1 text-label-sm tracking-tight text-secondary">{c.label}</span>
                </label>
              ))}
            </div>
            {errors.currency ? <p role="alert" className="text-body-sm text-danger">{errors.currency}</p> : null}
          </fieldset>

          <div className="flex items-start gap-2.5 pt-1">
            <input id="terms" name="terms" type="checkbox" defaultChecked className="mt-0.5 size-4 cursor-pointer accent-primary" />
            <label htmlFor="terms" className="cursor-pointer select-none text-body-sm leading-snug text-secondary">
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-on-surface underline hover:text-primary">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="font-medium text-on-surface underline hover:text-primary">Privacy Policy</Link>.
            </label>
          </div>
          {errors.terms ? <p role="alert" className="text-body-sm text-danger">{errors.terms}</p> : null}

          {message ? <p role="alert" className="rounded-lg bg-danger-subtle p-3 text-body-sm text-danger">{message}</p> : null}

          <button
            type="submit"
            disabled={status === "working"}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-body-sm-medium text-on-primary shadow-sm transition-all duration-150 hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60"
          >
            <span>{status === "working" ? "Working…" : "Continue"}</span>
            <Arrow size={18} aria-hidden="true" />
          </button>

          <div className="relative my-1 flex items-center justify-center">
            <div className="h-px w-full bg-surface-container-highest" />
            <span className="absolute bg-surface-container-lowest px-3 text-label-md uppercase tracking-wider text-secondary">or</span>
          </div>

          <button
            type="button"
            disabled={!googleEnabled}
            aria-describedby={googleEnabled ? undefined : "google-note"}
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/onboarding/workspace", errorCallbackURL: "/access-problem" })}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-surface-container-lowest text-body-sm-medium text-on-surface transition-all hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <GoogleMark />
            <span>Continue with Google</span>
          </button>
          {googleEnabled ? null : <p id="google-note" className="text-label-sm text-secondary">Google sign-in is not set up for this site.</p>}

          <div className="mt-1 flex items-start gap-2.5 rounded-lg bg-surface-container-low p-3 text-on-surface-variant">
            <Verified size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
            <p className="text-label-md leading-relaxed text-secondary">
              We email a secure sign-in link to your inbox. You can add a passkey later from your account.
            </p>
          </div>
        </form>
      )}

      <div className="mt-6 bg-surface-container-lowest pt-5 text-center">
        <p className="text-body-sm text-secondary">
          Already have an account?
          <Link href="/log-in" className="ml-1 inline-flex items-center gap-0.5 text-body-sm-medium text-primary hover:underline">
            <span>Log in</span>
            <OpenLink size={14} aria-hidden="true" />
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center justify-between text-body-sm-medium text-on-surface">
        <span>{label}</span>
        <span className="text-label-sm font-normal text-secondary">{hint}</span>
      </label>
      {children}
      {error ? <p role="alert" className="text-body-sm text-danger">{error}</p> : null}
    </div>
  );
}
