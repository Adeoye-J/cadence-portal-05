import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeletionRequestForm } from "@/components/features/account/deletion-request-form";
import { PageHeader } from "@/components/layout/page-header";
import { getViewer } from "@/lib/session";
import { accountDeletionStatus } from "@/server/account";

export const metadata: Metadata = { title: "Your data" };

/** Data export and account deletion (brief section 9). Export is immediate. Deletion is recorded and then handled by a person. */
export default async function YourDataPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const requestedAt = await accountDeletionStatus(viewer.userId);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader back={{ href: "/account", label: "Back to account" }} title="Your data" description="Download a copy of what Cadence holds about you, or ask for your account to be deleted." />
      <section aria-labelledby="export-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 id="export-heading" className="text-headline-sm text-ink">Download your data</h2>
        <p className="text-body-sm text-ink-muted">
          The file is JSON. It holds your account details, the projects you are a contact on, their milestones, your payments, your change requests and the studio&apos;s replies, and the client-visible activity on those projects. It does not hold the studio&apos;s internal records or other clients&apos; details.
        </p>
        {/* Route handler, not a page: a plain anchor with download is correct here. */}
        <a href="/api/account/export" download className="inline-flex min-h-11 w-fit items-center rounded-control border border-border bg-surface px-5 text-body-sm font-medium text-ink hover:border-ink">
          Download JSON
        </a>
      </section>
      <section aria-labelledby="delete-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 id="delete-heading" className="text-headline-sm text-ink">Delete your account</h2>
        <p className="text-body-sm text-ink-muted">
          Deletion is requested here and then handled by a person. Projects you are on stay with the studio&apos;s records, which the studio may need to keep. Your sign-in and contact details are what is removed.
        </p>
        <DeletionRequestForm alreadyRequestedAt={requestedAt} />
      </section>
    </main>
  );
}
