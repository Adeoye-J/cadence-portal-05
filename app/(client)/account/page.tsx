import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PasskeyPanel } from "@/components/features/account/passkey-panel";
import { SignOutButton } from "@/components/features/account/sign-out-button";
import { ThemeSelector } from "@/components/features/account/theme-selector";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { parseThemePreference, THEME_COOKIE } from "@/lib/theme";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Account" };

/** Account: profile, theme, passkeys, sign-out and the data page. Each control here does what it says. */
export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in?next=/account");
  const theme = parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Account" description="How you appear in Cadence, how it looks on this device, and how you sign in." />

      <section aria-labelledby="profile-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 id="profile-heading" className="text-headline-sm text-ink">Profile</h2>
        <dl className="grid gap-3 text-body-sm sm:grid-cols-2">
          <div><dt className="text-ink-muted">Name</dt><dd className="text-ink">{viewer.name ?? "Not set"}</dd></div>
          <div><dt className="text-ink-muted">Email</dt><dd className="text-ink">{viewer.email}</dd></div>
        </dl>
        <p className="text-label-md text-ink-muted">Changing your name or email is not available yet.</p>
      </section>

      <section aria-labelledby="theme-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 id="theme-heading" className="text-headline-sm text-ink">Appearance</h2>
        <p className="text-body-sm text-ink-muted">Applies to every page you open, on this device.</p>
        <ThemeSelector current={theme} />
      </section>

      <section aria-labelledby="passkey-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 id="passkey-heading" className="text-headline-sm text-ink">Passkeys</h2>
        <p className="text-body-sm text-ink-muted">A passkey signs you in with this device&apos;s fingerprint or screen lock, with no email link.</p>
        <PasskeyPanel />
      </section>

      <section aria-labelledby="session-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 id="session-heading" className="text-headline-sm text-ink">Session and data</h2>
        <div className="flex flex-wrap gap-3">
          <SignOutButton />
          <Link href="/account/data" className={buttonVariants({ variant: "secondary" })}>Your data</Link>
        </div>
      </section>
    </main>
  );
}
