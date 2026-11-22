import { routeTo } from "@/lib/routes";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTimeUtc } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { getClientProjectView } from "@/server/projects";
import type { EventActor } from "@/server/event-types";
import { listEvents } from "@/server/events";

export const metadata: Metadata = { title: "Activity" };

type Params = { params: Promise<{ id: string }> };

const ACTOR_LABEL: Record<EventActor, string> = {
  studio: "Studio",
  client: "Client contact",
  system: "System",
};

/** Client activity timeline (Stitch: project_timeline). Shows only client-visible events. */
export default async function ClientTimelinePage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");

  const project = await getClientProjectView(viewer.userId, id);
  if (!project) notFound();

  const events = await listEvents(id, "client");

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: routeTo(`/projects/${id}`), label: "Back to project" }}
        eyebrow={`Ref ${project.reference}`}
        title="Activity"
        description="Each step on this project, newest first. Times are UTC."
      />

      {events.length === 0 ? (
        <section className="rounded-card border border-dashed border-border bg-surface p-6">
          <p className="text-body-sm text-ink-muted">Nothing has happened on this project yet.</p>
        </section>
      ) : (
        <ol className="flex flex-col gap-3">
          {events.map((e) => (
            <li key={e.seq} className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
              <p className="tnum text-label-md text-ink-muted">
                {formatDateTimeUtc(e.at)} · {ACTOR_LABEL[e.actor]}
              </p>
              <p className="text-body-sm text-ink">{e.summary}</p>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
