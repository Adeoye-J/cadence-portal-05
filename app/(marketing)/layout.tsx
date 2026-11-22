import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { legalNav, publicNav } from "@/lib/nav";

/** Shell for the public site: the landing page, help, contact and the legal pages. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex min-h-11 items-center text-body-sm font-semibold text-ink">
            Cadence
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            {publicNav.map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center rounded-control px-3 text-body-sm text-ink-muted hover:text-ink">
                {item.label}
              </Link>
            ))}
            <Link href="/log-in" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "ml-2")}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-label-md text-ink-muted">Cadence · client delivery portal</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            {legalNav.map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center text-label-md text-ink-muted hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
