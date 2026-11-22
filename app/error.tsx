"use client";

import { Button } from "@/components/ui/button";

/**
 * Error boundary for every route without its own. Shows no internal detail: the message may hold data,
 * so the digest is what gets logged on the server.
 */
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-12 sm:px-6">
      <h1 className="text-headline-lg text-ink">Something went wrong</h1>
      <p className="text-body-lg text-ink-muted">Try again. If it keeps happening, contact support with the time you saw it.</p>
      <div>
        <Button type="button" variant="secondary" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
