/* Generated from a Stitch design by scripts/design/h2j.py. Bindings are written against the `data` prop.
 * Edit the generator or the data, then regenerate. Hand edits are overwritten. */
import Link from "next/link";
import { Ico } from "@/components/ui/icon";
import { BrandLogo, ImagePlaceholder } from "@/components/ui/brand";
import { NoteButton } from "@/components/features/proposal/note-dialog";
import type { ProposalReviewData } from "@/components/features/proposal/review-types";

export function ProposalReviewDesign({ data }: { data: ProposalReviewData }) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-canvas/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-margin flex items-center justify-between gap-gutter">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-sm">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Ico name="token" />
              </div>
              <div className="flex flex-col">
                <span className="text-headline-sm text-primary tracking-tight leading-none">
                  {data.project.studioName}
                </span>
                <span className="text-label-sm text-on-surface-variant tracking-wider uppercase leading-none mt-1">
                  Cadence Portal
                </span>
              </div>
            </div>
            <div className="h-4 w-px bg-outline-variant hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-space-xs bg-surface-container px-2.5 py-1 rounded-full text-on-surface-variant">
              <Ico name="lock" />
              <span className="text-label-sm uppercase tracking-wide">
                Secure Client Session
              </span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
            <a aria-current="page" className="px-3 py-1.5 transition-colors bg-primary-container text-on-primary-container rounded-lg" href={data.links.review}>
              Proposal &amp; Scope
            </a>
            <a className="px-3 py-1.5 text-body-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" href={data.links.preWork}>
              Review Stages
            </a>
            <a className="px-3 py-1.5 text-body-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" href={data.links.sign}>
              Sign Document
            </a>
            <a className="px-3 py-1.5 text-body-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" href={data.links.payments}>
              Financials &amp; Receipts
            </a>
          </nav>
          <div className="flex items-center gap-space-md">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-body-sm-medium text-on-surface leading-tight">
                {data.viewer.name}
              </span>
              <span className="text-label-sm text-on-surface-variant leading-tight">
                Authorized Signatory
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <Ico name="person" />
            </div>
          </div>
        </div>
      </header>
      <main className="w-full pt-16 bg-background min-h-screen">
        <div className="flex flex-col w-full">
          <section className="w-full bg-surface-container-low">
            <div className="max-w-7xl mx-auto px-margin py-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-2 gap-x-4">
                <div className="flex items-center flex-wrap gap-2 text-on-surface-variant text-label-sm">
                  <span className="tracking-widest uppercase font-semibold text-primary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                     DOCUMENT REVIEW 
                  </span>
                  <span className="text-outline-variant font-normal">
                    /
                  </span>
                  <span className="font-mono tracking-tight text-on-surface font-semibold bg-surface-container px-2 py-0.5 rounded">
                    REF: {data.project.reference}
                  </span>
                  <span className="text-outline-variant font-normal">
                    •
                  </span>
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                    {data.stageText}
                  </span>
                </div>
                <div className="flex items-center gap-space-md text-label-sm text-on-surface-variant">
                  <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1 rounded shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-surface-tint"></span>
                    <span className="text-body-sm text-on-surface">
                      Active Portal
                    </span>
                    <span className="text-outline font-normal">
                      • {data.viewer.name}
                    </span>
                  </div>
                  <span className="text-outline-variant hidden sm:inline">
                    |
                  </span>
                  <span className="text-outline hidden sm:inline tracking-wider">
                    {`VERSION ${data.proposal.version}`}
                  </span>
                </div>
              </div>
            </div>
          </section>
          <div className="w-full bg-surface-container-lowest shadow-sm">
            <div className="max-w-7xl mx-auto px-margin py-3 overflow-x-auto">
              <div className="flex items-center min-w-[720px] justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-sm font-semibold shadow-sm">
                    1
                  </div>
                  <div>
                    <span className="text-body-sm-medium text-primary block leading-none">
                      Proposal
                    </span>
                    <span className="text-label-sm text-on-surface-variant mt-0.5 block">
                      Pending Sign-off
                    </span>
                  </div>
                </div>
                <div className="flex-1 h-0.5 bg-surface-container-high mx-3"></div>
                <div className="flex items-center gap-2.5 opacity-60">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-label-sm">
                    2
                  </div>
                  <div>
                    <span className="text-body-sm-medium text-on-surface block leading-none">
                      Signed
                    </span>
                    <span className="text-label-sm text-outline mt-0.5 block">
                      Countersignature
                    </span>
                  </div>
                </div>
                <div className="flex-1 h-0.5 bg-surface-container-high mx-3"></div>
                <div className="flex items-center gap-2.5 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-label-sm">
                    3
                  </div>
                  <div>
                    <span className="text-body-sm-medium text-on-surface block leading-none">
                      In Progress
                    </span>
                    <span className="text-label-sm text-outline mt-0.5 block">
                      Sprint 1 Sprint 2
                    </span>
                  </div>
                </div>
                <div className="flex-1 h-0.5 bg-surface-container-high mx-3"></div>
                <div className="flex items-center gap-2.5 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-label-sm">
                    4
                  </div>
                  <div>
                    <span className="text-body-sm-medium text-on-surface block leading-none">
                      Review
                    </span>
                    <span className="text-label-sm text-outline mt-0.5 block">
                      Asset Staging
                    </span>
                  </div>
                </div>
                <div className="flex-1 h-0.5 bg-surface-container-high mx-3"></div>
                <div className="flex items-center gap-2.5 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-label-sm">
                    5
                  </div>
                  <div>
                    <span className="text-body-sm-medium text-on-surface block leading-none">
                      Completed
                    </span>
                    <span className="text-label-sm text-outline mt-0.5 block">
                      Storefront Live
                    </span>
                  </div>
                </div>
                <div className="flex-1 h-0.5 bg-surface-container-high mx-3"></div>
                <div className="flex items-center gap-2.5 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-label-sm">
                    6
                  </div>
                  <div>
                    <span className="text-body-sm-medium text-on-surface block leading-none">
                      Closed
                    </span>
                    <span className="text-label-sm text-outline mt-0.5 block">
                      Archive
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-margin pt-space-xl pb-space-lg w-full">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-surface-container text-label-sm uppercase tracking-wider text-on-surface-variant rounded">
                    Commercial SOW
                  </span>
                  <span className="text-on-surface-variant text-label-sm">
                    Issued {data.proposal.issuedLong}
                  </span>
                </div>
                <h1 className="text-headline-xl text-on-background tracking-tight">
                  {data.project.title}
                </h1>
                <p className="text-body-lg text-secondary">
                  Prepared by {data.project.studioName} for {data.project.clientName}
                </p>
              </div>
              <div className="flex items-center gap-space-sm flex-wrap">
                <a className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm-medium rounded-lg transition-colors shadow-sm" href={data.links.print}>
                  <Ico name="download" />
                  <span>
                    Download PDF Copy
                  </span>
                </a>
                <NoteButton label="Add General Note" kind="general" projectId={data.project.id} proposalId={data.proposal.id} className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm-medium rounded-lg transition-colors shadow-sm" viewerName={data.viewer.name}>
                  <Ico name="modeComment" />
                  <span>
                    Add General Note
                  </span>
                </NoteButton>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-margin pb-space-xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-gutter items-start">
              <div className="lg:col-span-7 flex flex-col gap-space-xl">
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg relative overflow-hidden">
                  <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary/5 rounded-full pointer-events-none"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                    <div>
                      <span className="text-label-sm uppercase tracking-widest text-on-surface-variant font-medium">
                        Contract Overview
                      </span>
                      <h2 className="text-headline-md text-on-surface mt-0.5">
                        Execution Summary &amp; Parameters
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-sm self-start sm:self-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                       Fixed-Fee Engagement 
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
                    <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                      <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Total Contract Value
                      </span>
                      <div className="mt-2">
                        <span className="text-headline-lg font-bold text-primary tracking-tight">
                          {data.money.total}
                        </span>
                        <span className="text-label-sm text-on-surface-variant ml-1 font-mono">
                          USD
                        </span>
                      </div>
                      <span className="text-label-sm text-outline mt-1 block">
                        Excl. applicable VAT
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                      <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Project Milestones
                      </span>
                      <div className="mt-2">
                        <span className="text-headline-lg font-bold text-on-surface tracking-tight">
                          3
                        </span>
                        <span className="text-body-sm text-on-surface-variant ml-1">
                          Structured Phases
                        </span>
                      </div>
                      <span className="text-label-sm text-outline mt-1 block">
                        Iterative review checkpoints
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                      <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Delivery Window
                      </span>
                      <div className="mt-2">
                        <span className="text-headline-sm text-on-surface font-semibold tracking-tight">
                          {data.window.range}
                        </span>
                        <span className="text-label-sm text-primary-container font-medium block">
                          {`${data.window.days} Calendar Days`}
                        </span>
                      </div>
                      <span className="text-label-sm text-outline mt-1 block">
                        Commences upon deposit
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-container rounded-lg p-space-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-label-sm font-semibold text-on-surface">
                        Target Delivery Schedule
                      </span>
                      <span className="text-label-sm text-on-surface-variant">
                        Estimated {`~${data.totalHours}`} billable hours
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-surface-container-highest flex overflow-hidden">
                      <div className="h-full bg-primary" title="Phase 1: 35%"></div>
                      <div className="h-full bg-primary-container" title="Phase 2: 40%"></div>
                      <div className="h-full bg-surface-tint" title="Phase 3: 25%"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-label-sm text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                         Brand Identity (35%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                         UX &amp; Wireframing (40%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-surface-tint"></span>
                         Deployment (25%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-headline-sm text-primary">
                        01
                      </span>
                      <div>
                        <h3 className="text-headline-md text-on-surface">
                          Deliverable Scope Breakdown
                        </h3>
                        <span className="text-label-sm text-on-surface-variant">
                          Click headers to collapse or view detailed technical specification
                        </span>
                      </div>
                    </div>
                    <NoteButton label="Comment" kind="section" projectId={data.project.id} proposalId={data.proposal.id} sectionRef="Deliverable scope" className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors flex items-center gap-1.5 text-label-sm" viewerName={data.viewer.name}>
                      <Ico name="chat" />
                      <span className="hidden sm:inline">
                        Comment
                      </span>
                    </NoteButton>
                  </div>
                  {data.proposal.deliverables.map((d) => (
                      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all duration-200" key={d.code}>
                        <div className="p-space-lg flex items-start justify-between cursor-pointer select-none bg-surface-container-low/40 hover:bg-surface-container-low">
                          <div className="flex items-start gap-space-md">
                            <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-mono font-semibold text-label-sm">
                              {d.code}
                            </span>
                            <div>
                              <h4 className="text-headline-sm text-on-surface">
                                {d.title}
                              </h4>
                              <p className="text-body-sm text-on-surface-variant mt-0.5">
                                {d.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-space-sm pl-space-md">
                            <span className="hidden sm:inline-block font-mono text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                              {(d.hours ? `${d.hours} billable hrs` : 'Fixed fee')}
                            </span>
                            <Ico name="chevronUp" />
                          </div>
                        </div>
                        <div className="p-space-lg flex flex-col gap-space-md" id="deliverable-1">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                            {d.items.map((item) => (
                                <div className="bg-surface-container-low p-3.5 rounded-lg flex flex-col gap-1" key={item.title}>
                                  <div className="flex items-center gap-2 text-primary text-body-sm-medium">
                                    <Ico name="menuBook" />
                                    <span>
                                      {item.title}
                                    </span>
                                  </div>
                                  <span className="text-body-sm text-on-surface-variant">
                                    {item.description}
                                  </span>
                                </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-space-xs text-on-surface-variant text-label-sm">
                            <span className="flex items-center gap-1.5">
                              <Ico name="done" />
                               {d.reviewNote}
                            </span>
                            <span className="font-mono text-outline">
                              Target Date: {d.targetDate}
                            </span>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-headline-sm text-primary">
                        02
                      </span>
                      <div>
                        <h3 className="text-headline-md text-on-surface">
                          Payment Milestones &amp; Schedule
                        </h3>
                        <span className="text-label-sm text-on-surface-variant">
                          Linked to verified acceptance criteria and deliverable handoffs
                        </span>
                      </div>
                    </div>
                    <NoteButton label="Comment" kind="section" projectId={data.project.id} proposalId={data.proposal.id} sectionRef="Payment milestones" className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors flex items-center gap-1.5 text-label-sm" viewerName={data.viewer.name}>
                      <Ico name="chat" />
                      <span className="hidden sm:inline">
                        Comment
                      </span>
                    </NoteButton>
                  </div>
                  <div className="bg-tertiary-fixed/30 rounded-xl p-space-md flex items-start gap-space-md shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-tertiary-container text-on-tertiary flex items-center justify-center shrink-0 mt-0.5">
                      <Ico name="waiting" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-body-sm-medium text-tertiary">
                        Deposit Required to Reserve Studio Sprint Capacity
                      </span>
                      <p className="text-body-sm text-on-surface-variant">
                        Milestone 1 must be satisfied before design discovery initiates on 
                        <span className="font-semibold text-on-surface">
                          {data.window.start}
                        </span>
                        . Invoicing generates automatically upon agreement execution.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-space-sm">
                    {data.milestones.map((m) => (
                        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md" key={m.code}>
                          <div className="flex items-start gap-space-md">
                            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-headline-sm text-on-surface">
                               {m.code} 
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-headline-sm text-on-surface">
                                  {m.title}
                                </span>
                                <span className={m.statusClass}>
                                  <Ico name="pending" />
                                   {m.statusLabel} 
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-on-surface-variant text-body-sm flex-wrap">
                                <span className="font-semibold text-primary font-mono text-body-lg-medium">
                                  {m.amountText}
                                </span>
                                <span>
                                  •
                                </span>
                                <span className="flex items-center gap-1">
                                  <Ico name="event" />
                                   Due: {m.dueLabel}
                                </span>
                                <span>
                                  •
                                </span>
                                <span className="bg-surface-container-low px-2 py-0.5 rounded text-label-sm">
                                  Terms: {m.terms}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0">
                            <span className="text-label-sm text-outline">
                              Phase Allotment
                            </span>
                            <span className="text-body-sm-medium text-on-surface">
                              {`${m.percent}%`} of Total
                            </span>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-headline-sm text-primary">
                        03
                      </span>
                      <h3 className="text-headline-md text-on-surface">
                        Working Assumptions
                      </h3>
                    </div>
                    <NoteButton label="Comment" kind="section" projectId={data.project.id} proposalId={data.proposal.id} sectionRef="Working assumptions" className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors flex items-center gap-1.5 text-label-sm" viewerName={data.viewer.name}>
                      <Ico name="chat" />
                      <span className="hidden sm:inline">
                        Comment
                      </span>
                    </NoteButton>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-sm">
                      <Ico name="timer" />
                      <div>
                        <span className="text-body-sm-medium text-on-surface block">
                          Turnaround SLA
                        </span>
                        <p className="text-body-sm text-on-surface-variant mt-1">
                          Client provides prompt review and consolidated sign-off within 
                          <strong className="text-on-surface">
                            48 hours
                          </strong>
                           of sprint submissions to preserve the linear delivery timeline.
                        </p>
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-sm">
                      <Ico name="image" />
                      <div>
                        <span className="text-body-sm-medium text-on-surface block">
                          Asset Readiness
                        </span>
                        <p className="text-body-sm text-on-surface-variant mt-1">
                          High-resolution brand assets, photography, copy drafts, and core product imagery supplied directly by client prior to sprint initiation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-headline-sm text-error">
                        04
                      </span>
                      <div>
                        <h3 className="text-headline-md text-on-surface">
                          Explicit Project Exclusions
                        </h3>
                        <span className="text-label-sm text-on-surface-variant">
                          The following services require an out-of-scope work order:
                        </span>
                      </div>
                    </div>
                    <NoteButton label="Comment" kind="section" projectId={data.project.id} proposalId={data.proposal.id} sectionRef="Explicit exclusions" className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors flex items-center gap-1.5 text-label-sm" viewerName={data.viewer.name}>
                      <Ico name="chat" />
                      <span className="hidden sm:inline">
                        Comment
                      </span>
                    </NoteButton>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                    <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-xs">
                      <Ico name="block" />
                      <div>
                        <span className="text-body-sm-medium text-on-surface block">
                          3D Modeling &amp; Rigging
                        </span>
                        <span className="text-body-sm text-on-surface-variant mt-1 block">
                          Complex 3D character modeling, rigging, or bespoke GLTF shader pipeline authoring.
                        </span>
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-xs">
                      <Ico name="block" />
                      <div>
                        <span className="text-body-sm-medium text-on-surface block">
                          Font Licensing Fees
                        </span>
                        <span className="text-body-sm text-on-surface-variant mt-1 block">
                          Third-party commercial font/typeface licensing fees remain client responsibility.
                        </span>
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-xs">
                      <Ico name="block" />
                      <div>
                        <span className="text-body-sm-medium text-on-surface block">
                          Ad Copywriting &amp; Paid Media
                        </span>
                        <span className="text-body-sm text-on-surface-variant mt-1 block">
                          Advertising campaign copywriting, banner variants, and paid search ad copy creation.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-headline-sm text-primary">
                        05
                      </span>
                      <h3 className="text-headline-md text-on-surface">
                        Revision Policy &amp; Legal Terms
                      </h3>
                    </div>
                    <NoteButton label="Comment" kind="section" projectId={data.project.id} proposalId={data.proposal.id} sectionRef="Revision policy" className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors flex items-center gap-1.5 text-label-sm" viewerName={data.viewer.name}>
                      <Ico name="chat" />
                      <span className="hidden sm:inline">
                        Comment
                      </span>
                    </NoteButton>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-primary text-body-sm-medium">
                        <Ico name="refresh" />
                        <span>
                          Included Revision Quota
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">
                        Each deliverable phase includes 
                        <strong className="text-on-surface">
                          {data.proposal.revisionRounds}
                        </strong>
                        . Revisions consist of bundled adjustments submitted as a single consolidated feedback batch via Cadence portal.
                      </p>
                    </div>
                    <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-primary text-body-sm-medium">
                        <Ico name="editNote" />
                        <span>
                          Out-of-Scope Change Protocol
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">
                        Scope modifications or additional rounds outside the baseline are governed by formal Change Request (CR) documentation with adjusted fee &amp; timeline acceptance before execution.
                      </p>
                    </div>
                  </div>
                  <div className="p-space-md bg-surface-container rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Ico name="contract" />
                      <div>
                        <span className="text-body-sm-medium text-on-surface">
                          {data.proposal.termsLabel}
                        </span>
                      </div>
                    </div>
                    <Link className="text-label-sm text-primary hover:underline font-semibold shrink-0" href="/terms">
                      View Clauses
                    </Link>
                  </div>
                </div>
              </div>
              <aside className="lg:col-span-3 sticky top-20 flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md">
                  <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-highest">
                    <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                      Agreement Summary
                    </span>
                    <span className="px-2 py-0.5 bg-surface-container rounded font-mono text-label-sm text-on-surface">
                      REV 1.0
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-label-sm text-on-surface-variant">
                      Total Contract Fee
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-headline-xl font-bold text-on-surface tracking-tight">
                        {data.money.total}
                      </span>
                      <span className="text-label-sm font-mono text-on-surface-variant">
                        USD
                      </span>
                    </div>
                  </div>
                  <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col gap-1">
                    <span className="text-label-sm text-primary font-semibold uppercase tracking-wider">
                      Milestone 1 Deposit Required
                    </span>
                    <span className="text-headline-md text-primary font-bold tracking-tight">
                      {data.money.m1}
                    </span>
                    <span className="text-label-sm text-outline mt-0.5">
                      Due on sign-off prior to sprint kickoff
                    </span>
                  </div>
                  <div className="space-y-2 pt-space-xs">
                    <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                      <span>
                        Start Date
                      </span>
                      <span className="text-body-sm-medium text-on-surface font-mono">
                        {data.window.start}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                      <span>
                        Target Delivery
                      </span>
                      <span className="text-body-sm-medium text-on-surface font-mono">
                        {data.window.end}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                      <span>
                        Duration
                      </span>
                      <span className="text-body-sm-medium text-on-surface">
                        {`${data.window.days} Calendar Days`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                      <span>
                        Revision Rounds
                      </span>
                      <span className="text-body-sm-medium text-on-surface">
                        {data.proposal.revisionSummary}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-space-sm pt-space-sm">
                    <a className="w-full h-11 bg-primary-container hover:bg-primary text-on-primary text-body-sm-medium rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" href={data.links.sign}>
                      <span>
                        Approve &amp; sign
                      </span>
                      <Ico name="forward" />
                    </a>
                    <NoteButton label="Request changes" kind="change" projectId={data.project.id} proposalId={data.proposal.id} className="w-full h-11 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface text-body-sm-medium rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm" viewerName={data.viewer.name}>
                      <Ico name="feedback" />
                      <span>
                        Request changes
                      </span>
                    </NoteButton>
                  </div>
                  <div className="pt-space-xs flex items-center gap-2 text-on-surface-variant">
                    <Ico name="verified" />
                  </div>
                  <div className="mt-space-xs p-3 bg-surface-container-low rounded-lg flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 mt-0.5">
                      <Ico name="person" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-label-sm text-outline">
                        Questions about this proposal?
                      </span>
                      <span className="text-body-sm-medium text-on-surface leading-tight mt-0.5">
                        {data.studio.contactName}
                      </span>
                      <a className="text-label-sm text-primary hover:underline mt-0.5 font-mono" href="mailto:alex@lumenstudio.co">
                        {data.studio.contactEmail}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm uppercase tracking-wider text-outline">
                      Terms fingerprint (SHA-256)
                    </span>
                    <span className="font-mono text-label-sm text-surface-tint">
                      VALID
                    </span>
                  </div>
                  <p className="font-mono text-label-sm text-on-surface-variant truncate select-all">
                    {`SHA-256: ${data.proposal.digestShort}`}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full bg-surface-container-low mt-space-xl shadow-[0_-1px_6px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-margin py-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <Ico name="shieldCheck" />
          </div>
          <div className="flex items-center gap-space-lg text-on-surface-variant">
            <span className="text-label-sm tracking-wider uppercase">
              {data.project.studioName} © 2026
            </span>
            <span className="h-3 w-px bg-outline-variant"></span>
            <span className="text-label-sm">
              Terms fingerprint recorded
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
