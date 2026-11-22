import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand";
import { icons } from "@/lib/icons";

export const metadata: Metadata = { title: "This link is no longer valid" };

/**
 * Expired or used sign-in link (design: access_problems_fallbacks, the expired card). The design's sample
 * reference, recipient and timestamps are not shown: this page does not know which link failed, and nothing is invented.
 */
export default function AccessProblemPage() {
  const LinkOff = icons.linkOff;
  const Schedule = icons.pending;
  const Mail = icons.outgoingMail;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-[560px] rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-tertiary-fixed text-tertiary">
            <LinkOff size={24} aria-hidden="true" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-fixed px-3 py-1 text-label-sm text-tertiary">
            <Schedule size={14} aria-hidden="true" /> Link expired or used
          </span>
        </div>
        <h1 className="text-headline-lg tracking-tight text-on-surface">This link is no longer valid</h1>
        <p className="mt-3 text-body-lg text-secondary">
          Sign-in links work once and expire after 15 minutes. This one has either been used or has run out.
        </p>

        <dl className="mt-6 space-y-2 rounded-lg bg-surface-container-low p-4 text-body-sm">
          <div className="flex justify-between gap-4"><dt className="text-secondary">Link type</dt><dd className="text-on-surface">Single-use sign-in</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-secondary">Valid for</dt><dd className="text-on-surface">15 minutes</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-secondary">Status</dt><dd className="font-medium text-danger">Not valid</dd></div>
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/log-in" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-body-sm-medium text-on-primary shadow-sm transition-colors hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <Mail size={18} aria-hidden="true" />
            Request a new sign-in link
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center rounded-lg bg-surface-container px-5 py-3 text-body-sm-medium text-on-surface transition-colors hover:bg-surface-container-high">
            Contact support
          </Link>
        </div>
        <p className="mt-6 text-center text-label-sm text-secondary">Sign-in links are single-use and tied to the address they were sent to.</p>
      </div>
    </main>
  );
}
