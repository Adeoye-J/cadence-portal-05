import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProposalReviewDesign } from "@/components/features/proposal/review-design";
import { getViewer } from "@/lib/session";
import { buildReviewData } from "@/server/proposal-review";
import { getProposalView } from "@/server/proposals";

export const metadata: Metadata = { title: "Review proposal" };

type Params = { params: Promise<{ id: string }> };

/** Proposal review (design: proposal_review_desktop). Real terms, totals and fingerprint; notes and change requests are saved. */
export default async function ProposalReviewPage({ params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/log-in?next=/proposals/${id}`);

  const view = await getProposalView(viewer.userId, id);
  if (!view) notFound();
  if (view.signature) redirect(`/proposals/${id}/signed`);

  const data = buildReviewData({ viewerName: viewer.name ?? viewer.email, view });
  return (
    <div className="min-h-dvh bg-canvas">
      <ProposalReviewDesign data={data} />
    </div>
  );
}
