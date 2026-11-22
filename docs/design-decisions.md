# Design decisions

Each entry records the canonical value, the values the screens used, and the reason. Where DESIGN.md's YAML front matter and its prose disagree, the prose wins, because the prose has the component-level detail.

## Colour (light)

| Role | Canonical | Screens used | Reason |
|---|---|---|---|
| Canvas | `#F7F6F2` | `#FAF9F5` (181 occurrences) | Spec prose names this value. Difference is small and the spec is explicit. |
| Surface | `#FFFFFF` | `#FFFFFF` | Already consistent. |
| Border | `#E4E2DC` | `#E3E2DF`, `#BFC9C5` (Material outline palette) | Spec value. The Material greys are the wrong family for a warm canvas. |
| Text primary | `#13181F` | `#1B1C1A` (114 occurrences) | Spec value. Carbon ink reads cooler and is what the spec's contrast work assumes. |
| Text secondary | `#5B6370` | `#5B6370` | Already consistent. |
| Primary accent | `#0E5A4F` | `#0E5A4F` (68) and `#004138` (61) | Two primaries in use. `#0E5A4F` is the spec accent and the button fill. `#004138` is removed. Its role (hover and active) is covered by `#0A4740` and `#073530`. |
| Error | `#A3271C` | `#BA1A1A` (56) | Spec value. The spec says it meets WCAG 2.2 AA. Contrast was not measured in this build, so check it with axe-core when tests are added. |
| Waiting, done, overdue | Spec values | Spec values | Already consistent. |

## Colour (dark)

All dark values come from DESIGN.md. Two are derived, because the spec does not give them:

- `primary-active` dark: `#177565`. Derived to sit one step darker than the spec's hover `#1F9C8A`.
- Status borders in light mode: the spec gives no light borders for status chips. The border matches the subtle background, so the chip has no visible outline in light mode.

## Typography

- **Weights.** Screens load Inter at 100 to 700. The spec uses 400, 500 and 600 only. Weights 100, 300 and 700 are dropped.
- **Scale.** The spec's `headline-xl` at 36px and its `-mobile` variant at 28px become one token plus a responsive override (`text-headline-lg sm:text-headline-xl`). The mobile variants are not separate tokens.
- **Tabular figures.** `.tnum` is applied to money, timestamps, percentages and step numbers. It is not applied to body copy.
- **Font loading.** Inter via `next/font/google`, which self-hosts the font at build time. No request to Google at runtime.

## Shape

The YAML maps `rounded.lg` to 1rem, but the prose says cards are 12px and call that `rounded-lg`. Screens use `rounded-lg` 984 times with no consistent meaning. Decision: name the radii by role (`rounded-card` 12px, `rounded-control` 10px, `rounded-menu` 8px, `rounded-full`). Do not use Tailwind's default radius names for product surfaces.

## Buttons

- All sizes keep a 44px minimum height. The spec sets 44px as the minimum touch target, so the small size changes type size only, not hit area.
- Destructive is text-only, as the spec says. Use it only for irreversible actions (scope deletion, contract cancellation, payment rejection). Those actions also need a confirmation dialog.
- Loading state disables the button and shows a spinner. The spinner is `motion-safe:`, so it stops under `prefers-reduced-motion`.

## Status chips

Every chip pairs a 12px lucide icon with text. Colour is never the only signal, as the spec requires.

## Milestone stepper

- Desktop and tablet (`sm` and up): the full six-stage rail.
- Phone (below `sm`): "Step X of 6", the current stage name, and a six-segment bar. The spec allowed a scroll strip or a step indicator. The indicator was chosen because it reads at a glance and needs no horizontal scroll.
- Only one layout is exposed to assistive technology at a time.

## Breakpoints

The spec's three breakpoints map to Tailwind's defaults with no custom names: phone below `sm` (640px), tablet from `sm`, desktop from `lg` (1024px). Max content width is 1440px.

## Icons

