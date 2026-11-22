/**
 * DEVELOPMENT FIXTURE. Values come from the Stitch screens.
 * Used until the Drizzle repository is wired. Never imported by production
 * components or by any code path that runs when NODE_ENV is "production".
 */
import type { DeliverableRecord, MilestoneRecord, ProjectRecord, ProposalRecord } from "@/server/core/types";

export type FixtureMilestone = MilestoneRecord;
export type FixtureProject = ProjectRecord;
export type FixtureDeliverable = DeliverableRecord;
export type FixtureProposal = ProposalRecord;

export const demoViewerId = "usr_demo_sofia_marin";

export const demoProjects: FixtureProject[] = [
  {
    id: "prj_cad_2026_089",
    studioId: "stu_lumen",
    reference: "CAD-2026-089",
    title: "Brand identity and website",
    studioName: "Lumen Studio",
    clientName: "Apex Holdings LLC",
    currency: "USD",
    stage: "in_progress",
    contactUserIds: [demoViewerId],
    milestones: [
      { position: 1, title: "Brand strategy and discovery", amountMinor: 180000, status: "approved", dueDate: "2026-11-18" },
      { position: 2, title: "Website design and UX", amountMinor: 240000, status: "payment_due", dueDate: "2026-11-20" },
      { position: 3, title: "Production storefront build", amountMinor: 180000, status: "upcoming", dueDate: "2026-12-12" },
    ],
  },
  {
    id: "prj_cad_2026_090",
    studioId: "stu_lumen",
    reference: "CAD-2026-090",
    title: "Brand identity and website",
    studioName: "Lumen Studio",
    clientName: "Apex Holdings LLC",
    currency: "USD",
    stage: "proposal",
    contactUserIds: [demoViewerId],
    milestones: [
      {
        position: 1,
        title: "Brand Strategy & Discovery",
        dueDate: "2026-11-20",
        terms: "Before start",
        description: "Due immediately on counter-signature.",
        amountMinor: 180000,
        status: "upcoming",
      },
      {
        position: 2,
        title: "Storefront UX & Prototype",
        dueDate: "2026-12-05",
        terms: "On acceptance",
        description: "Approved design system and a clickable high-fidelity interactive prototype.",
        amountMinor: 240000,
        status: "upcoming",
      },
      {
        position: 3,
        title: "Production Deployment",
        dueDate: "2026-12-20",
        terms: "On acceptance",
        description: "Production asset repository delivery, DNS mapping and code deployment.",
        amountMinor: 180000,
        status: "upcoming",
      },
    ],
  },
];

export const demoProposals: FixtureProposal[] = [
  {
    id: "prp_cad_2026_090_v4",
    projectId: "prj_cad_2026_090",
    version: 4,
    issuedOn: "2026-11-14",
    startOn: "2026-11-18",
    endOn: "2026-12-20",
    termsLabel: "Standard studio terms, version 4.2, applied",
    revisionRounds: "2 formal revision rounds",
    revisionSummary: "2 included per item",
    deliverables: [
      {
        code: "D-01",
        title: "Core Brand Identity & Design Tokens",
        description: "Comprehensive visual identity framework, vector icon libraries, typography hierarchies, and dynamic tokens.",
        hours: 32,
        reviewNote: "Includes 2 consolidated review cycles",
        targetDate: "24 Nov 2026",
        items: [
          { title: "Brand Guidelines PDF", description: "A documented system covering logo geometry, clear space, tone of voice and colour." },
          { title: "Vector Asset Suite", description: "Production-ready SVGs, master files, typography formats and optimised favicons." },
          { title: "Figma Token Library", description: "Component tokens synced to variables: colour styles, spacing primitives, type scales and radii." },
        ],
      },
      {
        code: "D-02",
        title: "Storefront UX & Prototyping",
        description: "End-to-end customer journey wireframing, catalogue structure, checkout flows and click-through interactions.",
        hours: 60,
        reviewNote: "Interactive stakeholder walkthrough call included",
        targetDate: "05 Dec 2026",
        items: [
          { title: "Interactive Prototype", description: "High-fidelity clickable prototype of the main purchase journey." },
          { title: "Responsive Wireframes", description: "Mobile, tablet and wide-screen layouts for the key pages." },
          { title: "Design System Specs", description: "Interactive states, motion notes and an accessibility checklist." },
        ],
      },
      {
        code: "D-03",
        title: "Production Storefront Build",
        description: "Production build of the approved design, with a content editor for the marketing team and a staging environment.",
        hours: 0,
        reviewNote: "14 days post-launch hypercare",
        targetDate: "20 Dec 2026",
        items: [
          { title: "Production codebase", description: "Typed source, styling system and static pages, handed over in full." },
          { title: "Content editing", description: "Editable content blocks so the marketing team can update landing pages." },
          { title: "Staging deployment", description: "A private preview with branch deployments before the production cut-over." },
        ],
      },
    ],
    revisionTerms:
      "Two formal revision cycles per deliverable phase. Further revisions are billed at $145 per hour.",
    status: "sent",
  },
];

/** Email used for the development viewer. A reserved example domain, not a real address. */
export const demoViewerEmail = "sofia.marin@example.com";

/** Studio tenancy. A user can be a member of one or more studios; the dashboard shows the one they belong to. */
export type FixtureStudio = { id: string; name: string };
export type FixtureMembership = { studioId: string; userId: string; role: "owner" | "admin" | "member" | "viewer" };

export const demoStudioOwnerId = "usr_demo_lumen_owner";
export const demoStudioOwnerEmail = "owner@example.com";

export const demoStudios: FixtureStudio[] = [{ id: "stu_lumen", name: "Lumen Studio" }];

export const demoMemberships: FixtureMembership[] = [
  { studioId: "stu_lumen", userId: demoStudioOwnerId, role: "owner" },
];

/** Studio contact shown on the proposal. Sample data for the demo studio. */
export const demoStudioContact = { name: "Alex Morgan", email: "alex@lumenstudio.co" };
