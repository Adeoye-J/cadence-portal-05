/** Everything the proposal review screen shows, prepared on the server. Expressions in the design bind to these fields. */

export type ReviewItem = { title: string; description: string };

export type ReviewDeliverable = {
  code: string;
  title: string;
  description: string;
  hours: number;
  reviewNote: string;
  targetDate: string;
  items: ReviewItem[];
};

export type ReviewMilestone = {
  code: string;
  title: string;
  amountText: string;
  dueLabel: string;
  terms: string;
  percent: string;
  statusLabel: string;
  statusClass: string;
};

export type ProposalReviewData = {
  viewer: { name: string };
  project: { id: string; studioName: string; reference: string; title: string; clientName: string };
  proposal: {
    id: string;
    version: number;
    issuedLong: string;
    digest: string;
    digestShort: string;
    termsLabel: string;
    revisionRounds: string;
    revisionSummary: string;
    deliverables: ReviewDeliverable[];
  };
  studio: { contactName: string; contactEmail: string };
  money: { total: string; m1: string };
  window: { start: string; end: string; range: string; days: number };
  totalHours: number;
  stageText: string;
  milestones: ReviewMilestone[];
  links: { review: string; sign: string; print: string; preWork: string; payments: string };
};
