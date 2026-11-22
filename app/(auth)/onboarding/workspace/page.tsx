import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { getViewer } from "@/lib/session";
import { COUNTRIES } from "@/lib/validation/signup";
import { hasPendingSignup } from "@/server/onboarding";
import { getStudioMembership } from "@/server/studio";

export const metadata: Metadata = { title: "Set up your studio" };

/**
 * Creates the studio after the first sign-in, from the details entered on the sign-up page. The design for this
 * step (workspace_setup) is not ported yet, so this is a working step with the same details, not the final design.
 */
export default async function WorkspaceSetupPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in?next=/onboarding/workspace");
  if (await getStudioMembership(viewer.userId)) redirect("/studio/projects");

  const details = await hasPendingSignup(viewer.email);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <h1 className="text-headline-lg text-on-surface">Set up your studio</h1>
      {details ? (
        <>
          <dl className="grid gap-3 rounded-card border border-border bg-surface p-5 text-body-sm">
            <div><dt className="text-ink-muted">Studio</dt><dd className="text-ink">{details.studioName}</dd></div>
            <div><dt className="text-ink-muted">Contact</dt><dd className="text-ink">{details.fullName}</dd></div>
            <div><dt className="text-ink-muted">Country</dt><dd className="text-ink">{COUNTRIES.find((c) => c.code === details.country)?.name ?? details.country}</dd></div>
            <div><dt className="text-ink-muted">Default currency</dt><dd className="text-ink">{details.currency}</dd></div>
          </dl>
          <OnboardingForm />
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-body-lg text-ink-muted">We could not find your sign-up details. They are kept for 30 minutes.</p>
          <Link href="/sign-up" className="w-fit text-body-sm-medium text-primary underline-offset-4 hover:underline">Start sign-up again</Link>
        </div>
      )}
    </main>
  );
}
