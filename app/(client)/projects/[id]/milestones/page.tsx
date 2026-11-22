import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { MilestoneCard } from "@/components/features/projects/milestone-card";
import { getViewer } from "@/lib/session";
import { getClientProjectView } from "@/server/projects";

export const metadata: Metadata = { title: "Milestones" };

type Params = { params: Promise<{ id: string }> };

/** All milestones on a project, in order (Stitch: milestones). Each card opens its review page. */
export default async function MilestonesPage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const project = await getClientProjectView(viewer.userId, id);
  if (!project) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: `/projects/${id}`, label: "Back to project" }}
        eyebrow={`Ref ${project.reference}`}
        title="Milestones"
        description={`${project.milestones.length} milestones, in order.`}
      />
      <ol className="flex flex-col gap-4">
        {project.milestones.map((m) => (
          <MilestoneCard key={m.position} milestone={m} currency={project.currency} projectId={project.id} />
        ))}
      </ol>
    </main>
  );
}
