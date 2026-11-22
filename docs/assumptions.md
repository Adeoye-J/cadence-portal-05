# Assumptions

Each entry is a judgement made where the brief or the designs were unclear. Revisit any of these before launch.

1. **Product name is Cadence.** Taken from the Stitch page titles ("Cadence | Client Delivery Portal") and the "Cadence Access" sign-in screens.

2. **Payments: Paystack first, Flutterwave fallback.** Section 0 of the brief names these. Section 3 names Stripe. Section 0 is more specific to this product and wins. Stripe is not used. See `docs/adr/0004-payments.md`.

3. **Authentication: magic link, with Better Auth.** Section 0 says "more like magic link", and the screens show a one-time access link. The brief's examples (Auth.js, Clerk, Supabase Auth) all fit, but Better Auth was chosen because it supports magic links with our own Postgres sessions and has no per-user fee. See `docs/adr/0003-authentication.md`.

4. **Hosting: Vercel.** Section 0 leaves this open. Vercel's default output is used, not `output: "standalone"`, which is for container hosts.

5. **Database: PostgreSQL with Drizzle ORM.** See `docs/adr/0002-data-layer.md`.

6. **Roles.** The brief says admin, owner, reader. The screens say Owner, Admin, Member and Viewer. Canonical names are `owner`, `admin`, `member`, `viewer`. The brief's "reader" maps to `viewer`. Clients are a separate kind of user: a client contact is scoped to one project and is not a studio member.

7. **Studio side and client side are separate surfaces.** Clients never see the studio console. Studio members never see the client sign-off flow except as a preview.

8. **`project_overview` is the studio's view of one project.** The screen shows the project's overview with a "Brand identity and website" heading. Its navigation matches the studio console, not the client portal. This mapping is a guess. Confirm it with the design owner.

9. **`change_request_review` is milestone sign-off.** The screen's heading is "Milestone Sign Off". It is mapped to the milestone sign-off route, not to the change request list.

10. **Portrait photograph removed.** DESIGN.md forbids stock imagery of people. The image is not carried into the build, even though it is in the export.

11. **Logo is text until a vector logo arrives.** The Stitch logo is hosted on Google's servers and is raster. A text wordmark is used so the build does not depend on an external image.

12. **Client-facing share link is not reproduced.** The Stitch link was for one sample project. The app generates real links.

13. **Sample data is seed-only.** "Lumen Coffee Co.", "Acme Studio Ltd" and "Marcus Vance" appear in the designs. They are used in `db/seed` (not yet built) and never in production components.

14. **Currency is locked per project.** DESIGN.md forbids dual currency on one milestone stream. The model stores currency on the project, and the UI shows only that currency.

15. **Forgot password and password reset are excluded.** Magic-link sign-in has no password.

16. **Dark mode is tokens only.** DESIGN.md defines dark values, but no screen shows a toggle. The toggle is not built. The brief says implement dark mode only if the designs define one, and the designs define the tokens but not the control.

17. **Inter weights 400, 500, 600.** DESIGN.md uses 400 and 600 in its tables and 500 in medium variants. Weights 100, 300 and 700 appear in the screens but not in the spec, so they are dropped.

18. **Brief Section 6 `app/(auth)` and `app/(app)` groups are used for the client and studio surfaces.** Client routes live under `app/(client)`, studio routes under `app/(studio)`. Auth pages stay under `app/(auth)`. This differs from the brief's layout, because the brief's `(app)` group would mix two audiences with different navigation.

19. **No tests exist yet.** The brief requires Vitest, Playwright, axe-core and Lighthouse CI. None is written in this build. They are the next phase, not optional.

20. **Escrow and compliance claims are not built.** The client project screen describes an "Automated Escrow Protocol", says funds are "held safely", and shows badges for SOC2 Type II, PCI-DSS Level 1, ISO 27001, AES-256-GCM and "TLS 1.3 Certified". Holding client money in escrow is a regulated activity, and the studio has not supplied evidence for any certification. None of this is in the build. Decide with the studio and legal before any escrow or security-certification wording ships.

