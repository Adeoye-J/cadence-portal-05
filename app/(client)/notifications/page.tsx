import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTimeUtc } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { listViewerNotifications } from "@/server/client-reads";

export const metadata: Metadata = { title: "Notifications" };

/**
 * Notification centre (Stitch: notification_centre). Shows the client-visible activity across the viewer's
 * projects. Read state is not tracked yet, so every item is shown as it is.
 */
export default async function NotificationsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const items = await listViewerNotifications(viewer.userId);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Notifications" description="Recent activity on your projects, newest first. Times are UTC." />
      {items.length === 0 ? (
        <section className="rounded-card border border-dashed border-border bg-surface p-6">
          <p className="text-body-sm text-ink-muted">Nothing new yet. Activity on your projects will appear here.</p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((n) => (
            <li key={`${n.projectId}-${n.seq}`} className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
              <p className="tnum text-label-md text-ink-muted">
                {formatDateTimeUtc(n.at)} · {n.projectTitle}
              </p>
              <p className="text-body-sm text-ink">{n.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
