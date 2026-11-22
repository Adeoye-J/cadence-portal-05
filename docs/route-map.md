# Route map

Status: **designed** = has a Stitch screen. **derived** = no screen; built from existing patterns (see the note on each).

Access: **public**, **invite** (token-gated), **client** (magic-link signed-in contact on one project), **studio** (signed-in studio member; role in brackets).

Rendering: **static** (pre-rendered), **dynamic** (per request, personalised). Caching for dynamic routes is not yet implemented. The plan is per-tag revalidation, recorded in an ADR when built.

| Path | Purpose | Access | Rendering | Data | Status | Stitch source |
|---|---|---|---|---|---|---|
| `/` | Landing page (design: landing_page_desktop), with claims corrected | public | static | none | built (ported) | landing_page_desktop, landing_page_mobile |
| `/pricing` | Plans, yearly toggle, comparison table, questions | public | static | none | built (ported) | pricing |
| `/log-in` | Log in: magic link, Google (when configured), passkey | public | dynamic | none | built (ported) | log_in |
| `/sign-up` | Create account: holds studio details, sends sign-in link | public | dynamic | pending sign-ups (in memory) | built (ported) | sign_up |
| `/check-email` | Check your inbox: address shown, resend after 60 seconds | public (cookie) | dynamic | none | built (ported, state A) | check_your_email_dual_states |
| `/api/auth/*` | Magic-link request, verify and session (library routes) | public (token) | dynamic | user, session, verification | built (Better Auth; exact verify path to confirm) | email_sign_in_invitation |
| `/access-problem` | Expired or used link, with a request for a new one | public | static | none | built (ported, expired card) | access_problems_fallbacks |
| `/onboarding/workspace` | Creates the studio after first sign-in | signed in | dynamic | studios, memberships | built (working step; design workspace_setup not yet ported) | workspace_setup |
| `/invite/[token]` | Invitation: real stage, total and schedule; open proposal when signed in with the invited address | invite token | dynamic | invitations, projects | built (ported; one-time code replaced by sign-in link) | invitation_desktop |
| `/proposals/[id]` | Proposal review: real totals, schedule, deliverables and fingerprint; notes and change requests saved | contact | dynamic | proposals, notes | built (ported; contract clause text still sample) | proposal_review_desktop |
| `/proposals/[id]/sign` | Sign by typing name | client | dynamic | signatures | built (fixture data; Server Action) | sign_off, sign_off_desktop |
| `/proposals/[id]/signed` | Confirmation; first milestone payment | client | dynamic | proposals, milestones | built (fixture data; payment disabled) | signed, signed_desktop |
| `/projects` | Signed-in client landing: projects where the viewer is a contact | client | dynamic | projects | built (empty and populated states) | none |
| `/projects/[id]` | Client project home | client | dynamic | projects, milestones | built (fixture data, dev viewer only) | client_project_home, client_project_home_desktop |
| `/projects/[id]/pre-work` | Before work starts: sign and first payment | client | dynamic | projects, proposals | built (fixture data; redirects once work starts) | client_project_pre_work_state |
| `/projects/[id]/milestones` | All milestones in order | client | dynamic | milestones | built (fixture data) | milestones |
| `/projects/[id]/milestones/[position]` | Milestone detail and review: approve, or request changes | client | dynamic | milestones, change requests | built (fixture data; the parameter is the milestone position, not an ID) | milestone_detail_desktop, milestone_detail_website_design |
| `/projects/[id]/milestones/[mid]/sign-off` | Merged into the milestone detail page (approval panel) | client | dynamic | milestones | merged | change_request_review |
| `/projects/[id]/milestones/[mid]/pay` | Choose payment method | client | dynamic | payments | not built: the provider checkout offers the methods | choose_payment_method, choose_payment_method_desktop |
| `/projects/[id]/payments/[reference]` | Processing, confirmed, or not completed; refreshes while pending | client | dynamic | payments | built (fixture data; Paystack) | payment_processing_confirmed_*, payment_not_completed |
| `/projects/[id]/deliverables/[fid]` | Review a deliverable and its file | client | dynamic | files, milestones | designed | deliverable_review, deliverable_review_desktop |
| `/projects/[id]/files` | Deliverables grouped by milestone, with download | client | dynamic | files | built (fixture data) | client_files, project_files |
| `/projects/[id]/changes` | Change requests and studio replies | client | dynamic | change requests | built (fixture data) | project_change_requests |
| `/projects/[id]/changes/new` | Separate change-request form | client | dynamic | change requests | not built: requests are made from the milestone page | request_changes, request_changes_desktop |
| `/projects/[id]/timeline` | Activity timeline, client-visible events only | client | dynamic | events | built (in-memory events) | project_timeline |
| `/projects/[id]/complete` | Handover: milestones delivered, file count, activity link | client | dynamic | projects, files | built (shows Not complete yet until every milestone is approved) | project_complete_desktop, project_complete_mobile |
| `/payments` | Payment history across the client's projects | client | dynamic | payments | built (fixture data) | payment_history |
| `/payments/[txId]` | Transaction detail. Receipt is a modal | client | dynamic | payments | designed | transaction_detail, milestone_invoice_receipt_modal |
| `/notifications` | Client-visible activity across projects | client | dynamic | events | built (no read state yet) | notification_centre |
| `/studio` | Redirects to `/studio/projects` | studio | dynamic | none | built | none |
| `/studio/projects` | Projects portfolio (empty, loading, error and populated states) | studio [any] | dynamic | projects | built (fixture data) | projects_dashboard |
| `/studio/projects/new` | Proposal builder: client, project, currency, milestones, revision terms | studio [owner, admin, member] | dynamic | projects, proposals, milestones | built (fixture data; viewers get 404) | proposal_builder |
| `/invite/[token]` | Client invitation: review the project, sign in with the invited address, accept | invite token | dynamic | invitations, projects | built (fixture data; Stitch invitation screens) | invitation, invitation_desktop |
| `/studio/projects/[id]` | Studio project detail: proposal state, milestones, send to client | studio [any] | dynamic | projects, proposals | built (fixture data) | none |
| `/studio/projects/[id]` | Studio view of one project | studio [any] | dynamic | projects, milestones | designed (assumed mapping, see assumptions) | project_overview |
| `/studio/projects/new` | Proposal builder: scope and work breakdown | studio [owner, admin, member] | dynamic | proposals, scope items | designed | proposal_builder |
| `/studio/clients` | Clients directory: one row per client, with their projects | studio [any] | dynamic | projects | built (fixture data) | clients_directory |
| `/studio/payments` | Payments ledger | studio [owner, admin] | dynamic | payments | built (fixture data; not shown to members or viewers) | payments_ledger |
| `/studio/settings/team` | Team and roles, read-only (inviting and changing roles not built) | studio [any] | dynamic | memberships | built (read-only) | team_roles |
| `/studio/settings/payouts` | Workspace payouts | studio [owner] | dynamic | none | not built (no payout account model yet) | settings_workspace_payouts |
| `/studio/settings/billing` | Studio subscription | studio [owner] | dynamic | none | not built (no billing provider chosen) | billing_plan |
| `/account` | Profile, theme, passkeys, sign-out and data page link | signed in | dynamic | users | built (theme and passkeys added) | account |
| `/account/data` | Data export link and account deletion request | signed in | dynamic | users, deletion requests | built (deletion is recorded, handled by a person) | none |
| `/help` | Help and FAQ | public | static | none | built | none |
| `/contact` | Shows the support address when set; no contact form | public | static | SUPPORT_EMAIL | built | none |
| `/terms` | Terms of service (draft, needs counsel) | public | static | none | draft | none |
| `not-found` | 404 | public | static | none | built (placeholder styling) | none |
| `error` | Global error boundary | public | static | none | derived | none |