21. **Payment model is direct settlement, pending item 20.** A successful milestone payment settles to the studio. The build does not hold funds. The design's wording "Pay Milestone 2 to initiate website design & UX" is used as the rule: work on a milestone starts when its payment settles.

22. **Placeholder session is not a security control.** `lib/session.ts` returns a demo viewer only when `DEV_DEMO_VIEWER=1` and `NODE_ENV` is not `production`. Anyone who controls the environment can use it. It exists so pages can be reviewed before Better Auth is wired.

23. **Unauthenticated visitors are redirected to `/log-in`, which is not built.** Until auth lands, they reach the 404 page. This is a known gap, not intended behaviour.

24. **Fixture data is the design's own sample.** Amounts ($1,800, $2,400, $1,800 totalling $6,000), due dates (18 Nov, 20 Nov, 12 Dec 2026) and names (Lumen Studio, Apex Holdings LLC) are copied from the Stitch screen. They live in `db/fixtures/` and are not used in production paths.

25. **Some screen text is not carried over.** Sample contact details ("phone bridge"), a "Priority" dispatch control and the "Cryptographically signed" wording are not built. None of them has a defined behaviour yet.

26. **Sign-off is a typed-name record, not a qualified electronic signature.** The Stitch sign-off screen says the agreement is "legally binding", cites the US E-SIGN Act and eIDAS, and mentions a "notary timestamp authority" and "RFC 6979 ECDSA". The build records the typed name, a UTC time and a SHA-256 digest of the terms. It makes no claim of legal enforceability and uses no certificate or trust service. Legal review decides what the record can be relied on for, and whether the studio needs a qualified signature provider.

27. **Work split conflicts across screens.** The review screen lists Brand Identity 35%, UX and Wireframing 40%, Deployment 25%. The sign-off and payment schedule list milestones at 30%, 40% and 30% ($1,800, $2,400, $1,800). The payment schedule is used, because it sets the amounts paid. The 35/40/25 split is not carried over. Confirm with the studio.

28. **Client and studio names conflict across screens.** The project screen names the client Apex Holdings LLC. The review screen names Lumen Coffee Co. The sign-off screen names Lumen Studio LLC. The fixtures use Lumen Studio and Apex Holdings LLC throughout.

29. **Proposal and signature writes use an in-memory store.** This is a development shortcut. Writes reset on restart and are not shared between server instances. Do not deploy this to production.

30. **Proposal review shows only what the design states.** Scope is the three milestone descriptions from the payment schedule. The per-deliverable hours, the Download PDF control and the Add General Note control are not built. Comments and PDF export are not designed in enough detail yet.

31. **Better Auth API is written from memory and unverified.** The code uses `betterAuth`, the Drizzle adapter, the `magicLink` plugin with `expiresIn` and `sendMagicLink`, `toNextJsHandler`, `createAuthClient` with `magicLinkClient`, and `signIn.magicLink` with `callbackURL` and `errorCallbackURL`. Core table and column names in `db/auth-schema.ts` are also from memory. Check each against the installed version before the first run. Confirm where `errorCallbackURL` redirects on an invalid token.

32. **No middleware or proxy yet.** Protection is enforced in each page and Server Action through `getViewer()`. The brief asks for a fast redirect layer as well. Add it once the Next.js version's file convention is confirmed (versions.md).

33. **Anyone can create an account.** Requesting a link creates a user on first use. Project access is still limited to listed contacts, so a new account sees an empty project list. Decide whether studios need invite-only sign-up.

34. **Migrations are not generated.** Run `pnpm db:generate` once the packages are installed, then `pnpm db:migrate` against a real Postgres. Until then the tables do not exist, and sign-in fails with a database error.

35. **Development email goes to the console.** The dev sender prints the sign-in link. Production with no email configuration fails loudly, by design.

36. **Sign-in has no rate limit yet.** The brief requires rate limiting on sign-in and password reset. Better Auth has a rate-limit option, but it needs shared storage (Upstash) to work across instances. Not wired.

