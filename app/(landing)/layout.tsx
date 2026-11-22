import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/features/marketing/site-shell";

/** The public marketing pages share one header and footer. */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
