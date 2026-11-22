import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTimeUtc } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { getClientChangeRequests } from "@/server/milestones";
import { getClientProjectView } from "@/server/projects";

export const metadata: Metadata = { title: "Change requests" };

type Params = { params: Promise<{ id: string }> };

/** Change requests across the project, newest first, with the studio's replies (Stitch: project_change_requests). */
export default async function ChangeRequestsPage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const project = await getClientProjectView(viewer.userId, id);
  const requests = await getClientChangeRequests(viewer.userId, id);
  if (!project || !requests) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: `/projects/${id}`, label: "Back to project" }}
        eyebrow={`Ref ${project.reference}`}
        title="Change requests"
        description="Changes you have asked for, and the studio's replies."
      />
      {requests.length === 0 ? (
        <section className="rounded-card border border-dashed border-border bg-surface p-6">
          <p className="text-body-sm text-ink-muted">
            No change requests yet. You can ask for changes on a delivered milestone from its{" "}
            <Link href={`/projects/${id}/milestones`} className="font-medium text-primary underline-offset-4 hover:underline">milestone page</Link>.
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-4">
          {requests.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:p-6">
              <p className="tnum text-label-md text-ink-muted">
                {c.milestoneTitle} · {formatDateTimeUtc(c.createdAt)}
              </p>
              <p className="text-body-sm text-ink">{c.body}</p>
              {c.reply ? (
                <div className="flex flex-col gap-1 border-l-2 border-primary pl-3">
                  <p className="tnum text-label-md text-ink-muted">Studio reply · {formatDateTimeUtc(c.reply.repliedAt)}</p>
                  <p className="text-body-sm text-ink">{c.reply.body}</p>
                </div>
              ) : (
                <p className="text-label-md text-ink-muted">Awaiting a reply from the studio.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