37. **Only Paystack is built.** Flutterwave is the fallback in the brief, and the `PaymentProvider` interface is ready for it. It is not built, so there is no automatic fallback yet.

38. **Settlement comes from the webhook only.** The webhook checks the HMAC-SHA512 signature on the raw body, then asks Paystack for the charge. Only a confirmed success with a matching amount and currency marks a payment paid. The browser redirect never settles anything. The status page reads the recorded state.

39. **The choose-payment-method screen is not built.** Paystack's hosted checkout offers the methods. The design's own method picker is not needed for this flow.

40. **USD through Paystack depends on the account.** Paystack must have USD enabled for the studio's account. Confirm this before launch. If it is not enabled, USD projects need another route.

41. **Payments use an in-memory store.** Settlement is not transactional yet. Before production, settle in one database transaction with a conditional update (status not paid). The unique index on (provider, provider_reference) in db/schema.ts already blocks duplicate payment rows.

42. **No receipt or "payment received" email yet.** The template exists in the design (email_payment_received_milestone_ready). The send call is not wired.

43. **The webhook URL must be set in the Paystack dashboard.** Use {APP_URL}/api/webhooks/paystack. Paystack's dashboard needs the test and live keys set separately. Test the signature path before going live.

44. **Studio roles are read but not enforced on writes yet.** Any member can see the dashboard. Role checks (owner, admin, member, viewer) come with the first write action, the proposal builder. Until then, a member and an owner have the same access.

45. **The sidebar shows only built routes.** The design's other studio items (clients, payments, team, billing) have no page yet. A link to a missing page is a dead interaction, so those items are added to lib/nav.ts only when their routes ship.

46. **Studio dashboard cards are not clickable yet.** The studio project detail page is not built. Linking to the client view would show the client's version, which is the wrong surface for the studio.

47. **Development viewers.** DEV_DEMO_VIEWER=1 or client gives the seeded client contact. DEV_DEMO_VIEWER=studio gives the seeded studio owner. Both are honoured only in development.

48. **Sending needs a client contact that already exists.** The client sees a proposal only through a project they are listed on. Client invitations (the Stitch invitation screen) are not built, so a studio cannot yet invite a new client. Until they are, the send action refuses with a message that says so.

49. **Drafts and sent proposals live in memory.** They reset on restart. Production needs transactions for create and send, and the schema's unique index on (project, version) blocks duplicate version numbers once they are stored.

50. **Amounts are typed in major units and stored in minor units.** Values are rounded to the nearest minor unit. The form accepts two decimal places, but a value with more is rounded, not rejected.

51. **Version numbers start at 1 when the first proposal is sent.** A draft has no version. Each later send adds one to the highest sent version.

52. **Sending does not email the client yet.** The proposal email is not in the design set. Until it is, the studio has to tell the client it is ready.

53. **Roles are enforced on create and send.** A viewer gets a 404 on the builder and a refusal on the send action. Owners, admins and members can write.

54. **Invitation tokens are hashed.** The token is 32 random bytes, sent once in the email, and stored only as a SHA-256 hash. The link is single use and expires after 14 days.

55. **Only the invited address can accept.** The viewer's session email must match the invited address, compared without case. A forwarded invitation therefore cannot grant access. Acceptance is a button, so an email link scanner or prefetch cannot accept it.

56. **Sign-in returns to the invitation.** The invitation page passes a next parameter to sign-in. safeNextPath accepts only same-origin paths.

57. **Resending creates a new invitation.** The earlier link stays valid until it expires. A future change should revoke the older links when a new one is sent.

58. **The invitation email wording is not from the design.** The email template uses the design's invitation headline and body text, with copy written for this build. Review it with the studio before launch.

59. **This resolves item 48.** Clients can now be invited, so a studio can send a proposal without an existing contact. Sending still needs at least one accepted invitation, because the send action checks for a contact.

60. **Milestones are addressed by position in the URL.** The route is /projects/[id]/milestones/[position]. Stable IDs come with the database, so the URL will change then.

