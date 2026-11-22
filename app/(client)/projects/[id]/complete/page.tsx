import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { getClientFiles } from "@/server/client-reads";
import { getClientProjectView } from "@/server/projects";

export const metadata: Metadata = { title: "Project complete" };

type Params = { params: Promise<{ id: string }> };

/**
 * Handover (Stitch: project_complete_*). Shows what was delivered and approved. Until every milestone is
 * approved, the page says the project is not complete yet.
 */
export default async function ProjectCompletePage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const project = await getClientProjectView(viewer.userId, id);
  const files = await getClientFiles(viewer.userId, id);
  if (!project || !files) notFound();

  const done = project.stage === "completed" || project.stage === "closed";
  if (!done) {
    return (
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader back={{ href: `/projects/${id}`, label: "Back to project" }} title="Not complete yet" description="The handover page opens once every milestone is approved." />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: `/projects/${id}`, label: "Back to project" }}
        eyebrow={`Ref ${project.reference}`}
        title="Project complete"
        description={`${project.studioName} for ${project.clientName}.`}
      />
      <section aria-labelledby="manifest-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="manifest-heading" className="text-headline-sm text-ink">Milestones delivered</h2>
          <StatusChip tone="done" label="Complete" />
        </div>
        <ol className="flex flex-col divide-y divide-border">
          {project.milestones.map((m) => (
            <li key={m.position} className="flex flex-wrap items-center justify-between gap-2 py-3 text-body-sm">
              <span className="text-ink">{m.position}. {m.title}</span>
              <span className="tnum text-ink-muted">{formatMoney(m.amountMinor, project.currency)}</span>
            </li>
          ))}
        </ol>
        <p className="text-body-sm text-ink-muted">
          {files.byMilestone.reduce((n, g) => n + g.files.length, 0)} deliverable files are on the{" "}
          <Link href={`/projects/${id}/files`} className="font-medium text-primary underline-offset-4 hover:underline">files page</Link>.
        </p>
        <Link href={`/projects/${id}/timeline`} className={cn(buttonVariants({ variant: "secondary" }), "w-fit")}>
          View the activity record
        </Link>
      </section>
    </main>
  );
}
