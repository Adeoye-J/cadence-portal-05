import { user as users } from "./auth-schema";
/**
 * Cadence data model (PostgreSQL, Drizzle ORM). See docs/adr/0002-data-layer.md.
 *
 * Conventions:
 * - Money is stored as integer minor units (cents, kobo). Never floats.
 * - A project has one currency. Milestones and payments inherit it.
 * - IDs are text, generated in application code (ULID-style strings).
 * - Status values come from the Stitch designs. Do not add values without a design.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  integer,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const membershipRole = pgEnum("membership_role", ["owner", "admin", "member", "viewer"]);
export const currency = pgEnum("currency", ["USD", "NGN"]);
/** Six stages from DESIGN.md: Proposal, Signed, In progress, Review, Completed, Closed. */
export const projectStage = pgEnum("project_stage", [
  "proposal",
  "signed",
  "in_progress",
  "review",
  "completed",
  "closed",
]);
export const milestoneStatus = pgEnum("milestone_status", [
  "upcoming",
  "payment_due",
  "in_progress",
  "delivered",
  "approved",
]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "processing",
  "paid",
  "failed",
  "refunded",
]);
export const paymentProvider = pgEnum("payment_provider", ["paystack", "flutterwave"]);

export { user as users } from "./auth-schema";

/** One deliverable of a proposal, with its items. Kept as JSON on the proposal: it is read and written as a whole. */
export type ProposalDeliverable = {
  code: string;
  title: string;
  description: string;
  hours: number;
  reviewNote: string;
  targetDate: string;
  items: { title: string; description: string }[];
};

export const studios = pgTable("studios", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  studioId: text("studio_id").notNull().references(() => studios.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: membershipRole("role").notNull(),
}, (t) => [primaryKey({ columns: [t.studioId, t.userId] })]);

/** A client organisation, for example "Apex Holdings LLC". */
export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  studioId: text("studio_id").notNull().references(() => studios.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
}, (t) => [index("clients_studio_idx").on(t.studioId)]);

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  studioId: text("studio_id").notNull().references(() => studios.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
  reference: text("reference").notNull(),
  title: text("title").notNull(),
  currency: currency("currency").notNull(),
  stage: projectStage("stage").notNull().default("proposal"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("projects_reference_idx").on(t.reference),
  index("projects_studio_idx").on(t.studioId),
]);

/** Users allowed to view a project as the client. Scope is per project, never per studio. */
export const projectContacts = pgTable("project_contacts", {
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.projectId, t.userId] })]);

export const milestones = pgTable("milestones", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  position: bigint("position", { mode: "number" }).notNull(),
  title: text("title").notNull(),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  status: milestoneStatus("status").notNull().default("upcoming"),
  dueDate: date("due_date", { mode: "string" }),
  description: text("description"),
  terms: text("terms"),
}, (t) => [
  uniqueIndex("milestones_project_position_idx").on(t.projectId, t.position),
]);

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  milestoneId: text("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  provider: paymentProvider("provider").notNull(),
  providerReference: text("provider_reference").notNull(),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  currency: currency("currency").notNull(),
  status: paymentStatus("status").notNull().default("pending"),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  authorizationUrl: text("authorization_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  // A milestone has at most one open payment. The database refuses a second, so two clicks cannot start two charges.
  uniqueIndex("payments_one_open_per_milestone_idx").on(t.milestoneId).where(sql`${t.status} = 'pending'`),
  // Provider references are unique: a repeated webhook must not create a second payment.
  uniqueIndex("payments_provider_reference_idx").on(t.provider, t.providerReference),
  index("payments_milestone_idx").on(t.milestoneId),
]);

export type MilestoneStatus = (typeof milestoneStatus.enumValues)[number];
export type ProjectStage = (typeof projectStage.enumValues)[number];
export type Currency = (typeof currency.enumValues)[number];

/** One issued version of a proposal. A signed version is never edited; a change is a new version. */
export const proposals = pgTable("proposals", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  version: bigint("version", { mode: "number" }).notNull(),
  status: text("status", { enum: ["draft", "sent", "signed"] }).notNull().default("draft"),
  revisionTerms: text("revision_terms").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  startOn: date("start_on", { mode: "string" }),
  endOn: date("end_on", { mode: "string" }),
  termsLabel: text("terms_label"),
  revisionRounds: text("revision_rounds"),
  revisionSummary: text("revision_summary"),
  deliverables: jsonb("deliverables").$type<ProposalDeliverable[]>(),
}, (t) => [uniqueIndex("proposals_project_version_idx").on(t.projectId, t.version)]);

/**
 * Record of a typed-name sign-off. Stores the signer, the typed name, the UTC
 * time and a SHA-256 digest of the terms signed. It is not a qualified
 * electronic signature. Legal validity needs review (docs/assumptions.md, item 26).
 */
