import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Help" };

const QUESTIONS = [
  {
    q: "How do clients sign in?",
    a: "They enter their email and get a one-time sign-in link. The link works once and expires after 15 minutes. There is no password to set.",
  },
  {
    q: "How does a client join a project?",
    a: "The studio invites them by email. The invitation link expires after 14 days, and it only works for the address it was sent to.",
  },
  {
    q: "What does signing a proposal record?",
    a: "The client's typed name, the time in UTC, and a SHA-256 fingerprint of the terms they signed. The record is not a qualified electronic signature. Whether it is legally binding depends on your jurisdiction, so take legal advice.",
  },
  {
    q: "How are milestones paid?",
    a: "Each payment goes through a hosted checkout. The payment is confirmed only when the provider confirms it, not when the browser returns to Cadence.",
  },
  {
    q: "What happens if a payment does not complete?",
    a: "The milestone stays due, and the client can try again. The payment is shown as not completed in their history.",
  },
  {
    q: "Can an approved milestone be changed?",
    a: "No. Approval cannot be undone. A client who wants changes should ask before approving, and the studio replies in the same thread.",
  },
  {
    q: "Who can see my files?",
    a: "Only the project's client contacts and members of the studio. Download links last five minutes.",
  },
];

/** Help and FAQ. Answers describe the product as it is built. Anything not yet built is not promised here. */
export default function HelpPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <PageHeader title="Help" description="Common questions about signing in, approvals and payments." />
      <dl className="flex flex-col gap-6">
        {QUESTIONS.map((item) => (
          <div key={item.q} className="flex flex-col gap-2 rounded-card border border-border bg-surface p-5">
            <dt className="text-headline-sm text-ink">{item.q}</dt>
            <dd className="text-body-sm text-ink-muted">{item.a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
