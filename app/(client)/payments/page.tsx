import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { formatDateTimeUtc, formatMoney } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { listViewerPayments } from "@/server/client-reads";

export const metadata: Metadata = { title: "Payment history" };

const STATUS: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: "neutral", label: "Pending" },
  paid: { tone: "done", label: "Paid" },
  failed: { tone: "critical", label: "Did not complete" },
};

/** Payment history across the client's projects (Stitch: payment_history). */
export default async function PaymentHistoryPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const payments = await listViewerPayments(viewer.userId);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Payment history" description="Every milestone payment across your projects, newest first. Times are UTC." />
      {payments.length === 0 ? (
        <section className="rounded-card border border-dashed border-border bg-surface p-6">
          <p className="text-body-sm text-ink-muted">No payments yet. A milestone payment appears here once you start one.</p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {payments.map((p) => {
            const status = STATUS[p.status] ?? { tone: "neutral" as const, label: p.status };
            return (
              <li key={p.reference} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <Link href={`/payments/${p.reference}`} className="text-body-sm font-medium text-primary underline-offset-4 hover:underline">
                    {p.projectTitle} · milestone {p.milestonePosition}
                  </Link>
                  <p className="tnum text-label-md text-ink-muted">{formatDateTimeUtc(p.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="tnum text-body-sm font-medium text-ink">{formatMoney(p.amountMinor, p.currency)}</p>
                  <StatusChip tone={status.tone} label={status.label} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