- **Set.** lucide-react only. Material Symbols are removed.
- **Access.** Pages import semantic keys from `lib/icons.ts`, never from lucide-react directly. Renaming a lucide export then needs one edit, not one per screen.
- **Coverage.** 82% of icon uses are mapped. The table is in `docs/icon-map.md`.
- **Filled vs outlined.** Lucide is outline-only. Status is shown by icon shape plus colour plus text, so no filled variant is needed.

## Imagery

- DESIGN.md allows vector schematics, receipt vouchers, scope trees and technical UI previews only.
- The portrait photograph is removed (audit finding 10).
- The logo is a text wordmark until the client supplies a vector logo.
- The two schematic illustrations (audit finding 12) are allowed content. They need to be downloaded, optimised, and served locally, or redrawn in SVG. Not yet done.

## Dark mode

Tokens exist for dark mode and are applied with a `.dark` class on `<html>`. No screen shows a toggle, so the toggle is not built. The dark palette is ready for the first screen that needs it.

## Roles

Screens use Owner, Admin, Member and Viewer. The brief says "reader". Canonical names: `owner`, `admin`, `member`, `viewer`. "Reader" is not used in the code.

## Canonical tokens (revised)

The designs disagree with each other (19 different colour configurations), so one set was chosen. It is the
set the designs share most often and the one the landing and sign-in designs use together:

| Role | Canonical | Notes |
|---|---|---|
| Page background (design `surface`) | canvas `#faf9f5` | Pages use `bg-canvas`. The design class `bg-surface` maps to it. |
| Cards (design `surface-container-lowest`) | `#ffffff` | Cards use `bg-surface` or `bg-surface-container-lowest`. |
| Text (design `on-surface`) | `#1b1c1a` | Our `ink` token has the same value. |
| Secondary text (design `secondary`) | `#575f6c` | |
| Primary text and hover | `#004138` | Design `primary`. |
| Button and fill colour | `#0e5a4f` | Design `primary-container`. Buttons hover to `#004138`. |
| Error | `#ba1a1a` | Replaces the earlier `#a3271c`. |

Dark mode uses the same token names with dark values. The user chooses light, dark, or match-device on the
account page. The choice is stored in a cookie, because there is no user record yet to hold it.

## Ported designs (log-in, sign-up, landing)

Layout, classes and order follow the designs. Changes are listed here so each can be reviewed.

**Landing (landing_page_desktop)**
- Removed the badge text "Protocol v2.4". The version is not real.
- Replaced the metrics "3.4 hrs average sign-off", "< 0.2% dispute rate" and "Zero login" with facts the product
  supports: "No password", "Per milestone", "USD and NGN".
- Removed "legally defensible record", "bank-grade", "encrypted session", "audit hash", "exportable audit packet"
  and "receipt ledger". None is built.
- Removed EUR and GBP. Only USD and NGN are supported.
- Removed "funds deposited or held securely" and "automated escrow". Payments are direct, through a hosted checkout.
- Removed "PCI-DSS Level 1 certified partners" and "Stripe". Paystack is the provider. Flutterwave is a
  planned fallback and is not claimed.
- Removed the comparison lines ("Replaces: DocuSign + Freshbooks + Drive" and similar), the claims "4 disconnected
  subscriptions", "1-minute setup", "90 seconds", "Most popular", "enterprise SLA tracking", "automated
  escalation", "custom contractual clauses" and "guaranteed payment before file unlock".
- Removed "Start free", "View transparent pricing" and the pricing navigation link. Pricing is not set.
- Replaced "change requests with price impact" (+$750, +3 days) with the request-and-reply flow that exists.
- Replaced "shared files with versions" (v2.3, v1.0) with attached deliverables. Versioning is not built.
- Replaced "escrow verification" with "payment schedule".
- Mockup buttons ("Inspect", "Get", "Request edit", "Approve and pay") became plain visuals. A landing
  page must not show controls that do nothing.
- The mockup keeps its sample names and amounts, labelled "Illustration, sample data". This is a marketing
  illustration, not a bound page. It is the one place sample text is kept outside the seed. Confirm or remove it.
