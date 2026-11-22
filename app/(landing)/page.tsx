import type { Metadata } from "next";
import Link from "next/link";
import { Faq, type FaqItem } from "@/components/features/marketing/faq";
import { cn } from "@/lib/cn";
import { icons } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Client delivery portal",
  description: "Run every client project from one link: scope, milestone sign-offs, files, change requests and payments.",
};

/**
 * Landing page, ported from the design (landing_page_desktop). Layout, classes and order follow the design.
 * Changes from the design are recorded in docs/design-decisions.md: claims that are not built or measured
 * were removed, decorative controls became plain visuals, and the logo is a placeholder.
 */

const PROBLEMS = [
  { icon: icons.sortIndicator, title: "Scope creep", body: "Verbal requests on calls slip into scope without a written sign-off or an adjusted price. A short sprint can grow into weeks of unpriced changes.", result: "Result: unpriced revisions", tone: "bg-error-container/60 text-error", resultIcon: icons.close, resultTone: "text-error" },
  { icon: icons.chatError, title: "Approvals lost in chat", body: "Approvals end up in chat and email threads that are hard to find when a question comes up later. Cadence keeps each sign-off on the project, with its time.", result: "Result: fractured records", tone: "bg-tertiary-fixed/60 text-tertiary", resultIcon: icons.warning, resultTone: "text-tertiary" },
  { icon: icons.hourglass, title: "Payments chased by hand", body: "Follow-ups, unlinked invoices and delayed transfers stall delivery. Cadence ties each payment to a milestone, so the next piece of work is clear.", result: "Result: unpredictable cashflow", tone: "bg-secondary-fixed/50 text-secondary", resultIcon: icons.trendDown, resultTone: "text-secondary" },
];

const STEPS = [
  { icon: icons.send, title: "Send proposal", body: "Share scope, deliverables, timeline and payment milestones in one link.", footer: "Zero setup for client" },
  { icon: icons.draw, title: "Client signs off", body: "The client reviews the terms and signs by typing their name. The record keeps the time and a fingerprint of the terms.", footer: "One link, no password" },
  { icon: icons.payments, title: "Pay each milestone", body: "Each milestone is paid through a hosted checkout. Work on the next milestone starts once its payment settles.", footer: "USD and NGN" },
  { icon: icons.archive, title: "Approve and close", body: "The client approves each delivery or asks for changes. Files, requests and the activity log stay on the project.", footer: "Activity log and file downloads" },
];

const FAQ: FaqItem[] = [
  { question: "Do my clients need an account?", answer: "They don't need a password or any software. They open the link we email them and sign in with that address. From there they can review, sign off and pay." },
  { question: "Which currencies can I use?", answer: "Each project is in USD or NGN, chosen when the project is set up. A project keeps one currency for all of its milestones." },
  { question: "How are payments secured?", answer: "Payments go through Paystack's hosted checkout, so Cadence never handles card details. A milestone is marked paid only after the provider confirms the payment. Funds are not held in escrow." },
  { question: "Is the signature legally binding?", answer: "Cadence records the signer's typed name, the time in UTC, and a fingerprint of the terms. Whether that is binding where you work is a question for your own legal advice." },
  { question: "Can I export my records?", answer: "Clients can download their data from their account as a JSON file. It includes their projects, milestones, payments, change requests and the client-visible activity." },
];

const linkButton = "inline-flex h-[46px] items-center justify-center rounded-[10px] px-6 text-body-sm-medium shadow-sm transition-all";
const primaryButton = `${linkButton} bg-primary-container text-on-primary hover:bg-primary`;
const secondaryButton = `${linkButton} bg-surface-container-lowest text-on-surface hover:bg-surface-container`;

