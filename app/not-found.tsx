import type { Metadata } from "next";
import Link from "next/link";
import { icons } from "@/lib/icons";

export const metadata: Metadata = { title: "Page not found" };

/** Not found (design: access_problems_fallbacks, the 404 card). Real links only; no invented request trace. */
export default function NotFound() {
  const FindInPage = icons.findInPage;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-[560px] rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-10">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
          <FindInPage size={24} aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-headline-lg tracking-tight text-on-surface">Page not found</h1>
          <span className="font-mono text-headline-sm text-outline">404</span>
        </div>
        <p className="mt-3 text-body-lg text-secondary">
          The page you asked for does not exist, has been removed, or is not open to your account.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/projects" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-body-sm-medium text-on-primary shadow-sm transition-colors hover:bg-primary-container">
            Return to your projects
          </Link>
          <Link href="/log-in" className="inline-flex items-center justify-center rounded-lg bg-surface-container px-5 py-3 text-body-sm-medium text-on-surface transition-colors hover:bg-surface-container-high">
            Log in
          </Link>
        </div>
        <p className="mt-6 text-center text-body-sm text-secondary">
          Need help? <Link href="/contact" className="font-medium text-primary underline-offset-4 hover:underline">Contact us</Link>
        </p>
      </div>
    </main>
  );
}
