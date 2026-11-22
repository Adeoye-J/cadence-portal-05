import type { Metadata } from "next";
import { env } from "@/lib/env";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create your account" };

/** Sign up (design: sign_up). Holds the studio details, then sends a sign-in link to the work email. */
export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas p-space-md sm:p-space-xl">
      <SignUpForm googleEnabled={Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)} />
    </main>
  );
}