- Footer: About, Press, Careers, Integrations and Security were removed, because those pages do not exist.
  "Cadence Systems Inc." became "Cadence", so no legal entity name is invented.
- Added a question the design lacks: "Is the signature legally binding?". The answer says it depends on
  jurisdiction and points to legal advice.

**Log-in (log_in)**
- "Operational Portal • v2.4" became "Operational Portal".
- "Authorized domain required" became "One-time link". The domain check is not enforced.
- Footer links "Security Protocol" and "Status: Operational" became Privacy, Terms and Help. Those pages exist.
- Google sign-in works when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set. Otherwise the button is disabled
  with the reason beside it.
- Passkey sign-in works on browsers that support passkeys. Otherwise it is disabled with the reason beside it.

**Sign-up (sign_up)**
- Removed "SOC-2 Type II Certified", "256-bit Contract Vault" and "Cadence v2.4". None of them is true.
- The form is validated on the server. The details wait for 30 minutes. The sign-in link is then sent to the work
  email. The first sign-in opens onboarding, which creates the studio and makes the user its owner.

**Logo and Google mark**
- The logo is a text placeholder with an accessible name. The design's logo is a hosted image that could not be
  fetched. Replace `components/ui/brand.tsx` when the file is supplied.
- The Google mark is a neutral placeholder. Replace it with the official mark.

## Ported designs (batch 2: email check, expired link, 404, invitation)

**Email check (check_your_email_dual_states, state A)** at `/check-email`
- Shows the address the link was sent to. The address is kept in an httpOnly cookie for 15 minutes, not in the URL.
- The resend button is off for 60 seconds, then sends a new link. The timer is shown.
- "Edit email" and "Use a different email" go back to sign-in.
- State B (expired) is on `/access-problem`. The "Open email app" button opens the mail app with no address.
- The sign-in page and sign-up now hand off here, so the inline "sent" notice is replaced by this page.
- Removed the fake "TOKEN: #8F91" label and the "Protocol v2.4" line.

**Expired or used link (access_problems_fallbacks, expired card)** at `/access-problem`
- The design's sample reference, recipient and timestamps are not shown. This page does not know which link failed.
- Shows the real rules: single-use, 15 minutes. The primary button requests a new sign-in link.
- "Ask the studio for a new link" became a request through sign-in, because the studio has no mailbox to route it to.
- The "TLS 1.3 • SHA-256 VALIDATED" pill and the infrastructure footer were removed. Nothing in the product is measured that way.

**Not found (access_problems_fallbacks, 404 card)** at `app/not-found.tsx`
- The fake "GET /dockets/…" request trace was removed.
- Links go to your projects, log-in and contact. None is a dead link.

**Invitation (invitation_desktop)** at `/invite/[token]`
- Shows the project's real reference, stage, total and schedule, from the invitation. The design's sample client
  name (Sofia Marin, Lumen Coffee Co.) is not shown.
- Removed "escrow protection", "ISO/IEC 27001 Certified Infrastructure", "Verified Studio Dispatch", "Guaranteed SLA delivery",
  "binding scope of work" and "legally acknowledged".
- The design says the client confirms with a one-time code. The product uses a sign-in link to the invited address.
  The copy says so. Changing this to a code would be a deliberate decision, not a copy fix.
- "Open proposal" is the existing acceptance step. It works only when the signed-in address matches the invitation.

## Ported design: proposal review (proposal_review_desktop)

The design is generated from its markup by `scripts/design/h2j.py`, then bound to the `data` prop built on the server
(`server/proposal-review.ts`). Sample content from the design lives in the seed fixture for project CAD-2026-090.

**Removed (claims the product does not make)**
- "US E-SIGN & EU eIDAS enforceability", "256-bit encryption", "cryptographically sealed contract record",
  "secured by Cadence Trust Infrastructure", "Document integrity verified".
