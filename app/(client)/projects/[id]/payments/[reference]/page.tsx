import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AutoRefresh } from "@/components/features/payments/auto-refresh";
import { PayMilestoneButton } from "@/components/features/payments/pay-milestone-button";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { getPaymentForViewer } from "@/server/payments";

export const metadata: Metadata = { title: "Payment status" };

type Params = { params: Promise<{ id: string; reference: string }> };

/**
 * Payment status after the provider redirects back. The page shows what the webhook
 * has recorded, not what the redirect claims. While pending, it refreshes until the
 * webhook arrives (Stitch: payment_processing_confirmed_*, payment_not_completed).
 */
export default async function PaymentStatusPage({ params }: Params) {
  const { id, reference } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");

  const payment = await getPaymentForViewer(viewer.userId, id, reference);
  if (!payment) notFound();

  const amount = formatMoney(payment.amountMinor, payment.currency);
  const milestone = `Milestone ${payment.milestonePosition}`;

  if (payment.status === "paid") {
    return (
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title="Payment confirmed" description={`${milestone} is paid. ${amount} is recorded against this project.`} />
        <Link href={`/projects/${id}`} className={cn(buttonVariants({ variant: "primary" }), "w-fit")}>
          Go to project
        </Link>
      </main>
    );
  }

  if (payment.status === "failed") {
    return (
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title="Payment did not go through" description={`${milestone} is still due at ${amount}. Nothing was charged.`} />
        <div className="max-w-md">
          <PayMilestoneButton projectId={id} position={payment.milestonePosition} label={`Try again: ${amount}`} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <AutoRefresh />
      <PageHeader title="Processing your payment" description={`${milestone}, ${amount}.`} />
      <div className="flex max-w-md flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:p-6">
        <StatusChip tone="neutral" label="Waiting for confirmation" />
        <p className="text-body-sm text-ink-muted">
          This page updates by itself when the payment provider confirms the payment. Do not pay again while it is processing.
        </p>
      </div>
    </main>
  );
}