## Not routes (email templates)

These four Stitch canvases become React Email components in `emails/`. They are not web pages.

| Template | Stitch source | Trigger |
|---|---|---|
| Sign-in invitation (one-time access link) | email_sign_in_invitation | magic-link request |
| Approval needed / payment reminder | email_approval_needed_payment_reminder | milestone awaiting approval or unpaid |
| Change request approved or declined | email_change_request_approved_declined | studio decision on a change request |
| Payment received, milestone ready | email_payment_received_milestone_ready | verified webhook from payment provider |

## Excluded pages

| Page | Reason |
|---|---|
| Forgot password, reset password | Sign-in uses magic links. There are no passwords to reset. |
| Two-factor set-up | Not in the designs. Magic-link sign-in is the second factor. Revisit if studios require it. |
| Dark-mode toggle | DESIGN.md defines dark tokens, but no screen shows a toggle. Tokens exist; the control is not built. |

| `/api/webhooks/paystack` | Provider webhook: verifies signature, settles from a provider lookup | provider (signed) | dynamic | payments | built (not run) | none |
| `/api/jobs/notifications` | Sends queued notifications. Bearer CRON_SECRET required. Returns counts only. | cron (secret) | dynamic | notification_outbox | built (not run; needs migration) | none |

| `/payments/[reference]` | One payment's detail | client | dynamic | payments | built (fixture data) | transaction_detail |
| `/api/account/export` | The viewer's data as JSON, never cached | signed in | dynamic | as export | built | none |
| `/privacy` | Privacy notice (draft, needs counsel) | public | static | none | draft | none |
| `/cookies` | Cookie notice (draft, needs counsel) | public | static | none | draft | none |
| `/proposals/[id]/print` | Printable copy of the proposal; print or save as PDF from the browser | contact | dynamic | none | built (new) | proposal_review_desktop (Download PDF Copy) |
| `/pricing` | Pricing page (design: pricing) with the plans above | public | static | none | planned (not built) | pricing |
| `/studio/billing` | Plan in force, usage, tiers with checkout, invoices, cancel; confirms a returning checkout | studio owner | dynamic | subscriptions, invoices | built (ported) | billing_plan |