61. **Superseded by items 81 to 88.** Deliverables can now be uploaded. The deliverable file inspector from the design is still not built.

62. **Approval uses a confirmation checkbox, not a typed name.** The typed-name record is used for the proposal only. Whether approvals need the same legal review as item 26 is an open question.

63. **The project moves to Completed only when every milestone is approved.** No "Review" stage is set automatically, because the design does not say what starts or ends it.

64. **Change requests are stored and shown to the client, but the studio has no response screen yet.** Requests are not emailed to the studio.

65. **Approval cannot be undone.** There is no un-approve. A correction after approval would be a new change, not an edit.

66. **Visibility is set by the event kind.** Each kind is marked client-visible or studio-only in one table (server/events.ts). A new call site cannot expose a studio-only event by mistake, but a new kind must be added to that table.

67. **Event summaries are short and contain no payment details or message text.** Change request text is kept in its own record, and the timeline shows only the fact that changes were requested.

68. **Events are not yet tied to a real timestamp source.** They take the server's clock. Production should use the database's clock, so the order holds across servers.

69. **The audit trail is append-only in code, not yet in the database.** Production needs an insert-only table and no update or delete permissions.

70. **A studio reply does not change the milestone's status.** The milestone is returned to in progress when changes are requested, and the studio marks it delivered again when the work is ready. The reply explains what was done. Each change request takes one reply, and a second reply is refused.

71. **Superseded by item 72.** Replies and change requests were first shown in the app only. Email notifications now cover them.

72. **Notifications are driven by the event log.** Each recorded event is passed to the notifier, so a new write path gets email without a separate call. Kinds with no plan (proposal drafted, invitation sent, payment started) send nothing.

73. **Who is notified.** Client emails go to project contacts. Studio emails go to owners and admins only, so members and viewers are not sent operational mail by default. Change the rule in server/notify-core.ts (PLAN) if the studio wants members copied.

74. **Superseded by items 76 to 80.** Notifications now go through a durable outbox, and a scheduled job sends them.

75. **Recipient emails come from a directory.** The development directory knows only the two seeded users. Real delivery needs the users table, and a user with no email on file receives nothing, silently.

76. **Notifications use a database outbox.** A write queues one row per recipient, keyed by the event number and the address, so a repeat cannot queue twice. A scheduled job at /api/jobs/notifications sends due rows. A failed send is retried after 2, 4, 8 and 16 minutes, then marked dead after five attempts.

77. **Delivery is at least once.** If the process stops after a send succeeds and before the row is marked sent, that email is sent again. The dedupe key stops double queueing, not double sending. Accept this for transactional email, or add a provider idempotency key if the provider supports one.

78. **The scheduled job needs CRON_SECRET, and refuses requests without it.** Vercel sends the secret as a Bearer token. Cron frequency depends on the Vercel plan. vercel.json asks for every five minutes, and the plan may allow less. Check before relying on timing.

79. **Outbox rows hold personal data.** Recipient addresses and message bodies are stored. Sent rows need a purge job after a set retention period, which is not built.

80. **The database outbox is not yet run.** DrizzleOutbox (server/outbox-drizzle.ts) and the notification_outbox table need a generated migration, an applied database, and a check against the installed drizzle-orm version. Until then, notifications are queued in memory only and are lost on restart.

81. **Files never pass through the app server.** The studio asks for a presigned upload URL (15 minutes). The browser sends the bytes to object storage. The server then reads the stored size and the first 16 bytes before the file counts as a deliverable.

82. **The real content is checked, not the declared type.** A file must start with the signature of its declared family: PDF, PNG, JPEG, or ZIP (which covers the Office formats). A mismatch deletes the object. The accepted-types list in the file picker is only a convenience. The server check is the one that counts.

83. **Size is checked after upload, not at the start.** A presigned PUT cannot enforce a size limit without signing the content length. An oversize file therefore transfers before it is rejected and deleted. A bucket lifecycle rule should cap object size, and this is still to add.