export const signatures = pgTable("signatures", {
  id: text("id").primaryKey(),
  proposalId: text("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  signerUserId: text("signer_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  typedName: text("typed_name").notNull(),
  documentSha256: text("document_sha256").notNull(),
  signedAt: timestamp("signed_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("signatures_proposal_idx").on(t.proposalId)]);

export const outboxStatus = pgEnum("outbox_status", ["pending", "sent", "dead"]);

/**
 * Durable email outbox. Writes add a row; a scheduled job sends pending rows with retries.
 * dedupe_key is unique, so one event for one recipient is queued once, even if it is retried.
 * to_address and the bodies are personal data. Purge sent rows after a retention period (docs/assumptions.md).
 */
export const notificationOutbox = pgTable("notification_outbox", {
  id: text("id").primaryKey(),
  dedupeKey: text("dedupe_key").notNull(),
  toAddress: text("to_address").notNull(),
  subject: text("subject").notNull(),
  textBody: text("text_body").notNull(),
  htmlBody: text("html_body").notNull(),
  status: outboxStatus("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  lastErrorCode: text("last_error_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
}, (t) => [
  uniqueIndex("outbox_dedupe_idx").on(t.dedupeKey),
  index("outbox_due_idx").on(t.status, t.nextAttemptAt),
]);

/* ---- Billing ---- */
export const billingCycle = pgEnum("billing_cycle", ["monthly", "annual"]);
export const subscriptionPlan = pgEnum("subscription_plan", ["free", "pro", "studio"]);
export const invoiceStatus = pgEnum("invoice_status", ["pending", "paid", "failed"]);

/** One current subscription per studio. Renewal is a new checkout, not an automatic charge. */
export const studioSubscriptions = pgTable("studio_subscriptions", {
  studioId: text("studio_id").primaryKey().references(() => studios.id, { onDelete: "cascade" }),
  planKey: subscriptionPlan("plan_key").notNull(),
  cycle: billingCycle("cycle").notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Every checkout creates an invoice first. The reference is the payment provider's reference. */
export const billingInvoices = pgTable(
  "billing_invoices",
  {
    reference: text("reference").primaryKey(),
    studioId: text("studio_id").notNull().references(() => studios.id, { onDelete: "restrict" }),
    planKey: subscriptionPlan("plan_key").notNull(),
    cycle: billingCycle("cycle").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    status: invoiceStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("billing_invoices_studio_idx").on(t.studioId)],
);

/* ---- Proposal notes and pending sign-ups ---- */
export const proposalNoteKind = pgEnum("proposal_note_kind", ["general", "section", "change"]);

/** Client notes on a proposal. Kept for the studio. Deleting a proposal removes its notes. */
export const proposalNotes = pgTable(
  "proposal_notes",
  {
    id: text("id").primaryKey(),
    proposalId: text("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    kind: proposalNoteKind("kind").notNull(),
    sectionRef: text("section_ref"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("proposal_notes_proposal_idx").on(t.proposalId)],
);

/** Sign-up details held between the sign-up form and the first sign-in. Expiry is checked in the application. */
export const pendingSignups = pgTable("pending_signups", {
  email: text("email").primaryKey(),
  fullName: text("full_name").notNull(),
  studioName: text("studio_name").notNull(),
  country: text("country").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ---- Activity log, invitations, change requests, files, account requests ---- */

/** The project's activity log. Written in the same transaction as the change it records. */
export const projectEvents = pgTable(
  "project_events",
  {
    seq: bigint("seq", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    id: text("id").notNull(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    actor: text("actor").notNull(),
    summary: text("summary").notNull(),
    clientVisible: boolean("client_visible").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("project_events_id_idx").on(t.id), index("project_events_project_idx").on(t.projectId, t.seq)],
);

/** Client invitations. Only the SHA-256 of the token is stored. */
export const invitations = pgTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    invitedByUserId: text("invited_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revoked: boolean("revoked").notNull().default(false),
  },
  (t) => [uniqueIndex("invitations_token_hash_idx").on(t.tokenHash), index("invitations_project_idx").on(t.projectId)],
);

/** A client's request for changes to a delivered milestone, and the studio's one reply. */
export const changeRequests = pgTable(
  "change_requests",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    replyBody: text("reply_body"),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
  },
  (t) => [index("change_requests_project_idx").on(t.projectId)],
);

export const fileStatus = pgEnum("file_status", ["pending", "ready"]);

/** Deliverable files. The bytes are in object storage; this row says where and what. */
export const projectFiles = pgTable(
  "project_files",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    storageKey: text("storage_key").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    status: fileStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("project_files_milestone_idx").on(t.projectId, t.position)],
);

/** A request to delete an account. Recorded now, processed by a person. */
export const accountDeletionRequests = pgTable("account_deletion_requests", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
});
