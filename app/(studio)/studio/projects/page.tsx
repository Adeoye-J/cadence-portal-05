import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { canWrite } from "@/lib/authz";
import { formatMoney } from "@/lib/format";
import { stageLabel } from "@/lib/milestones";
import { getViewer } from "@/lib/session";
import { getStudioMembership, listStudioProjects } from "@/server/studio";

export const metadata: Metadata = { title: "Projects" };

/** Studio projects dashboard (Stitch: projects_dashboard). Covers the empty and populated states. */
export default async function StudioProjectsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");

  const rows = await listStudioProjects(viewer.userId);
  const membership = await getStudioMembership(viewer.userId);
  if (!rows || !membership) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Projects"
        description={`Projects for ${membership.studioName}.`}
        actions={
          canWrite(membership.role) ? (
            <Link href="/studio/projects/new" className={buttonVariants({ variant: "primary" })}>
              New proposal
            </Link>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <section aria-labelledby="empty-heading" className="flex flex-col gap-3 rounded-card border border-dashed border-border bg-surface p-6">
          <h2 id="empty-heading" className="text-headline-sm text-ink">No projects yet</h2>
          <p className="text-body-sm text-ink-muted">Projects appear here once a proposal is sent to a client.</p>
        </section>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="tnum text-label-md text-ink-muted">Ref {row.reference}</p>
                {row.awaitingPayment ? <StatusChip tone="waiting" label="Awaiting payment" /> : null}
              </div>
              <h2 className="text-headline-sm text-ink">
                <Link href={`/studio/projects/${row.id}`} className="underline-offset-4 hover:underline">
                  {row.title}
                </Link>
              </h2>
              <p className="text-body-sm text-ink-muted">
                {row.clientName} · {stageLabel(row.stage)}
              </p>
              <p className="text-body-sm text-ink-muted">
                Remaining <span className="tnum font-medium text-ink">{formatMoney(row.remainingMinor, row.currency)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