84. **Downloads are presigned for five minutes and force a download under the stored filename.** Only project contacts and studio members get a link. A stranger is refused with the same message as a missing file.

85. **Abandoned uploads are swept daily.** A pending record older than 24 hours, and its object, are removed by /api/jobs/files-cleanup (Vercel cron, bearer CRON_SECRET). Confirmed files are not touched.

86. **File records are in memory.** Restarting the server loses the records, while the objects remain in the bucket and become orphans. Production needs a files table, which is not yet in the schema.

87. **The signer is checked against AWS's published example, and nothing else.** The signature for AWS's documented presigned GET matches exactly (tests/unit/sigv4.test.ts). The head, read and delete requests, and the unsigned Range header, have not been run against Cloudflare R2 or MinIO.

88. **CSP allows the storage origin for uploads.** next.config.ts adds STORAGE_ENDPOINT_URL to connect-src. It reads that variable directly, not through the validated environment, so keep the two in step.

89. **Studios can remove a deliverable until its milestone is approved.** The removal is recorded in the studio-only activity trail, and the client does not see it. Approval is the client's record, so the file is locked after approval.

90. **Removal is two presses, not a dialog.** The first press arms the control, and the second removes the file. The brief asks for a confirmation dialog for destructive actions, and this is a deliberate lighter-weight form of confirmation. Revisit if the design calls for a modal.

91. **Cron authorisation is one shared helper.** Both scheduled jobs use lib/cron-auth.ts. It compares the bearer secret in constant time, and refuses every request when no secret is set.

92. **Every Material icon name is mapped, and lucide-names checks the names after install.** 1,537 of 1,537 icon uses map to a semantic key. 84 of the lucide export names were picked from memory because lucide-react could not be installed. A wrong name fails the typecheck. Nothing else depends on it, so the fix is one line in lib/icons.ts.

93. **The seed script refuses to run in production.** It writes the design's sample studio, client and projects, and nothing else. Every insert ignores rows that already exist. The row mapping is tested. The inserts have not run against a database.

94. **The seed script runs through tsx.** tsx is a development dependency, added so that path aliases resolve outside Next.js. Confirm the version when the lockfile is generated.

95. **Events are written after the change, not inside it.** A crash between a write and its event loses the event and its notifications. This is harmless in memory, where everything resets anyway, and it matters once Postgres holds the data. ADR 0006 moves events and the outbox into the same transaction as the change. Until then, no environment with real users should depend on the activity log or on notifications.

96. **Seven stores live in process memory.** Events, file records, invitations, change requests, payments, signatures and the outbox fallback. ADR 0006 lists each one and the repository that replaces it.

97. **Five icons were swapped after the first install.** lucide-react 0.383.0 does not export IdCard, ShieldUser, CloudAlert, CloudCheck or MapPinPlus. They now map to User, Shield, CloudOff (new import), Cloud and MapPin. The meanings are close but not identical. A newer lucide version may have the originals; if so, prefer them and bump the range deliberately.

98. **The three import checks skip scripts/.** The check scripts match import text in their own source, which made them report false positives. The scripts are still linted.

99. **Dynamic typed-route links go through routeTo.** Next types a template path such as `/projects/${id}` as a plain string when it is built in an object literal, and the typed link prop rejects it. lib/routes.ts narrows such paths explicitly. This is a cast, so it relies on the paths being built from our own patterns and IDs.

100. **Configuration is checked at boot, not at import.** lib/env.ts, db/client.ts and lib/auth.ts create their values on first use. instrumentation.ts validates the environment when the server starts, so a bad configuration still stops the server with a message naming each variable. `next build` needs no secrets. The CI placeholders are no longer needed for the build.

100. **Blank environment values count as unset.** A copied .env.example has blank optional lines, and they must not fail validation. A value that is set but too short (for example a 10-character CRON_SECRET) still fails, and the message names the variable.

