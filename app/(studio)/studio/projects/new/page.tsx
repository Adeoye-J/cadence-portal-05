import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getViewer } from "@/lib/session";
import { getStudioMembership } from "@/server/studio";
import { canWrite } from "@/lib/authz";
import { NewProposalForm } from "./new-proposal-form";

export const metadata: Metadata = { title: "New proposal" };

/** Proposal builder (Stitch: proposal_builder). Viewers see a 404 here rather than a form they cannot submit. */
export default async function NewProposalPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const membership = await getStudioMembership(viewer.userId);
  if (!membership) notFound();
  if (!canWrite(membership.role)) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: "/studio/projects", label: "Back to projects" }}
        title="New proposal"
        description="Set the scope, the milestones and their amounts. The draft stays private until you send it to the client."
      />
      <div className="max-w-3xl">
        <NewProposalForm />
      </div>
    </main>
  );
}
