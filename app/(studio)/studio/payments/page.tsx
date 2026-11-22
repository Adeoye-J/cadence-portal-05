import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { formatDateTimeUtc, formatMoney } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { listStudioPayments } from "@/server/studio-reads";

export const metadata: Metadata = { title: "Payments" };

const STATUS: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: "neutral", label: "Pending" },
  paid: { tone: "done", label: "Paid" },
  failed: { tone: "critical", label: "Failed" },
};

/** Payments ledger (Stitch: payments_ledger). Owners and admins only. */
export default async function StudioPaymentsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const rows = await listStudioPayments(viewer.userId);
  if (!rows) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Payments" description="Every milestone payment across your studio's projects, newest first. Times are UTC." />
      {rows.length === 0 ? (
        <section className="rounded-card border border-dashed border-border bg-surface p-6">
          <p className="text-body-sm text-ink-muted">No payments yet.</p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-body-sm">
            <caption className="sr-only">Milestone payments</caption>
            <thead className="border-b border-border text-label-md text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Project</th>
                <th scope="col" className="px-4 py-3 font-medium">Client</th>
                <th scope="col" className="px-4 py-3 font-medium">Milestone</th>
                <th scope="col" className="px-4 py-3 font-medium">Amount</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const status = STATUS[r.status] ?? { tone: "neutral" as const, label: r.status };
                return (
                  <tr key={r.reference}>
                    <td className="px-4 py-3 text-ink">{r.projectReference}</td>
                    <td className="px-4 py-3 text-ink">{r.clientName}</td>
                    <td className="tnum px-4 py-3 text-ink">{r.milestonePosition}</td>
                    <td className="tnum px-4 py-3 font-medium text-ink">{formatMoney(r.amountMinor, r.currency)}</td>
                    <td className="px-4 py-3"><StatusChip tone={status.tone} label={status.label} /></td>
                    <td className="tnum px-4 py-3 text-ink-muted">{formatDateTimeUtc(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
