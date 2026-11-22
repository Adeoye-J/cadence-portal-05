import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MilestoneStepper } from "@/components/ui/milestone-stepper";
import { PayMilestoneButton } from "@/components/features/payments/pay-milestone-button";
import { PageHeader } from "@/components/layout/page-header";
import { MilestoneCard } from "@/components/features/projects/milestone-card";
import { getViewer } from "@/lib/session";
import { getClientProjectView } from "@/server/projects";
import { formatDate, formatMoney } from "@/lib/format";
import { retainerTotals, stageIndex, stageLabel } from "@/lib/milestones";

export const metadata: Metadata = { title: "Project" };

type Params = { params: Promise<{ id: string }> };

/** Client project home (Stitch: client_project_home, client_project_home_desktop). */
export default async function ClientProjectPage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  // /log-in is not built yet, so this redirect currently ends in the 404 page.
  if (!viewer) redirect("/log-in");

  const project = await getClientProjectView(viewer.userId, id);
  if (!project) notFound();

  const { currency, milestones } = project;
  const next = milestones.find((m) => m.status === "payment_due");
  const totals = retainerTotals(milestones);
  const index = stageIndex(project.stage);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={`Ref ${project.reference}`}
        title={project.title}
        description={`${project.studioName} for ${project.clientName}`}
        actions={
          <Link href={`/projects/${project.id}/timeline`} className={buttonVariants({ variant: "secondary" })}>
            Activity
          </Link>
        }
      />

      <nav aria-label="Project sections" className="flex flex-wrap gap-2">
        {project.stage === "proposal" || project.stage === "signed" ? (
          <Link href={`/projects/${project.id}/pre-work`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Before work starts</Link>
        ) : null}
        <Link href={`/projects/${project.id}/milestones`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Milestones</Link>
        <Link href={`/projects/${project.id}/files`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Files</Link>
        <Link href={`/projects/${project.id}/changes`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Change requests</Link>
        {project.stage === "completed" || project.stage === "closed" ? (
          <Link href={`/projects/${project.id}/complete`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Handover</Link>
        ) : null}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="lifecycle-heading" className="rounded-card border border-border bg-surface p-4 sm:p-6">
            <div className="flex flex-col gap-1">
              <h2 id="lifecycle-heading" className="text-headline-sm text-ink">Lifecycle</h2>
              <p className="text-body-sm text-ink-muted">
                Stage {index + 1} of 6: {stageLabel(project.stage)}
              </p>
            </div>
            <MilestoneStepper className="mt-6" currentIndex={index} />
          </section>

          <section aria-labelledby="milestones-heading" className="flex flex-col gap-4">
            <h2 id="milestones-heading" className="text-headline-md text-ink">Milestones</h2>
            <ol className="flex flex-col gap-4">
              {milestones.map((m) => (
                <MilestoneCard key={m.position} milestone={m} currency={currency} projectId={project.id} />
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          {next ? (
            <section
              aria-labelledby="action-heading"
              className="order-first flex flex-col gap-4 rounded-card border border-waiting-border bg-waiting-subtle p-4 sm:p-6 lg:order-none"
            >
              <h2 id="action-heading" className="text-headline-sm text-waiting">Action required</h2>
              <p className="text-body-sm text-ink">
                Pay milestone {next.position} to start its work: <span className="tnum font-medium">{formatMoney(next.amountMinor, currency)}</span>
                {next.dueDate ? <> · due <span className="tnum">{formatDate(next.dueDate)}</span></> : null}
              </p>
              <PayMilestoneButton projectId={project.id} position={next.position} label={`Pay ${formatMoney(next.amountMinor, currency)}`} />
            </section>
          ) : null}

          <section aria-labelledby="retainer-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
            <h2 id="retainer-heading" className="text-headline-sm text-ink">Retainer</h2>
            <dl className="flex flex-col gap-3 text-body-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Total</dt>
                <dd className="tnum font-medium text-ink">{formatMoney(totals.totalMinor, currency)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Paid</dt>
                <dd className="tnum font-medium text-ink">{formatMoney(totals.paidMinor, currency)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-3">
                <dt className="text-ink-muted">Remaining</dt>
                <dd className="tnum font-medium text-ink">{formatMoney(totals.remainingMinor, currency)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </main>
  );
}