101. **The landing page makes no claims the product does not back.** The Stitch copy includes measured results (average sign-off time, dispute rate), certifications and "bank-grade" security, EUR support, a free tier, an "exportable audit packet" and "held escrow" funds. None is built or measured, so none appears. Add a claim only when it is true and can be shown.

102. **Legal pages are drafts.** Terms, privacy and cookies carry section headings only, and a banner until counsel has written and reviewed them. Nothing in them should be published as final.

103. **Account deletion is recorded, not performed.** A request is stored and handled by a person. Nothing is deleted automatically. The page says studio records may be kept. Confirm that with counsel, and set a processing time before promising one.

104. **The data export holds only what the viewer can already see.** It covers their projects, milestones, payments, change requests with replies, and client-visible activity. It excludes studio-internal events and other clients' data. Review it against the privacy notice.

105. **The notification centre has no read state.** It shows the latest 50 client-visible events across the viewer's projects.

106. **The team page is read-only.** Inviting members and changing roles are not built.

107. **The payments ledger is limited in the data layer.** Members and viewers get no list, not just no page, and the nav hides the item from them.

108. **Billing, payouts, pricing, sign-up and a separate change-request form are not built.** Their links are absent. The change-request form is replaced by the request action on each milestone page.

109. **Sign-out uses the auth client.** Whether the server revokes the session depends on Better Auth's sign-out behaviour, which is unverified.

110. **The contact page shows an address, not a form.** It reads SUPPORT_EMAIL and says so when it is blank.

111. **The account page is read-only.** Changing the name or email is not built.

112. **Theme is stored per browser.** The light, dark or match-device choice lives in a cookie, because no user record exists to hold it. Once the database is wired, the same value moves to the user's record and the cookie becomes a cache.

113. **Google and passkey sign-in rely on documented library behaviour that has not been run.** The Google provider uses Better Auth's social provider configuration. The passkey plugin is @better-auth/passkey, and its options and table columns come from memory. Check both against the installed versions before the first run (docs/versions.md).

114. **Pending sign-ups and new studios are in memory.** A restart loses them. Production needs a table for each.

115. **The full name from sign-up is not saved to the user record.** Better Auth creates the user, and no database write exists yet. The name shows on the onboarding step and the studio record only.

116. **The onboarding step is a working page, not the design.** The workspace_setup design has not been ported. The page keeps the same details and creates the studio.

117. **The design's sample mockup on the landing page is kept as an illustration.** It is labelled as sample data, and it is the only exception to "sample text only in the seed". Confirm it or remove it.

118. **Only the first design batch is ported.** Log-in, sign-up, landing, onboarding and account. The other designs are listed in docs/design-decisions.md and are still to do.

119. **Visual fidelity has not been measured.** The ported pages have not been rendered in a browser against their screen.png references. The Playwright visual check runs on your machine, where the fonts and images load.

120. **The client's confirmation is a sign-in link, not a one-time code.** The invitation design says the client confirms with a one-time code. The product uses a single-use magic link to the invited address. The copy follows the product.

121. **The email check page shows the address from a cookie.** The cookie is httpOnly and lasts 15 minutes. Anyone using this browser within that time can see the address on this page.

122. **The expired-link page shows no details.** It does not know which link failed, so it does not show a reference, recipient or time.

123. **Only three more designs are ported in this batch.** Proposal review, sign-off and the signed confirmation are still to do. Their markup is large, so they are the next batch.

124. **Client notes reuse the "changes requested" activity event.** That way studio notifications already exist. A dedicated proposal-note event would also need notification templates. Add it when the notification copy is written.

125. **Notes are held in memory.** A restart loses them. Production needs a table, and it should be written in the same transaction as the activity event.

126. **"Download PDF Copy" is the browser's print to PDF.** No PDF library is installed. A generated PDF file is a later addition if studios need one.

127. **Signatures made before the digest change will not match.** The digest now covers deliverables and dates. In-memory signatures reset on restart, so this only matters for a signature saved before the change. Production needs a migration plan before the first real signature.

