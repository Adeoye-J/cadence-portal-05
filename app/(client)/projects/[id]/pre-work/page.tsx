import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/cn";
import { getViewer } from "@/lib/session";
import { getClientProjectView, listClientProjects } from "@/server/projects";

export const metadata: Metadata = { title: "Before work starts" };

type Params = { params: Promise<{ id: string }> };

/** Before the first milestone is paid (Stitch: client_project_pre_work_state). Once work starts, this page leads to the project. */
export default async function PreWorkPage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const project = await getClientProjectView(viewer.userId, id);
  if (!project) notFound();
  if (project.stage !== "proposal" && project.stage !== "signed") redirect(`/projects/${id}`);

  const openProposal = (await listClientProjects(viewer.userId)).find((p) => p.id === id)?.openProposalId ?? null;
  const first = project.milestones.find((m) => m.position === 1);
  const signed = project.stage === "signed";
  const paid = first ? ["in_progress", "delivered", "approved"].includes(first.status) : false;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: `/projects/${id}`, label: "Back to project" }}
        eyebrow={`Ref ${project.reference}`}
        title="Before work starts"
        description="Work on this project begins once the proposal is signed and the first milestone is paid."
      />
      <ol className="flex flex-col gap-4">
        <li className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-headline-sm text-ink">1. Review and sign the proposal</h2>
            <StatusChip tone={signed ? "done" : "waiting"} label={signed ? "Signed" : "To do"} />
          </div>
          {!signed && openProposal ? (
            <Link href={`/proposals/${openProposal}`} className={cn(buttonVariants({ variant: "primary" }), "w-fit")}>
              Review and sign
            </Link>
          ) : null}
        </li>
        <li className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-headline-sm text-ink">2. Pay milestone 1</h2>
            <StatusChip tone={paid ? "done" : signed ? "waiting" : "neutral"} label={paid ? "Paid" : signed ? "Payment due" : "Not yet"} />
          </div>
          {signed && !paid ? (
            <Link href={`/projects/${id}`} className={cn(buttonVariants({ variant: "primary" }), "w-fit")}>
              Go to payment
            </Link>
          ) : null}
        </li>
        <li className="rounded-card border border-border bg-surface p-4 sm:p-6">
          <h2 className="text-headline-sm text-ink">3. Work starts</h2>
          <p className="mt-2 text-body-sm text-ink-muted">The studio begins the first milestone when its payment settles.</p>
        </li>
      </ol>
    </main>
  );
}
