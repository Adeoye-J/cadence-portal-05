import type { Metadata } from "next";
import Link from "next/link";
import { AcceptForm } from "./accept-form";
import { PROJECT_STAGES } from "@/lib/project-stages";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney } from "@/lib/format";
import { stageIndex } from "@/lib/milestones";
import { getViewer } from "@/lib/session";
import { previewInvitation } from "@/server/invitations";

export const metadata: Metadata = { title: "Project invitation" };

type Params = { params: Promise<{ token: string }> };

/**
 * Invitation landing (design: invitation_desktop). Shows the project's real stage, totals and schedule before
 * sign-in. Opening the proposal needs a signed-in session with the invited address, so a forwarded link cannot
 * open it. Escrow, certification and invented names from the design are not shown.
 */
export default async function InvitationPage({ params }: Params) {
  const { token } = await params;
  const preview = await previewInvitation(token);

  if (!preview) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-12">
        <div className="w-full max-w-xl rounded-xl bg-surface-container-lowest p-8 shadow-sm">
          <h1 className="text-headline-lg tracking-tight text-on-surface">This invitation is no longer valid</h1>
          <p className="mt-3 text-body-lg text-secondary">Invitations expire after 14 days and work once. Ask the studio to send a new one.</p>
        </div>
      </main>
    );
  }

  const viewer = await getViewer();
  const signedInWithInvitedEmail = viewer !== null && viewer.email.trim().toLowerCase() === preview.email;
  const current = stageIndex(preview.stage);
  const total = formatMoney(preview.milestones.reduce((sum, m) => sum + m.amountMinor, 0), preview.currency);
  const dueDates = preview.milestones.map((m) => m.dueDate).filter((d): d is string => Boolean(d)).sort();
  const studioInitial = preview.studioName.trim().charAt(0).toUpperCase() || "C";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-xl sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-container/5 blur-3xl" />

        <div className="flex flex-col justify-between gap-4 border-b border-surface-container-highest pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-semibold tracking-widest text-on-primary shadow-sm">{studioInitial}</div>
            <div>
              <span className="text-headline-sm font-semibold tracking-tight text-on-surface">{preview.studioName}</span>
              <span className="block text-label-sm text-secondary">Invitation to review a project</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface-container-low px-3 py-1 text-label-sm uppercase tracking-wider text-on-surface-variant sm:self-center">
            <span className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
            Project reference {preview.reference}
          </div>
        </div>

        <div className="pb-8 pt-8">
          <div className="max-w-2xl">
            <h1 className="mb-3 text-headline-xl tracking-tight text-on-surface">
              {preview.studioName} invited you to review <span className="font-semibold text-primary">{preview.projectTitle}</span>.
            </h1>
            <p className="text-body-lg leading-relaxed text-secondary">
              This page shows the scope of work, the payment schedule and the milestones for this project. Opening the proposal lets you read the full terms and sign.
            </p>
          </div>

          <ol className="mt-8 flex items-center gap-2 overflow-x-auto border-t border-surface-container-highest pb-2 pt-6 text-secondary">
            {PROJECT_STAGES.map((label, i) => (
              <li key={label} className={cn("flex min-w-max items-center gap-2", i > current && "opacity-60")}>
                {i > 0 ? <span className="mx-2 h-0.5 w-8 bg-surface-container-highest lg:w-16" aria-hidden="true" /> : null}
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-label-sm", i <= current ? "bg-primary text-on-primary" : "bg-surface-container-high text-secondary")}>{i + 1}</span>
                <span className={cn("text-label-md", i === current ? "font-semibold text-on-surface" : "text-secondary")} aria-current={i === current ? "step" : undefined}>{label}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 rounded-lg bg-surface-container-low p-4 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-md bg-surface-container-lowest p-3 shadow-sm">
            <span className="text-label-sm uppercase tracking-wider text-secondary">Total of all milestones</span>
            <span className="mt-2 text-headline-lg font-semibold tabular-nums text-primary">{total}</span>
            <span className="mt-1 text-label-sm text-outline">{preview.currency}</span>
          </div>
          <div className="flex flex-col justify-between rounded-md bg-surface-container-lowest p-3 shadow-sm">
            <span className="text-label-sm uppercase tracking-wider text-secondary">Schedule</span>
            <div className="mt-2">
              <div className="text-headline-sm font-semibold text-on-surface">{preview.milestones.length} milestones</div>
              {dueDates.length > 0 ? (
                <div className="mt-0.5 text-body-sm tabular-nums text-secondary">
                  {formatDate(dueDates[0]!)} – {formatDate(dueDates[dueDates.length - 1]!)}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-md bg-surface-container-lowest p-3 shadow-sm">
            <span className="text-label-sm uppercase tracking-wider text-secondary">Client</span>
            <div className="mt-2">
              <div className="text-body-sm-medium text-on-surface">{preview.clientName}</div>
              <div className="text-label-sm text-secondary">Invited address: {preview.email}</div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="mb-4 text-label-sm uppercase tracking-wider text-secondary">How it works</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { title: "Review the scope and milestones", body: "Read the deliverables, the revision terms and when each milestone is due." },
              { title: "Sign by typing your name", body: "Your name and the time are recorded, with a fingerprint of the terms you agreed to." },
              { title: "Pay each milestone when it is due", body: "Each milestone is paid through a hosted checkout. Work on it starts once its payment settles." },
            ].map((step, i) => (
              <div key={step.title} className="rounded-lg bg-surface-container p-4 transition-colors hover:bg-surface-container-high">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest font-semibold text-primary shadow-sm">0{i + 1}</div>
                <h2 className="mb-1 text-headline-sm font-semibold text-on-surface">{step.title}</h2>
                <p className="text-body-sm leading-relaxed text-secondary">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center pb-6 pt-2 text-center">
          {!viewer ? (
            <>
              <Link
                href={`/log-in?next=${encodeURIComponent(`/invite/${token}`)}`}
                className="flex h-12 w-full min-w-[280px] items-center justify-center rounded-lg bg-primary px-8 text-body-lg font-medium text-on-primary shadow-md transition-all hover:bg-primary-container sm:w-auto"
              >
                Sign in to open the proposal
              </Link>
              <p className="mt-3.5 text-body-sm text-secondary">No password needed. We email you a sign-in link for the invited address.</p>
            </>
          ) : signedInWithInvitedEmail ? (
            <AcceptForm token={token} />
          ) : (
            <p role="alert" className="max-w-md text-body-sm text-danger">
              This invitation was sent to a different email address. Sign out and sign in with the invited address to open it.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