128. **Contract clause text on the proposal is design sample.** Working assumptions, exclusions, asset readiness, font licensing, ad copywriting and the revision-policy paragraph are not bound. A studio template should supply them.

129. **Subscriptions are charged in USD through Paystack.** The Paystack account must accept USD. If it does not, subscriptions need a NGN price as well.

130. **Renewal is manual.** A studio pays again at the end of the period. Automatic renewal needs stored authorisation from Paystack, which is not built.

131. **Settlement is idempotent by check, not by lock.** Settling the same reference twice gives "already settled", but two webhook deliveries that arrive at the same instant could both pass the check. The database should use a conditional update on the invoice status. Add that before launch.

132. **Everything the app stores is in Postgres.** Billing, signatures, proposal notes, pending sign-ups, the core domain, the activity log, the notification queue, invitations, change requests, files, payments and account deletion requests. Nothing is kept in memory in production code. The in-memory store exists for tests and for local work without a database, and production refuses to start without the database store.

133. **The plan check counts active projects from the store.** It reads the studio's projects and counts those not yet closed. It is checked before a project is written and is not atomic with the write: two simultaneous creations on Free could both pass. Add a conditional insert or a lock if that matters.

134. **Enterprise is not checked out.** The pricing page offers a contact route, not a payment.

135. **Settlement is now one conditional transaction.** The invoice is marked paid only where it is still unpaid, and the subscription is written in the same transaction, with the subscription row locked. A second delivery matches no row and changes nothing. This closes the race noted in item 131 for the Postgres store. The in-memory store makes the same check and write without an await between them.

136. **Signatures are race-safe.** The unique index on proposal_id means two signing attempts cannot both be recorded. The loser gets "already signed".

137. **Projects, proposals and milestones are now in the store.** The Postgres store needs the migration and the seed (docs/first-run.md, section 7). The in-memory store used by the tests reads the fixture arrays, so tests that set up state by editing them still work.

138. **Demo viewers are database users only after the seed.** The seed inserts the two demo users with the ids the development override uses. Without the seed, a write that refers to them fails on the foreign key.

139. **Production refuses to run without a store.** If instrumentation fails to set the Postgres store, requests fail with a clear error. They never fall back to memory silently.

140. **Commands, not saves.** Every change to project state is a store command that checks the state it depends on in the same statement (the milestone must be in the status the caller read, the proposal must still be sent). A caller that read a stale state gets "this milestone has just changed", not a silent overwrite. The in-memory store hands out copies, so code that edits a record without calling a command changes nothing, as it would against the database.

141. **A payment and its milestone settle in one transaction.** The payment is marked paid, the milestone moves from payment due to in progress, and the event and notification rows are written together, only if the payment was not already paid. A second charge for a milestone that is already in progress is still recorded as paid, the milestone is not moved, and a warning is logged. Nothing refunds that charge.

142. **Project references use a fixed year.** New projects are numbered CAD-2026-NNN, continuing from the highest number. The year does not change. Decide on the numbering rule before the new year.

143. **Project reference numbers are taken under a database lock.** The Postgres store takes an advisory lock for the length of the transaction, so two projects created at the same moment get different numbers. The unique index on the reference is the second guard.

144. **Milestone description and terms are stored.** The seed already tried to store a milestone description, but the table had no column for it, and the text was dropped without an error. Both columns exist now, and so do the proposal's dates, terms label, revision wording and deliverables (JSON).

145. **Notification recipients are looked up when the event is handled.** The activity log is still in memory, so the notification for an event is planned in the same process that recorded it. The recipients' addresses come from the users table. Users with no address are skipped.

146. **Deliverables are stored as one JSON value on the proposal.** They are read and written as a whole. If studios need to search deliverables or reuse them across proposals, they need their own tables.

147. **Events and notification emails are written with the change that causes them.** Each store command takes the effects (events and queued emails) and writes them in its own transaction, so a change never exists without its event, and no email is queued for a change that did not happen. Nothing listens for events any more. A change that does not go through a command that takes effects leaves no event and sends no email.

