import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ResendPanel } from "./resend-panel";
import { BrandLogo } from "@/components/ui/brand";
import { icons } from "@/lib/icons";
import { LOGIN_EMAIL_COOKIE } from "@/lib/login-email";

export const metadata: Metadata = { title: "Check your inbox" };

/** "Check your inbox" (design: check_your_email_dual_states, state A). The expired-link state is on /access-problem. */
export default async function CheckEmailPage() {
  const email = (await cookies()).get(LOGIN_EMAIL_COOKIE)?.value;
  if (!email) redirect("/log-in");
  const Mail = icons.mail;
  const Edit = icons.edit;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="flex w-full max-w-[440px] flex-col">
        <div className="relative flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <div className="mb-6 flex items-center justify-between pb-6">
            <BrandLogo />
          </div>
          <div className="mb-6">
            <h1 className="text-headline-lg tracking-tight text-on-surface">Check your inbox</h1>
            <p className="mt-2 text-body-sm text-secondary">We sent a temporary sign-in link to:</p>
            <div className="group mt-3 flex items-center justify-between rounded-lg bg-surface-container-low px-3.5 py-2.5 transition-colors duration-150 hover:bg-surface-container">
              <div className="flex min-w-0 items-center gap-2.5">
                <Mail size={18} aria-hidden="true" className="shrink-0 text-primary" />
                <span className="truncate text-body-sm-medium text-on-surface">{email}</span>
              </div>
              <Link href="/log-in" aria-label="Edit email address" className="flex items-center text-secondary transition-colors hover:text-on-surface">
                <Edit size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <a
            href="mailto:"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-body-sm-medium text-on-primary shadow-sm transition-all hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <icons.externalLink size={18} aria-hidden="true" />
            Open email app
          </a>

          <ResendPanel email={email} />
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-lg bg-surface-container-low p-4">
          <icons.info size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-secondary" />
          <p className="text-body-sm leading-snug text-secondary">
            <span className="text-body-sm-medium text-on-surface">Tip:</span> Can&apos;t find the email? Check your spam or promotions folder, or make sure{" "}
            <span className="font-mono text-on-surface">{email}</span> is spelled correctly.
          </p>
        </div>
      </div>
    </main>
  );
}
