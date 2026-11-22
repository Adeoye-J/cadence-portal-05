import { listEvents } from "@/server/events";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SendProposalButton } from "@/components/features/studio/send-proposal-button";
import { PageHeader } from "@/components/layout/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { canWrite } from "@/lib/authz";
import { formatBytes, formatDate, formatDateTimeUtc, formatMoney } from "@/lib/format";
import { retainerTotals, stageLabel } from "@/lib/milestones";
import { getViewer } from "@/lib/session";
import { DeliverMilestoneButton } from "@/components/features/studio/deliver-button";
import { FileUpload } from "@/components/features/studio/file-upload";
import { DeleteFileButton } from "@/components/features/studio/delete-file-button";
import { ChangeRequestReply } from "@/components/features/studio/change-request-reply";
import { InviteClientForm } from "@/components/features/studio/invite-client-form";
import { listInvitations } from "@/server/invitations";
import { listProjectChangeRequests } from "@/server/milestones";
import { listMilestoneFiles } from "@/server/files";
import { getStudioProject } from "@/server/studio";

export const metadata: Metadata = { title: "Project" };

type Params = { params: Promise<{ id: string }> };

/** Studio project detail: proposal state, milestones, and the send action for drafts. */
export default async function StudioProjectPage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");

  const detail = await getStudioProject(viewer.userId, id);
  if (!detail) notFound();
  const { project, proposal, membership } = detail;
  const writable = canWrite(membership.role);
  const total = formatMoney(retainerTotals(project.milestones).totalMinor, project.currency);
  const hasContact = project.contactUserIds.length > 0;
  const invitations = await listInvitations(project.id);
  const events = await listEvents(project.id, "studio");
  const changeRequests = await listProjectChangeRequests(project.id);
  const filesByPosition = new Map(
    await Promise.all(project.milestones.map(async (m) => [m.position, await listMilestoneFiles(project.id, m.position)] as const)),
  );

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: "/studio/projects", label: "Back to projects" }}
        eyebrow={`Ref ${project.reference}`}
        title={project.title}
        description={`${project.clientName} · ${stageLabel(project.stage)} · ${total}`}
      />

      <section aria-labelledby="proposal-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 id="proposal-heading" className="text-headline-sm text-ink">Proposal</h2>
        {!proposal ? (
          <p className="text-body-sm text-ink-muted">No proposal yet.</p>
        ) : proposal.status === "draft" ? (
          <div className="flex flex-col gap-3">
            <StatusChip tone="neutral" label="Draft, not sent" />
            {writable ? (
              hasContact ? (
                <SendProposalButton projectId={project.id} />
              ) : (
                <p className="text-body-sm text-ink-muted">
                  Invite the client below, then send the proposal.
                </p>
              )
            ) : (
              <p className="text-body-sm text-ink-muted">Your role can view this draft but cannot send it.</p>
            )}
          </div>
        ) : proposal.status === "sent" ? (
          <div className="flex flex-col gap-2">
            <StatusChip tone="waiting" label="Waiting for client signature" />
            <p className="tnum text-body-sm text-ink-muted">
              Version {proposal.version}, issued {formatDate(proposal.issuedOn)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <StatusChip tone="done" label="Signed" />
            <p className="tnum text-body-sm text-ink-muted">Version {proposal.version}</p>
          </div>
        )}
      </section>

      <section aria-labelledby="access-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 id="access-heading" className="text-headline-sm text-ink">Client access</h2>
        <p className="text-body-sm text-ink-muted">
          {project.contactUserIds.length === 1 ? "1 client contact" : `${project.contactUserIds.length} client contacts`} can view this project.
        </p>
        {writable ? <InviteClientForm projectId={project.id} /> : null}
        {invitations.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {invitations.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-body-sm">
                <span className="text-ink">{row.email}</span>
                <span className="tnum text-label-md text-ink-muted">
                  {row.status === "pending" ? "Waiting to accept" : row.status === "accepted" ? "Accepted" : row.status === "expired" ? "Expired" : "Revoked"} · sent {formatDate(row.createdAt.slice(0, 10))}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {changeRequests.length > 0 ? (
        <section aria-labelledby="changes-heading" className="flex flex-col gap-4">
          <h2 id="changes-heading" className="text-headline-md text-ink">Change requests</h2>
          <ul className="flex flex-col gap-3">
            {changeRequests.map((c) => (
              <ChangeRequestReply
                key={c.id}
                projectId={project.id}
                changeRequestId={c.id}
                body={c.body}
                createdAt={formatDateTimeUtc(c.createdAt)}
                reply={c.reply ? { body: c.reply.body, repliedAt: formatDateTimeUtc(c.reply.repliedAt) } : undefined}
                writable={writable}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="activity-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 id="activity-heading" className="text-headline-sm text-ink">Activity</h2>
        {events.length === 0 ? (
          <p className="text-body-sm text-ink-muted">No activity yet.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {events.map((e) => (
              <li key={e.seq} className="flex flex-col gap-1 py-3">
                <p className="tnum text-label-md text-ink-muted">{formatDateTimeUtc(e.at)} · {e.clientVisible ? "Visible to client" : "Studio only"}</p>
                <p className="text-body-sm text-ink">{e.summary}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="milestones-heading" className="flex flex-col gap-4">
        <h2 id="milestones-heading" className="text-headline-md text-ink">Milestones</h2>
        <ol className="flex flex-col gap-3">
          {project.milestones.map((m) => (
            <li key={m.position} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="tnum text-label-md text-ink-muted">
                  Milestone {m.position}
                  {m.dueDate ? ` · due ${formatDate(m.dueDate)}` : ""}
                </p>
                <p className="text-body-sm font-medium text-ink">{m.title}</p>
                {(filesByPosition.get(m.position) ?? []).map((f) => (
                  <div key={f.id} className="flex flex-wrap items-center gap-3">
                    <p className="text-label-md text-ink-muted">{f.filename} · {formatBytes(f.size)}</p>
                    {writable && m.status !== "approved" ? <DeleteFileButton projectId={project.id} fileId={f.id} filename={f.filename} /> : null}
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="tnum text-body-sm font-medium text-ink">{formatMoney(m.amountMinor, project.currency)}</p>
                {writable && m.status === "in_progress" ? <DeliverMilestoneButton projectId={project.id} position={m.position} /> : null}
                {writable && m.status === "in_progress" ? <FileUpload projectId={project.id} position={m.position} /> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