148. **Notification recipients are planned before the transaction.** The recipients and message text are worked out just before the command runs. If a project's contacts change in between, the email goes to the earlier set. The window is milliseconds.

149. **One open payment per milestone, enforced by the database.** A partial unique index allows one pending payment per milestone. A second click is given the first payment's page. A pending payment older than 30 minutes is treated as abandoned: it is marked failed when a new payment is started. If the client completes an abandoned payment after that, the provider's confirmation still settles it, so a client who pays twice is charged twice. Nothing refunds the second charge.

150. **The stored payment page link has not been checked for how long it lasts.** A second click reuses it. If Paystack's link expires sooner than 30 minutes, the client sees an error on the provider's page and cannot start a new payment until the 30 minutes have passed. Check the real lifetime on the first Paystack test, and shorten the limit if needed (OPEN_PAYMENT_TTL_MS in server/core/types.ts).

151. **"Payment started" is logged before the provider is asked.** The payment row is written first, so the database can refuse a second one. If the provider then refuses, the payment is marked failed, which frees the milestone, but the studio's log keeps the "Payment started" event. The studio's log is not shown to clients.

152. **Event order is the order of the database's identity column.** Events of one transaction are inserted in one statement, in order. The log shows the newest first by that number. There is no retention limit on the log.

153. **Stored files and their rows can disagree after a failure.** The stored object is removed first, then the row. If the row removal then fails, the row points at an object that is gone. Download then fails with an error, and the cleanup job does not touch ready files. A reconciliation job is not built.

154. **The migration adds these tables and one column:** project_events, invitations, change_requests, project_files and account_deletion_requests, the authorization_url column on payments, and the partial unique index on payments. Run pnpm db:generate and read the generated SQL before applying it.

155. **Account deletion requests are only recorded.** A person processes them. Deleting a user removes the request with it.

156. **Invitation tokens are stored as hashes with a unique index.** Two invitations cannot share a hash. Accepting is one conditional update, so two simultaneous acceptances cannot both succeed.

157. **The store and the effects settings live on globalThis.** Next can bundle instrumentation separately from pages and route handlers, and a module variable set in one bundle is not seen by the other. The Postgres store would then be "not set" at request time. globalThis is shared by every bundle in the process.

158. **Only the active-project limit differs between plans.** Change requests, file downloads, the activity log and payments are the same on every plan, and the plan copy now says so. The copy is built from the limit in the plan code, so it cannot drift from the check that enforces it.

159. **A paid plan's button on the pricing page needs a signed-in studio.** It goes to the billing page, which sends a visitor who is not signed in to sign in, and a signed-in user with no studio to set one up. Sign-up does not carry the chosen plan through: the plan is chosen again on the billing page.

160. **The billing page confirms a returning checkout when it loads.** It asks the provider about the reference in the return link. That is a change made by a GET, but it is idempotent, only acts on an invoice of the owner's own studio, and only settles a payment the provider confirms with the right amount. The assumption that Paystack adds `reference` to the callback URL follows its documentation and has not been checked against a real payment.

161. **Only the studio owner sees billing.** An admin or member who opens the page is told to ask the owner. Admins may need billing access later.

162. **Free has no end date.** The free plan is one active project at a time for as long as the studio wants it. The pricing page does not say "forever".

163. **The checks in scripts/checks are text scans.** db-usage checks the Drizzle code against the schema (columns, required columns, enum values) and does not run SQL. links checks that internal links name a route. tailwind-classes compiles every class with the installed Tailwind and reports any with no rule. next-rules and react-rules check a short list of Next and React lint rules on the syntax tree. They do not replace pnpm typecheck, pnpm lint, pnpm build or a run against Postgres. Each was tested by making a deliberate mistake and checking it was caught.

164. **Lint rules not run here.** ESLint and Prettier are not installed in the sandbox. The rules most likely to fail (unescaped quotes in JSX text, state set directly in an effect, impure calls while rendering, unused code) are checked by scripts. Run pnpm format, then pnpm lint, on your machine.
