import type { Metadata } from "next";
import { env } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { LogInForm } from "./log-in-form";

export const metadata: Metadata = { title: "Log in" };

/** Log in (design: log_in). Magic link, Google when configured, and passkeys. */
export default async function LogInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas p-gutter-mobile sm:p-gutter">
      <LogInForm nextPath={safeNextPath(next)} googleEnabled={Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)} />
    </main>
  );
}
