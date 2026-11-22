"use client";

import { Button } from "@/components/ui/button";

/**
 * Error boundary for the projects dashboard. Shows no internal detail, because the
 * message may contain data. The digest is logged on the server.
 */
export default function StudioProjectsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-headline-lg text-ink">We could not load projects</h1>
      <p className="text-body-lg text-ink-muted">Try again. If this keeps happening, contact support.</p>
      <div>
        <Button type="button" variant="secondary" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
