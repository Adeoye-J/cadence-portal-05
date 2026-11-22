import { routeTo } from "@/lib/routes";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/features/proposal/print-button";
import { buildReviewData } from "@/server/proposal-review";
import { getViewer } from "@/lib/session";
import { formatMoney } from "@/lib/format";
import { getProposalView } from "@/server/proposals";

export const metadata: Metadata = { title: "Proposal copy" };

type Params = { params: Promise<{ id: string }> };

/** A printable copy of the proposal. Saved as PDF from the browser, so no PDF library is needed. */
export default async function ProposalPrintPage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/log-in?next=/proposals/${id}/print`);
  const view = await getProposalView(viewer.userId, id);
  if (!view) notFound();
  const d = buildReviewData({ viewerName: viewer.name ?? viewer.email, view });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 text-on-surface print:max-w-none print:p-0">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link href={routeTo(d.links.review)} className="text-body-sm-medium text-primary hover:underline">Back to the proposal</Link>
        <PrintButton />
      </div>

      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="text-label-md uppercase tracking-wider text-on-surface-variant">Ref {d.project.reference} · Version {d.proposal.version} · Issued {d.proposal.issuedLong}</p>
        <h1 className="text-headline-xl tracking-tight">{d.project.title}</h1>
        <p className="text-body-sm text-on-surface-variant">Prepared by {d.project.studioName} for {d.project.clientName}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md">Payment schedule</h2>
        <table className="w-full text-body-sm">
          <thead className="text-left text-label-md uppercase tracking-wider text-on-surface-variant">
            <tr><th className="py-2">Milestone</th><th>Due</th><th>Terms</th><th className="text-right">Amount</th></tr>
          </thead>
          <tbody>
            {d.milestones.map((m) => (
              <tr key={m.code} className="border-t border-border">
                <td className="py-2">{m.code} · {m.title}</td>
                <td>{m.dueLabel}</td>
                <td>{m.terms}</td>
                <td className="text-right tabular-nums">{m.amountText}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-body-sm-medium">Total {d.money.total}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-headline-md">Deliverables</h2>
        {d.proposal.deliverables.map((del) => (
          <article key={del.code} className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="text-label-md uppercase tracking-wider text-on-surface-variant">{del.code} · {del.hours > 0 ? `${del.hours} billable hours` : "Fixed fee"} · Target {del.targetDate}</p>
            <h3 className="text-headline-sm">{del.title}</h3>
            <p className="text-body-sm text-on-surface-variant">{del.description}</p>
            <ul className="ml-4 list-disc text-body-sm">
              {del.items.map((item) => (
                <li key={item.title}><span className="text-on-surface">{item.title}.</span> {item.description}</li>
              ))}
            </ul>
            <p className="text-label-md text-on-surface-variant">{del.reviewNote}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-6">
        <h2 className="text-headline-md">Terms</h2>
        <p className="text-body-sm">{d.proposal.termsLabel}. {d.proposal.revisionRounds}. {d.proposal.revisionSummary}.</p>
        <p className="text-body-sm">Contract window {d.window.range} ({d.window.days} days).</p>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-6">
        <h2 className="text-headline-md">Fingerprint of these terms</h2>
        <p className="break-all font-mono text-label-sm text-on-surface-variant">SHA-256 {d.proposal.digest}</p>
        <p className="text-label-sm text-on-surface-variant">The fingerprint covers the reference, version, milestones, amounts, deliverables and dates in this copy.</p>
      </section>
      <p className="text-label-sm text-on-surface-variant">Total of milestones: {formatMoney(view.project.milestones.reduce((a, m) => a + m.amountMinor, 0), view.project.currency)}.</p>
    </main>
  );
}
