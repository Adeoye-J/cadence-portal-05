import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { stageLabel } from "@/lib/milestones";
import { getViewer } from "@/lib/session";
import { listClientProjects } from "@/server/projects";

export const metadata: Metadata = { title: "Projects" };

/** Signed-in landing page for clients. Shows the four data states: empty here, populated otherwise. */
export default async function ProjectsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");

  const projects = await listClientProjects(viewer.userId);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Projects" description="Projects you can view as a client contact." />

      {projects.length === 0 ? (
        <section aria-labelledby="empty-heading" className="flex flex-col gap-3 rounded-card border border-dashed border-border bg-surface p-6">
          <h2 id="empty-heading" className="text-headline-sm text-ink">No projects yet</h2>
          <p className="text-body-sm text-ink-muted">
            Your studio will share a proposal with you. You will get an email when it is ready to review.
          </p>
        </section>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:p-6">
              <p className="tnum text-label-md text-ink-muted">Ref {p.reference}</p>
              <h2 className="text-headline-sm text-ink">{p.title}</h2>
              <p className="text-body-sm text-ink-muted">
                {p.studioName} · Stage: {stageLabel(p.stage)}
              </p>
              <Link
                href={p.openProposalId ? `/proposals/${p.openProposalId}` : `/projects/${p.id}`}
                className={buttonVariants({ variant: "secondary" })}
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
