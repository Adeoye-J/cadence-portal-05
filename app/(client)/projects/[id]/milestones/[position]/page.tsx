import { routeTo } from "@/lib/routes";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReviewPanel } from "@/components/features/milestones/review-panel";
import { PageHeader } from "@/components/layout/page-header";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { formatBytes, formatDateTimeUtc, formatMoney } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { getClientMilestone } from "@/server/milestones";
import { listMilestoneFiles } from "@/server/files";
import { DownloadButton } from "@/components/features/milestones/download-button";

export const metadata: Metadata = { title: "Milestone" };

type Params = { params: Promise<{ id: string; position: string }> };

const STATUS: Record<string, { tone: StatusTone; label: string }> = {
  upcoming: { tone: "neutral", label: "Upcoming" },
  payment_due: { tone: "waiting", label: "Payment due" },
  in_progress: { tone: "neutral", label: "In progress" },
  delivered: { tone: "waiting", label: "Ready for your review" },
  approved: { tone: "done", label: "Approved" },
};

/** Milestone detail with review (Stitch: milestone_detail_*, change_request_review, deliverable_review). */
export default async function ClientMilestonePage({ params }: Params) {
  const { id, position: rawPosition } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");

  const position = Number(rawPosition);
  if (!Number.isInteger(position) || position < 1) notFound();

  const view = await getClientMilestone(viewer.userId, id, position);
  const files = await listMilestoneFiles(id, position);
  if (!view) notFound();
  const { project, milestone, changeRequests } = view;
  const status = STATUS[milestone.status] ?? { tone: "neutral" as const, label: milestone.status };

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: routeTo(`/projects/${id}`), label: "Back to project" }}
        eyebrow={`Milestone ${position} of ${project.milestones.length} · ${formatMoney(milestone.amountMinor, project.currency)}`}
        title={milestone.title}
        description={milestone.description}
      />

      <div className="flex flex-col gap-3">
        <StatusChip tone={status.tone} label={status.label} />
        {milestone.status === "payment_due" ? (
          <p className="text-body-sm text-ink-muted">Pay this milestone from the project page to start its work.</p>
        ) : null}
      </div>

      {files.length > 0 ? (
        <section aria-labelledby="deliverables-heading" className="flex flex-col gap-4">
          <h2 id="deliverables-heading" className="text-headline-sm text-ink">Deliverables</h2>
          <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
            {files.map((f) => (
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
      ) : null}

      {milestone.status === "delivered" ? <ReviewPanel projectId={id} position={position} /> : null}

      {changeRequests.length > 0 ? (
        <section aria-labelledby="changes-heading" className="flex flex-col gap-4">
          <h2 id="changes-heading" className="text-headline-sm text-ink">Change requests</h2>
          <ul className="flex flex-col gap-3">
            {changeRequests.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
                <p className="tnum text-label-md text-ink-muted">{formatDateTimeUtc(c.createdAt)}</p>
                <p className="text-body-sm text-ink">{c.body}</p>
                {c.reply ? (
                  <div className="flex flex-col gap-1 border-l-2 border-primary pl-3">
                    <p className="tnum text-label-md text-ink-muted">Studio reply · {formatDateTimeUtc(c.reply.repliedAt)}</p>
                    <p className="text-body-sm text-ink">{c.reply.body}</p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