- "IP rights assign unconditionally to Cadence Inc. upon final settlement": an IP clause we do not draft or enforce.
- "Invoicing generates automatically upon agreement execution": invoicing is not built.

**Replaced with real data**
- "SHA256: 4f8b91c…" is now the SHA-256 of the terms, computed by `documentDigest`. Its label is "Terms fingerprint (SHA-256)".
  The digest now covers the deliverables, dates, terms label and revision rounds, so the client signs the scope they read.
- Totals, milestone amounts, due dates, terms and percentages come from the milestones. The payment shares are
  30.0%, 40.0%, 30.0%. The design's 35/40/25 split was a conflicting value and is not carried over.
- Money is shown with cents everywhere ($6,000.00). The design rounds some figures to whole dollars.
- Stage, reference, title, client and issue date come from the project and proposal.
- The studio contact (name and address) comes from the seed fixture.

**Controls now wired**
- "Download PDF Copy" opens a printable copy (`/proposals/[id]/print`). Print or save as PDF uses the browser's print
  dialog, so no PDF library is needed. Not a generated PDF file.
- "Add General Note", "Comment" (per section) and "Request changes" open one note dialog. Notes are saved and the studio
  is told through the project's activity log. The dialog button "Attach Note" is "Save note", because notes are not attachments.
- "Approve & sign" goes to the signing page. "View Clauses" goes to the terms page. "Financials & Receipts" goes to payments.
  "Review Stages" goes to the project's pre-work page. "Sign Document" goes to the signing page.
- The design's "Section Note" panel was a static preview; it is replaced by the note dialog.
- The icon-only button in the header was a decorative control with no function, so it was removed with that panel.
- "Standard Lumen Studio Terms v4.2 Applied" is now the proposal's terms label.
- Deliverable D-03 has no hours in the design, so it shows "Fixed fee" rather than "0 billable hrs".

**Still design sample text (not bound)**
- The contract clauses: working assumptions (including the 48-hour turnaround), explicit exclusions, asset readiness,
  font licensing, ad copywriting and the revision-policy paragraph. These are contract wording for each studio. They
  should come from a studio template, and that is not built yet. They are shown as the design wrote them.
- Asset-readiness and turnaround wording describe what the client must do. They are not commitments the product enforces.

## Pricing and billing

One plan set, taken from the pricing and billing designs and limited to what the product enforces (`lib/billing/plans.ts`).

| Plan | Price | Active projects | Notes |
|---|---|---|---|
| Free | $0 | 1 | Clients sign in without a password. Milestone payments in USD and NGN. |
| Pro | $29 a month | 5 | Change requests and replies. Annual billing is $278.40 (20% off twelve months). |
| Studio | $79 a month | Unlimited | Everything in Pro. Annual billing is $758.40. |
| Enterprise | Talk to us | Custom | Not sold through checkout. Links to the contact page, which is the design's "Speak with an Architect". |

**Decision for you to confirm:** the pricing design gives Pro unlimited projects and the billing design gives Studio
a 10-project limit. This set gives Pro five and Studio unlimited, so the two paid tiers differ by something enforceable.
Change `activeProjectLimit` in `lib/billing/plans.ts` if you decide otherwise.

**Billing rules**
- Only the studio owner can start a checkout or cancel. The billing page is for the owner.
- A checkout creates a pending invoice first, then goes to Paystack's page. The invoice is marked paid only after the
  webhook asks Paystack for the charge and its amount and currency match the invoice.
- Renewal is a new checkout. There is no automatic charge, because stored cards and the card-authorisation flow are not built.
- Paying for the plan already in force adds a period to what remains. Changing plan starts a new period from now.
  Unused time on the old plan is not credited (no proration in this release).
- Cancelling keeps the plan until the period ends, then the studio returns to Free. Nothing is refunded.
- An active project is any project not yet closed. Creating one on Free when one is active is refused with a clear
  message. The check is in the server action, before the project is written.
- Subscriptions and invoices are stored in Postgres (`studio_subscriptions`, `billing_invoices`). Migration needed.

