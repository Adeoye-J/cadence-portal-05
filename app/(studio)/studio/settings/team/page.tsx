import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getViewer } from "@/lib/session";
import { listStudioMembers } from "@/server/studio-reads";

export const metadata: Metadata = { title: "Team" };

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

/**
 * Team and access roles (Stitch: team_roles). Read-only for now: inviting members and changing roles
 * are not built, and the page says so instead of showing controls that do nothing.
 */
export default async function StudioTeamPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const members = await listStudioMembers(viewer.userId);
  if (!members) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Team"
        description="Who has access to this studio, and what each role can do."
      />
      <section aria-labelledby="members-heading" className="flex flex-col gap-4">
        <h2 id="members-heading" className="sr-only">Members</h2>
        <ul className="divide-y divide-border rounded-card border border-border bg-surface">
          {members.map((m, i) => (
            <li key={`${m.role}-${i}`} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-body-sm text-ink">{m.contact}</p>
              <p className="text-label-md text-ink-muted">{ROLE_LABEL[m.role] ?? m.role}</p>
            </li>
          ))}
        </ul>
        <div className="rounded-card border border-border bg-surface p-4 text-body-sm text-ink-muted">
          <p className="font-medium text-ink">What the roles can do</p>
          <ul className="mt-2 list-disc pl-5">
            <li>Owners and admins see payments and can write everything a member can.</li>
            <li>Members create proposals, send them, deliver milestones and upload files.</li>
            <li>Viewers read the studio&apos;s projects and clients, and change nothing.</li>
          </ul>
          <p className="mt-3">Inviting team members and changing roles are not available yet.</p>
        </div>
      </section>
    </main>
  );
}
