import { PROJECT_STAGES } from "@/lib/project-stages";
import type { ProposalReviewData, ReviewMilestone } from "@/components/features/proposal/review-types";
import { demoStudioContact } from "@/db/fixtures/cadence-demo";
import { formatDate, formatMoney } from "@/lib/format";
import { retainerTotals, stageIndex } from "@/lib/milestones";
import { documentDigest, type ProposalView } from "@/server/proposals";

const DAY_MS = 86_400_000;

function shortDate(iso: string): string {
  return formatDate(iso).replace(/ \d{4}$/, "");
}

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

const WAITING = "inline-flex items-center gap-1.5 rounded-full bg-waiting-subtle px-3 py-1 text-label-md text-waiting shrink-0";
const QUIET = "inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-label-md text-on-surface-variant shrink-0";

/**
 * Builds the proposal review screen's data from the real project, proposal and digest. Nothing on the screen is
 * typed in by hand except the studio contact and the design's fixed labels.
 */
export function buildReviewData({ viewerName, view }: { viewerName: string; view: ProposalView }): ProposalReviewData {
  const { project, proposal } = view;
  const totals = retainerTotals(project.milestones);
  const currency = project.currency;

  const milestones: ReviewMilestone[] = project.milestones.map((m) => {
    const waiting = m.position === 1 && m.status === "upcoming";
    return {
      code: `M${m.position}`,
      title: m.title,
      amountText: `${formatMoney(m.amountMinor, currency)} ${currency}`,
      dueLabel: m.dueDate ? formatDate(m.dueDate) : "To be agreed",
      terms: m.terms ?? "On acceptance",
      percent: totals.totalMinor > 0 ? ((m.amountMinor / totals.totalMinor) * 100).toFixed(1) : "0.0",
      statusLabel: waiting ? "Waiting on you" : "Upcoming",
      statusClass: waiting ? WAITING : QUIET,
    };
  });

  const deliverables = (proposal.deliverables ?? []).map((d) => ({
    code: d.code,
    title: d.title,
    description: d.description,
    hours: d.hours,
    reviewNote: d.reviewNote,
    targetDate: d.targetDate,
    items: d.items.map((i) => ({ title: i.title, description: i.description })),
  }));
  const totalHours = deliverables.reduce((sum, d) => sum + d.hours, 0);

  const start = proposal.startOn ?? proposal.issuedOn;
  const end = proposal.endOn ?? proposal.issuedOn;
  const days = Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS);

  const stage = stageIndex(project.stage);
  const digest = documentDigest(project, proposal);

  const firstMilestone = project.milestones.find((m) => m.position === 1);

  return {
    viewer: { name: viewerName },
    project: {
      id: project.id,
      studioName: project.studioName,
      reference: project.reference,
      title: project.title,
      clientName: project.clientName,
    },
    proposal: {
      id: proposal.id,
      version: proposal.version,
      issuedLong: longDate(proposal.issuedOn),
      digest,
      digestShort: `${digest.slice(0, 7)}...${digest.slice(-9)}`,
      termsLabel: proposal.termsLabel ?? "",
      revisionRounds: proposal.revisionRounds ?? "",
      revisionSummary: proposal.revisionSummary ?? "",
      deliverables,
    },
    studio: { contactName: demoStudioContact.name, contactEmail: demoStudioContact.email },
    money: {
      total: formatMoney(totals.totalMinor, currency),
      m1: `${formatMoney(firstMilestone?.amountMinor ?? 0, currency)} ${currency}`,
    },
    window: { start: shortDate(start), end: shortDate(end), range: `${shortDate(start)} – ${shortDate(end)}`, days },
    totalHours,
    stageText: `Stage ${stage + 1} of ${PROJECT_STAGES.length}: ${PROJECT_STAGES[stage] ?? ""}`,
    milestones,
    links: {
      review: `/proposals/${proposal.id}`,
      sign: `/proposals/${proposal.id}/sign`,
      print: `/proposals/${proposal.id}/print`,
      preWork: `/projects/${project.id}/pre-work`,
      payments: "/payments",
    },
  };
}
