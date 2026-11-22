import { routeTo } from "@/lib/routes";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { formatMoney } from "@/lib/format";
import { retainerTotals } from "@/lib/milestones";
import { getViewer } from "@/lib/session";
import { getProposalView } from "@/server/proposals";
import { SignForm } from "./sign-form";

export const metadata: Metadata = { title: "Sign proposal" };

type Params = { params: Promise<{ id: string }> };

/** Sign-off by typed name (Stitch: sign_off, sign_off_desktop). */
export default async function SignProposalPage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");

  const view = await getProposalView(viewer.userId, id);
  if (!view) notFound();
  if (view.signature) redirect(`/proposals/${id}/signed`);

  const { project } = view;
  const total = formatMoney(retainerTotals(project.milestones).totalMinor, project.currency);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: routeTo(`/proposals/${id}`), label: "Back to proposal" }}
        eyebrow={`Ref ${project.reference}`}
        title="Review and sign"
        description="Read the terms, type your full name and confirm. Your name and the time are recorded with a fingerprint of the terms you signed."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="summary-heading" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-6">
          <h2 id="summary-heading" className="text-headline-sm text-ink">What you are signing</h2>
          <p className="text-body-sm text-ink">
            {project.title}, {project.milestones.length} milestones, total{" "}
            <span className="tnum font-medium">{total}</span>. Milestone 1 falls due when you sign.{" "}
            <Link href={`/proposals/${id}`} className="font-medium text-primary underline-offset-4 hover:underline">
              Review the full scope
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="sign-heading" className="rounded-card border border-border bg-surface p-4 sm:p-6">
          <h2 id="sign-heading" className="text-headline-sm text-ink">Sign</h2>
          <div className="mt-4">
            <SignForm proposalId={id} />
          </div>
        </section>
      </div>
    </main>
  );
}
