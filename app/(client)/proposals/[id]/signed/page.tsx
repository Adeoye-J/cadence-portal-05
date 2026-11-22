import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { PayMilestoneButton } from "@/components/features/payments/pay-milestone-button";
import { cn } from "@/lib/cn";
import { StatusChip } from "@/components/ui/status-chip";
import { formatDateTimeUtc, formatMoney } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { getProposalView } from "@/server/proposals";

export const metadata: Metadata = { title: "Proposal signed" };

type Params = { params: Promise<{ id: string }> };

/**
 * Signed confirmation and the next step (Stitch: signed, signed_desktop).
 * The pay button starts a Paystack checkout. The status changes only after the webhook settles it.
 */
export default async function ProposalSignedPage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");

  const view = await getProposalView(viewer.userId, id);
  if (!view) notFound();
  const { project, signature } = view;
  // Only the signer sees the receipt. Other contacts get the review page.
  if (!signature || signature.signerUserId !== viewer.userId) redirect(`/proposals/${id}`);

  const first = project.milestones.find((m) => m.position === 1);
  const PayStatus = <StatusChip tone="waiting" label="Payment due" />;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={`Ref ${project.reference}`}
        title="Proposal signed"
        description={`Signed as ${signature.typedName} on ${formatDateTimeUtc(signature.signedAt)}.`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="record-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
          <h2 id="record-heading" className="text-headline-sm text-ink">Signed record</h2>
          <dl className="flex flex-col gap-4 text-body-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-ink-muted">Signed by</dt>
              <dd className="text-ink">{signature.typedName}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-ink-muted">Signed at</dt>
              <dd className="tnum text-ink">{formatDateTimeUtc(signature.signedAt)}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-ink-muted">Terms fingerprint (SHA-256)</dt>
              <dd className="break-all font-mono text-label-md text-ink">{signature.documentSha256}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="next-heading" className="flex flex-col gap-4 rounded-card border border-waiting-border bg-waiting-subtle p-4 sm:p-6">
          <div className="flex flex-col items-start gap-2">
            {PayStatus}
            <h2 id="next-heading" className="text-headline-sm text-ink">{first?.status === "payment_due" ? "Next step: pay milestone 1" : "Milestone 1 is paid"}</h2>
          </div>
          {first ? (
            <p className="text-body-sm text-ink">
              Milestone 1 is <span className="tnum font-medium">{formatMoney(first.amountMinor, project.currency)}</span>.
              Work starts when this payment settles.
            </p>
          ) : null}
          {first?.status === "payment_due" ? (
            <PayMilestoneButton projectId={project.id} position={1} label="Pay milestone 1" />
          ) : null}
          <Link href={`/projects/${project.id}`} className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
            Go to project
          </Link>
        </section>
      </div>
    </main>
  );
}