**Removed from the pricing and billing designs (claims the product does not make)**
- "Automated escrows", "escrow compliant", "escrow safeguard", "legal hash logs", "cryptographically signed",
  "PDF audit vaults", "256-bit TLS". None is built.
- "Priority email support (4-hour SLA)", "Priority 1-on-1 concierge onboarding", "dedicated concierge and Slack",
  "dedicated client manager portal", "dedicated 24/7 operational SLA".
- "Custom domain" and "custom studio logo and colour accents", "separate workspaces for multiple brands", "SSO".
- "5 team seats included" and "team roles and granular permission matrix". Invitations and role changes are not built.
- "Automatic payment reminder sequences", "in-app dispute mediation flags".
- "Deliverable asset storage 1 GB / 50 GB / 500 GB". Storage is not quota-limited.
- "Archived and completed projects: up to 3" and "client stakeholder seats".
- "Next automatic debit", "payment on file (card ending 4242)", "proration engine v2.4", "prorated credits".
- "Official legal vouchers complying with federal digital services taxation", "VAT / tax identification" and the tax-ID field.
- "Download statements", "load archive from 2025". Invoice PDFs are not built.

## Ported designs: pricing (pricing) and billing (billing_plan)

Built by hand from the designs' own class strings, not with the generator (the generator's bindings are specific to the
proposal review). Plans, prices, limits and the comparison come from `lib/billing`, so the pages cannot disagree with what
is enforced. The marketing header and footer are shared by the landing and pricing pages (`components/features/marketing/site-shell.tsx`).

**Pricing (`/pricing`)**
- Hero with a Monthly / Yearly toggle (the yearly saving is read from the plan code, 20%). Three plan cards, a comparison table, three questions.
- The paid plans' buttons go to `/studio/billing?plan=…&cycle=…`. A visitor who is not signed in is sent to sign in first.
- The design's plans were Free, Pro and Studio with different limits from the billing design's Free, Studio Pro and Enterprise.
  One set is used: Free (1 active project), Pro (5), Studio (unlimited). Enterprise is not sold.
- Plan features were corrected. The only thing that differs between plans, and the only thing the product enforces, is the
  active-project limit. Earlier copy listed change requests as a Pro feature and a "studio view" for Studio. Neither was enforced.
- The badges "Starter", "Recommended" and "Scale" are labels. "Most Popular" was a claim and is not used.
- Removed from the comparison: team seats, storage quotas (1 GB / 50 GB / 500 GB), priority and 4-hour support, concierge
  onboarding, custom domain and branding, SSO, reminder sequences, dispute flags, escrow, audit exports.
- Questions were rewritten to match the product: currency is per project; a milestone's work starts after the provider
  confirms payment (Cadence does not hold funds or chase payments); cancelling runs to the end of the paid period, no refund, no credit for unused time.

**Billing (`/studio/billing`, owner only)**
- Header, current plan card, usage card, a payment card, tier cards, invoice history, cancel row.
- "Entity #0492-OR" is the studio's name. "Download Statements", "Next automatic debit", the registered card, the team-seat and
  storage meters, "Proration Engine v2.4", "Load archive from 2025", the tax-voucher wording and the Enterprise tier were removed. None is built.
- The third card says what is true: charged in USD through Paystack; card details are entered on Paystack's page and not stored.
- Choosing a plan starts a Paystack payment. The current plan's button is "Renew plan", because renewal is manual.
  The Free card links to the cancel row ("Cancel to switch to Free").
- Coming back from Paystack, the page confirms the payment itself using the reference in the return link, so the plan shows at once.
  The webhook arriving afterwards changes nothing.
- A project's usage bar counts projects that are not closed, against the plan's limit.

## Not yet ported

The remaining designs are not yet ported. Those listed in the earlier audit still apply, including the
payment, deliverable, change-request, billing, payout, pricing and email designs. The onboarding page is a
working step, not the design (workspace_setup), and is marked as such.
