import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand";

/** The header and footer of the public marketing pages (landing, pricing). Ported from the landing design. */

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-canvas/85 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2"><BrandLogo /></Link>
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          <a href="/#features" className="rounded-lg px-3 py-1.5 text-body-sm-medium text-on-surface-variant transition-colors hover:text-on-surface">Features</a>
          <a href="/#how" className="rounded-lg px-3 py-1.5 text-body-sm-medium text-on-surface-variant transition-colors hover:text-on-surface">How it works</a>
          <Link href="/pricing" className="rounded-lg px-3 py-1.5 text-body-sm-medium text-on-surface-variant transition-colors hover:text-on-surface">Pricing</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/log-in" className="hidden px-2 py-1.5 text-body-sm-medium text-on-surface-variant transition-colors hover:text-on-surface sm:inline-block">Log in</Link>
          <Link href="/sign-up" className="inline-flex h-10 items-center rounded-[10px] bg-primary-container px-5 text-body-sm-medium text-on-primary transition-colors hover:bg-primary">Create studio account</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="w-full bg-surface-container-low">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 pr-6">
            <div className="mb-3"><BrandLogo /></div>
            <p className="max-w-sm text-body-sm text-on-surface-variant">Proposals, sign-off, milestone payments and files for client projects.</p>
          </div>
          <div>
            <h4 className="mb-4 text-label-md uppercase tracking-wider text-on-surface">Product</h4>
            <ul className="space-y-3">
              <li><a href="/#features" className="text-body-sm text-on-surface-variant hover:text-on-surface">Features</a></li>
              <li><a href="/#how" className="text-body-sm text-on-surface-variant hover:text-on-surface">How it works</a></li>
              <li><Link href="/pricing" className="text-body-sm text-on-surface-variant hover:text-on-surface">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-label-md uppercase tracking-wider text-on-surface">Support and legal</h4>
            <ul className="space-y-3">
              <li><Link href="/help" className="text-body-sm text-on-surface-variant hover:text-on-surface">Help</Link></li>
              <li><Link href="/contact" className="text-body-sm text-on-surface-variant hover:text-on-surface">Contact</Link></li>
              <li><Link href="/privacy" className="text-body-sm text-on-surface-variant hover:text-on-surface">Privacy</Link></li>
              <li><Link href="/terms" className="text-body-sm text-on-surface-variant hover:text-on-surface">Terms</Link></li>
              <li><Link href="/cookies" className="text-body-sm text-on-surface-variant hover:text-on-surface">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-2 pt-6 md:flex-row">
          <p className="text-body-sm text-on-surface-variant">© 2026 Cadence. All rights reserved.</p>
          <p className="text-label-sm text-on-surface-variant">Client delivery portal</p>
        </div>
      </div>
    </footer>
  );
}
