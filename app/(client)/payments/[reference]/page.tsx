import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { cn } from "@/lib/cn";
import { formatDateTimeUtc, formatMoney } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { getViewerPayment } from "@/server/client-reads";

export const metadata: Metadata = { title: "Payment" };

type Params = { params: Promise<{ reference: string }> };

const STATUS: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: "neutral", label: "Waiting for confirmation" },
  paid: { tone: "done", label: "Paid" },
  failed: { tone: "critical", label: "Did not complete" },
};

/** One payment's detail (Stitch: transaction_detail). Shows only the fields the client needs, not provider internals. */
export default async function PaymentDetailPage({ params }: Params) {
  const { reference } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const payment = await getViewerPayment(viewer.userId, reference);
  if (!payment) notFound();
  const status = STATUS[payment.status] ?? { tone: "neutral" as const, label: payment.status };

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: "/payments", label: "Back to payment history" }}
        eyebrow={`Ref ${payment.projectReference}`}
        title={`Milestone ${payment.milestonePosition} payment`}
        description={payment.projectTitle}
      />
      <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="tnum text-headline-md text-ink">{formatMoney(payment.amountMinor, payment.currency)}</p>
          <StatusChip tone={status.tone} label={status.label} />
        </div>
        <dl className="grid gap-3 text-body-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Started</dt>
            <dd className="tnum text-ink">{formatDateTimeUtc(payment.createdAt)}</dd>
          </div>
          {payment.settledAt ? (
            <div>
              <dt className="text-ink-muted">Confirmed</dt>
              <dd className="tnum text-ink">{formatDateTimeUtc(payment.settledAt)}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-ink-muted">Reference</dt>
            <dd className="break-all font-mono text-label-md text-ink">{payment.reference}</dd>
          </div>
        </dl>
        {payment.status === "pending" ? (
          <Link href={`/projects/${payment.projectId}/payments/${payment.reference}`} className={cn(buttonVariants({ variant: "secondary" }), "w-fit")}>
            Check progress
          </Link>
        ) : null}
      </section>
    </main>
  );
}
