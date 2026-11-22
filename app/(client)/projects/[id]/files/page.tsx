import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DownloadButton } from "@/components/features/milestones/download-button";
import { PageHeader } from "@/components/layout/page-header";
import { formatBytes } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { getClientFiles } from "@/server/client-reads";

export const metadata: Metadata = { title: "Files" };

type Params = { params: Promise<{ id: string }> };

/** Every deliverable on a project, grouped by milestone (Stitch: client_files, project_files). */
export default async function ProjectFilesPage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const view = await getClientFiles(viewer.userId, id);
  if (!view) notFound();
  const total = view.byMilestone.reduce((n, m) => n + m.files.length, 0);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: `/projects/${id}`, label: "Back to project" }}
        eyebrow={`Ref ${view.project.reference}`}
        title="Files"
        description={total === 0 ? "No deliverables have been added yet." : `${total} ${total === 1 ? "file" : "files"} across the project.`}
      />
      {view.byMilestone.map((group) =>
        group.files.length === 0 ? null : (
          <section key={group.position} aria-labelledby={`m${group.position}`} className="flex flex-col gap-3">
            <h2 id={`m${group.position}`} className="text-headline-sm text-ink">
              Milestone {group.position}: {group.title}
            </h2>
            <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
              {group.files.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate text-body-sm font-medium text-ink">{f.filename}</p>
                    <p className="tnum text-label-md text-ink-muted">{formatBytes(f.size)}</p>
                  </div>
                  <DownloadButton projectId={id} fileId={f.id} filename={f.filename} />
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
    </main>
  );
}