export default function LandingPage() {
  const Arrow = icons.forward;
  const Visible = icons.visible;
  const Lock = icons.lock;
  const Verified = icons.shieldCheck;
  const Bolt = icons.zap;
  const Check = icons.check;
  const Token = icons.token;
  const PlayCircle = icons.playCircle;
  const Download = icons.download;
  const Pending = icons.pending;

  return (
    <main className="w-full flex-1 pt-16">
      <div className="relative w-full overflow-hidden bg-canvas pb-16 lg:pb-24">
        <div className="pointer-events-none absolute right-1/4 top-0 -z-0 h-[400px] w-[600px] rounded-full bg-primary-fixed-dim/15 blur-[140px]" />
        <div className="pointer-events-none absolute left-10 top-1/3 -z-0 h-[320px] w-[420px] rounded-full bg-secondary-container/20 blur-[120px]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 lg:pt-14">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="flex flex-col items-start lg:col-span-6 lg:pr-6">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1 text-label-md uppercase tracking-wider text-on-surface-variant">
                <span className="inline-block h-2 w-2 rounded-full bg-primary-container" />
                Client delivery standard
              </div>
              <h1 className="mb-6 max-w-xl text-balance text-headline-xl tracking-tight text-on-surface">Run every client project from one link.</h1>
              <p className="mb-8 max-w-lg text-body-lg text-on-surface-variant">
                Scope, milestone sign-offs, files, change requests and payments in one place your clients can follow, instead of scattered chats and PDFs.
              </p>
              <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Link href="/sign-up" className={primaryButton}>
                  Create a studio account
                  <Arrow size={18} aria-hidden="true" className="ml-2" />
                </Link>
                <a href="#live-demo" className={secondaryButton}>
                  <Visible size={18} aria-hidden="true" className="mr-2 text-on-surface-variant" />
                  See an example project
                </a>
              </div>
              <dl className="mt-10 grid w-full grid-cols-3 gap-6 rounded-xl bg-surface-container-low/60 p-4">
                <div><dt className="text-label-sm uppercase tracking-wider text-on-surface-variant">Client sign-in</dt><dd className="mt-0.5 text-headline-sm font-bold text-on-surface">No password</dd></div>
                <div><dt className="text-label-sm uppercase tracking-wider text-on-surface-variant">Payments</dt><dd className="mt-0.5 text-headline-sm font-bold text-on-surface">Per milestone</dd></div>
                <div><dt className="text-label-sm uppercase tracking-wider text-on-surface-variant">Currencies</dt><dd className="mt-0.5 text-headline-sm font-bold text-on-surface">USD and NGN</dd></div>
              </dl>
            </div>

            <div id="live-demo" className="w-full lg:col-span-6">
              <div className="relative w-full rounded-2xl bg-surface-container-lowest p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.06)] sm:p-7">
                <p className="mb-3 text-label-sm uppercase tracking-wider text-on-surface-variant">Illustration, sample data</p>
                <div className="-mx-5 -mt-5 mb-5 flex items-center justify-between rounded-t-2xl bg-surface-container-low/40 px-5 pb-5 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary">NL</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-headline-sm tracking-tight text-on-surface">Brand Identity &amp; Web System</span>
                        <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-sm text-on-surface-variant">Private link</span>
                      </div>
                      <div className="text-body-sm text-on-surface-variant">Client: <span className="font-medium text-on-surface">Northstar Labs</span> • Lead: Studio Sunder</div>
                    </div>
                  </div>
                  <div className="hidden items-center gap-1.5 rounded-md bg-surface-container px-3 py-1 text-label-sm tabular-nums text-on-surface-variant sm:flex">
                    <Lock size={14} aria-hidden="true" /> CAD-9421-NL
                  </div>
                </div>

                <div className="mb-6 overflow-x-auto pb-2">
                  <div className="min-w-[540px]">
                    <div className="relative flex items-center justify-between">
                      <div className="absolute inset-x-3 top-3.5 h-0.5 bg-surface-container-high" />
                      {[
                        { label: "1. Proposal", date: "18 Oct", state: "done" },
                        { label: "2. Signed", date: "22 Oct", state: "done" },
                        { label: "3. In progress", date: "Active", state: "active" },
                        { label: "4. Review", date: "Pending", state: "todo" },
                        { label: "5. Completed", date: "—", state: "todo" },
                        { label: "6. Closed", date: "—", state: "todo" },
                      ].map((s, i) => (
                        <div key={s.label} className="relative z-10 flex flex-col items-center">
                          {s.state === "done" ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm"><Check size={16} aria-hidden="true" /></div>
                          ) : s.state === "active" ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-lowest ring-2 ring-primary-container shadow-sm"><div className="h-2.5 w-2.5 rounded-full bg-primary-container" /></div>
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container text-[12px] font-medium text-on-surface-variant">{i + 1}</div>
                          )}
                          <span className={cn("mt-1.5 text-label-sm", s.state === "active" ? "font-bold text-primary" : "font-medium text-on-surface")}>{s.label}</span>
                          <span className={cn("text-[10px] tabular-nums", s.state === "active" ? "font-semibold text-primary-container" : "text-on-surface-variant")}>{s.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-low p-5 shadow-sm">
                  <div className="-mx-5 -mt-5 mb-4 flex flex-col justify-between gap-3 rounded-t-xl bg-surface-container-high/30 px-5 pb-4 pt-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="text-headline-sm font-semibold text-on-surface">Milestone 02 — Design System &amp; Prototyping</div>
                      <div className="mt-0.5 text-label-sm tabular-nums text-on-surface-variant">Target sign-off: <strong className="font-semibold text-on-surface">14 Nov 2026, 16:40 UTC</strong></div>
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FFF4E0] px-3 py-1 text-label-md text-[#8A5300]">
                      <Pending size={14} aria-hidden="true" /> Waiting on you
                    </div>
                  </div>
                  <div className="mb-5 space-y-2.5">
                    <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-fixed/30 text-primary"><Token size={18} aria-hidden="true" /></div>
                        <div>
                          <div className="text-body-sm-medium text-on-surface">Design Tokens &amp; Component Kit v1.4</div>
                          <div className="text-label-sm tabular-nums text-on-surface-variant">Figma library • 48 components</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary-fixed/40 text-secondary"><PlayCircle size={18} aria-hidden="true" /></div>
                        <div>
                          <div className="text-body-sm-medium text-on-surface">Interactive Prototype Walkthrough (Checkout &amp; Account)</div>
                          <div className="text-label-sm tabular-nums text-on-surface-variant">MP4 preview • 4 min 12 sec</div>
                        </div>
                      </div>
                      <Download size={18} aria-hidden="true" className="text-on-surface-variant" />
                    </div>
                  </div>
                  <div className="-mx-5 -mb-5 flex flex-col justify-between gap-3 rounded-b-xl bg-surface-container-high/40 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex items-baseline gap-2">
                      <span className="text-label-md uppercase tracking-wider text-on-surface-variant">Milestone total</span>
                      <span className="text-headline-md font-bold tabular-nums text-on-surface">$1,800.00 <span className="text-label-sm font-normal text-on-surface-variant">USD</span></span>
                    </div>
                    <div className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-primary-container px-5 py-2.5 text-body-sm-medium text-on-primary opacity-90">
                      <Verified size={18} aria-hidden="true" /> Approve and pay on the project
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between px-2 text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Timestamped activity</span>
                  <span className="tabular-nums">Sample data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="w-full bg-surface-container-low py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-4 text-center sm:px-6 lg:px-8">
          <Lock size={18} aria-hidden="true" className="text-primary-container" />
          <p className="text-body-sm-medium text-on-surface">Clients don&apos;t set a password. They open the link, sign off and pay.</p>
        </div>
      </section>

      <section className="w-full bg-canvas py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end lg:mb-16">
            <div>
              <span className="text-label-md uppercase tracking-wider text-primary-container">The core breakdown</span>
              <h2 className="mt-2 text-headline-xl tracking-tight text-on-surface">Where client projects drift.</h2>
            </div>
            <p className="max-w-md text-body-lg text-on-surface-variant">Unstructured communication makes client work harder to finish and harder to bill.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            {PROBLEMS.map((p) => {
              const Icon = p.icon;
              const ResultIcon = p.resultIcon;
              return (
                <div key={p.title} className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md lg:p-8">
                  <div>
                    <div className={cn("mb-6 flex h-12 w-12 items-center justify-center rounded-xl", p.tone)}><Icon size={24} aria-hidden="true" /></div>
                    <h3 className="mb-3 text-headline-md text-on-surface">{p.title}</h3>
                    <p className="text-body-sm leading-relaxed text-on-surface-variant">{p.body}</p>
                  </div>
                  <div className="-mx-6 -mb-6 mt-8 flex items-center justify-between rounded-b-xl bg-surface-container-low/50 p-4 text-label-sm text-on-surface-variant lg:-mx-8 lg:-mb-8">
                    <span>{p.result}</span>
                    <ResultIcon size={16} aria-hidden="true" className={p.resultTone} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how" className="w-full bg-surface-container-low py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <span className="text-label-md uppercase tracking-wider text-primary-container">How it works</span>
            <h2 className="mt-2 text-headline-xl tracking-tight text-on-surface">How Cadence runs delivery.</h2>
            <p className="mt-3 text-body-lg text-on-surface-variant">Four steps: send, sign, pay, close.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm">
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-headline-lg font-bold tabular-nums text-primary-container">0{i + 1}</span>
                      <Icon size={22} aria-hidden="true" className="text-on-surface-variant" />
                    </div>
                    <h3 className="mb-2 text-headline-sm text-on-surface">{s.title}</h3>
                    <p className="text-body-sm text-on-surface-variant">{s.body}</p>
                  </div>
                  <div className="-mx-6 -mb-6 mt-8 rounded-b-xl bg-surface-container-high/30 px-6 py-3 text-label-sm text-on-surface-variant">{s.footer}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="w-full bg-canvas py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <span className="text-label-md uppercase tracking-wider text-primary-container">What is in the portal</span>
            <h2 className="mt-2 text-headline-xl tracking-tight text-on-surface">Engineered for operational peace of mind.</h2>
            <p className="mt-3 text-body-lg text-on-surface-variant">Five connected tools in one client experience.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm md:col-span-7 lg:p-8">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-headline-lg text-on-surface">Proposal &amp; scope</h3>
                  <span className="rounded bg-surface-container-high px-2.5 py-1 text-label-sm tabular-nums text-on-surface">Written terms</span>
                </div>
                <p className="mb-6 max-w-xl text-body-sm text-on-surface-variant">The scope, the milestones and their amounts are written into the proposal the client signs.</p>
              </div>
              <div className="space-y-2 rounded-lg bg-surface-container-low p-4 text-body-sm">
                {[["Milestone 1 · Kickoff", "Paid"], ["Milestone 2 · Prototype", "Payment due"], ["Milestone 3 · Handover", "Upcoming"]].map(([name, state]) => (
                  <div key={name} className="flex items-center justify-between rounded bg-surface-container-lowest p-2.5 text-label-md text-on-surface">
                    <span>{name}</span><span className="tabular-nums text-on-surface-variant">{state}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm md:col-span-5 lg:p-8">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-headline-lg text-on-surface">Milestone payments</h3>
                  <span className="rounded bg-emerald-50 px-2.5 py-1 text-label-sm tabular-nums text-emerald-800">USD · NGN</span>
                </div>
                <p className="mb-6 text-body-sm text-on-surface-variant">Each milestone is paid before its work starts. Each project is set to one currency.</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <div className="-mx-4 -mt-4 mb-3 flex items-center justify-between rounded-t-lg bg-surface-container-high/40 p-4"><span className="text-label-sm uppercase text-on-surface-variant">Payment schedule</span></div>
                <div className="space-y-2 text-label-md text-on-surface">
                  <div className="flex justify-between"><span>Milestone 1: Strategy</span><span className="font-mono font-bold tabular-nums text-emerald-700">$2,400.00 · paid</span></div>
                  <div className="flex justify-between"><span>Milestone 2: Build</span><span className="font-mono font-bold tabular-nums text-on-surface">₦3,650,000 · due</span></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm md:col-span-4 lg:p-8">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed/40 text-primary"><icons.file size={20} aria-hidden="true" /></div>
                <h3 className="mb-2 text-headline-md text-on-surface">Shared files</h3>
                <p className="mb-6 text-body-sm text-on-surface-variant">Deliverables are attached to each milestone. Project contacts download them with a link that lasts five minutes.</p>
              </div>
              <div className="space-y-2 text-label-sm">
                <div className="flex items-center gap-2 rounded bg-surface-container-low p-2.5 text-on-surface">spec-sheet-arch.pdf</div>
                <div className="flex items-center gap-2 rounded bg-surface-container-low p-2.5 text-on-surface">brand-assets-final.zip</div>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm md:col-span-4 lg:p-8">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-fixed/40 text-tertiary"><icons.price size={20} aria-hidden="true" /></div>
                <h3 className="mb-2 text-headline-md text-on-surface">Change requests with replies</h3>
                <p className="mb-6 text-body-sm text-on-surface-variant">The client describes the change on the milestone. The studio replies in the same thread.</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-3">
                <div className="mb-2 text-label-sm font-medium text-on-surface">Add a dark mode theme</div>
                <span className="rounded bg-tertiary-fixed/60 px-1.5 py-0.5 text-[11px] font-medium text-tertiary">Awaiting studio reply</span>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm md:col-span-4 lg:p-8">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container"><icons.fact size={20} aria-hidden="true" /></div>
                <h3 className="mb-2 text-headline-md text-on-surface">Activity timeline</h3>
                <p className="mb-6 text-body-sm text-on-surface-variant">A timestamped log of sign-offs, approvals and payments on every project.</p>
              </div>
              <div className="space-y-2 text-label-sm text-on-surface-variant">
                <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary-container" /><span className="tabular-nums">14:22</span> • Client signed Milestone 01</div>
                <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /><span className="tabular-nums">15:01</span> • Payment settled, Milestone 01</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-surface-container-low py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="text-label-md uppercase tracking-wider text-primary-container">Who it is for</span>
            <h2 className="mt-2 text-headline-xl tracking-tight text-on-surface">Tailored to how modern builders operate.</h2>
            <p className="mt-3 text-body-lg text-on-surface-variant">Cadence brings the proposal, sign-off, payments and files into one client link.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { label: "Solo operators", title: "Independent freelancers", body: "Give clients a clear proposal, a signed record and a payment step for each milestone, without a stack of separate tools.", items: ["Proposal and sign-off in one link", "Payment tied to each milestone", "Files and approvals on the project"], foot: "One studio, one client link" },
              { label: "Several clients", title: "Boutique agencies", body: "Run several client projects from one studio view, each with its own milestones, files and activity.", items: ["Projects for every client in one view", "Change requests with replies", "Roles for owners, admins, members and viewers"], foot: "Owners, admins, members and viewers" },
              { label: "Design and engineering", title: "Technical studios", body: "Keep sign-offs and payments tied to milestones, with a record of what was approved and when.", items: ["Timestamped activity log", "Milestone-by-milestone approvals", "Account data export for clients"], foot: "Activity log and approvals" },
            ].map((p) => (
              <div key={p.title} className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-8 shadow-sm">
                <div>
                  <div className="mb-2 text-label-md uppercase tracking-wider text-on-surface-variant">{p.label}</div>
                  <h3 className="mb-3 text-headline-md text-on-surface">{p.title}</h3>
                  <p className="mb-6 text-body-sm leading-relaxed text-on-surface-variant">{p.body}</p>
                  <ul className="mb-6 space-y-2">
                    {p.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-label-md text-on-surface"><Check size={16} aria-hidden="true" className="text-primary-container" />{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="-mx-8 -mb-8 mt-4 rounded-b-xl bg-surface-container-high/30 px-8 py-4 text-label-sm font-semibold text-on-surface">{p.foot}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-canvas py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 rounded-2xl bg-surface-container p-8 shadow-sm md:flex-row lg:p-12">
            <div className="max-w-xl">
              <div className="mb-2 text-label-md uppercase tracking-wider text-primary-container">Get started</div>
              <h3 className="mb-3 text-headline-lg tracking-tight text-on-surface">Create a studio account, then send your first proposal.</h3>
              <p className="text-body-sm text-on-surface-variant">Clients sign in with an email link and never set a password.</p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <Link href="/pricing" className={secondaryButton}>View pricing</Link>
                <Link href="/log-in" className={secondaryButton}>Sign in</Link>
              <Link href="/sign-up" className={primaryButton}>Create studio account</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-surface-container-low py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <span className="text-label-md uppercase tracking-wider text-primary-container">Common questions</span>
            <h2 className="mt-2 text-headline-xl tracking-tight text-on-surface">Frequently asked questions.</h2>
          </div>
          <Faq items={FAQ} />
        </div>
      </section>

      <section className="w-full bg-canvas py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="text-label-md uppercase tracking-wider text-primary-container">Get started</span>
          <h2 className="mb-4 mt-3 text-headline-xl tracking-tight text-on-surface">Ready to run your next project through Cadence?</h2>
          <p className="mx-auto mb-8 max-w-xl text-body-lg text-on-surface-variant">Create a studio account and send your first proposal. Clients sign in with a link.</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/sign-up" className={cn(primaryButton, "w-full sm:w-auto px-8")}>
              Create studio account
              <Bolt size={18} aria-hidden="true" className="ml-2" />
            </Link>
            <a href="#live-demo" className={cn(secondaryButton, "w-full sm:w-auto")}>See the example</a>
          </div>
          <p className="mt-8 flex flex-wrap items-center justify-center gap-4 text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1"><Check size={15} aria-hidden="true" className="text-emerald-600" /> No password for clients</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Check size={15} aria-hidden="true" className="text-emerald-600" /> Email link, Google or passkey for studios</span>
          </p>
        </div>
      </section>
    </main>
  );
}
