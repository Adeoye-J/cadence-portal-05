# Verification record

This file records what was actually run against the code, and what was not. It is the only
place that claims verification. Anything not listed here has not been verified.

## Environment for this record

The build sandbox had no network access and no npm registry, so `pnpm install` could not run. The
checks below used the offline TypeScript 6.0, Zod 3.25 (whose `zod/v4` entry point is the Zod 4
API used by the code), esbuild 0.28 and Node 22. Drizzle, Next.js, React types, Better Auth, Vitest
and the Lucide package were not available.

## Results

| Check | Scope | Result |
|---|---|---|
| Type check (strict, `noUncheckedIndexedAccess`) | Pure modules, schemas, DB schema, all unit tests | Passes. Drizzle's `pg-core` and Vitest were replaced by typed stand-ins (see below). |
| Unit tests | 23 files, 123 tests (format, milestones, sign-off, payments, invitations, milestone flow, change-request replies, outbox and retries, notifications, events, file rules and uploads, file removal and the abandoned-upload sweep, cron authorisation, SigV4 signing, studio access, proposal builder, email templates) | All 95 pass. Run through a Vitest stand-in; see below. |
| Import resolution | 123 files: local paths, `@/` aliases, declared packages | 0 problems |
| Named and default imports | 440 local imports | 0 problems |
| Next.js boundary rules | 121 files: "use server" exports, "use client" server-only imports | 0 problems |

## What the stand-ins mean

- **drizzle-orm/pg-core** was replaced by a typed stub. Enum value tuples keep their literal types,
  which is what the code relies on. No query API was exercised, and the schema has never run against Postgres.
- **vitest** was replaced by a small runner that supports `describe`, `it`, and the matchers the tests use
  (`toBe`, `toEqual`, `toMatchObject`, `toContain`, `toHaveLength`, `toBeNull`, `toBeTruthy`, `toMatch`,
  `toThrow`, and `rejects.toThrow`). It runs tests in order, as Vitest does within a file.
  Real Vitest will report the same results or a clearer failure, but this has not been run under it.

## Not verified

- **React components and pages (`.tsx`).** Only their syntax and their imports were checked. No type check
  ran, because `@types/react` and `next` were unavailable.
- **Next.js runtime behaviour.** `redirect`, `notFound`, `headers()`, the `params` promise, `useActionState`, and
  the form-action flow have not run.
- **Better Auth.** Its API and table names are from memory (docs/assumptions.md, item 31).
- **Paystack.** Its endpoints, the webhook signature header, and the response shapes are from memory (item 37 onwards).
- **SigV4 signing.** Checked against AWS's documented presigned-URL example, which matches exactly. Not checked against Cloudflare R2 or MinIO (assumptions, item 87).
- **Object storage.** The S3-compatible adapter, the upload and download flow in the browser, and the CSP change have not been run against a live bucket.
- **Database.** No migration has been generated or applied. No query has run. This includes the production outbox (`server/outbox-drizzle.ts`), which is unverified against drizzle-orm.
- **Browser behaviour.** No end-to-end, visual, or accessibility test has run.
- **Email.** The Resend call and the templates have not been sent.

## Results from the first real install

These are results from a run on a Windows machine with network access, pasted into the conversation. They are the first real checks of this code, and they replace the stand-in results above where the two differ.

| Step | Result | Action taken |
|---|---|---|
| `pnpm check:static` | Passed: 127 files, 459 named imports, 125 boundary files, 0 problems | None |
| `pnpm typecheck` | 8 errors in 4 files: 5 lucide names not exported, 2 typed-route `href` values typed as `string`, 1 seed insert given a string where a Date is required | Fixed. Route targets are typed `Route`. Seed timestamps are `Date`. Five icons replaced (see assumptions, item 97). Not re-run. |
| `pnpm lint` | 6 errors, 2 warnings: CommonJS `require` in the check scripts; an unused variable; an anonymous default export | Fixed. Check scripts are ES modules. Config is named before export. Not re-run. |
| `pnpm format:check` | Passed after `pnpm format` | None |
| `pnpm test` | Passed: 17 files, 99 tests, under Vitest 3.2.7 | None. First real run of the test suite. |
| `pnpm build` | Failed: 15 Turbopack errors, all caused by the five missing lucide exports | Fixed by the same icon change. Not re-run. |

Versions observed in that install: Next.js 16.4.6 (Turbopack), lucide-react 0.383.0, React 19.3.1, Vitest 3.2.7.

Second run: check:static, typecheck, lint, format:check passed. The build compiled, then Next.js type checking failed on three back links built from dynamic paths (projects and proposals). These now go through lib/routes.ts (routeTo). Not yet re-run.

Third run: the build compiled and passed TypeScript, then failed while collecting page data. Cause: lib/env.ts validated the environment when it was first imported, so every route module needed real secrets during `next build`. Fixed: the environment, the database pool and the Better Auth instance are now created on first use, and instrumentation.ts validates at boot. The build should need no secrets. Not yet re-run.

Third run: compile and TypeScript passed. The build then failed while collecting page data, because environment validation rejected a blank CRON_SECRET from .env.example. Fixed: blank values count as unset, and the schema now lives in lib/env-schema.ts so it can be tested (tests/unit/env.test.ts).

Open after this round: the build has not been re-run, so further errors may appear behind the icon failure, most likely in prerendering or in environment checks at build time.

## Tooling added but never run

| Item | File | State |
|---|---|---|
| CI workflow (install, static checks, typecheck, lint, format check, tests, audit, build) | .github/workflows/ci.yml | Parses as YAML. Has never run on GitHub. |
| Dependabot (npm and GitHub Actions, weekly) | .github/dependabot.yml | Parses as YAML. Not active until pushed. |
| Prettier configuration | .prettierrc.json, .prettierignore | Valid JSON. Never applied to the code. |
| Pre-commit hook (lint-staged) | .husky/pre-commit, package.json | Not installed. Needs a git repository. |
| Lockfile | pnpm-lock.yaml | Does not exist yet. CI uses --frozen-lockfile and will fail until it is committed. |

Follow docs/first-run.md. It sets out the order and the failures to expect.

## How to run the real checks

```bash
pnpm install
pnpm check:static      # the three checks above, no dependencies
pnpm typecheck         # the full project, including pages and components
pnpm test              # Vitest, the unit tests
pnpm db:generate       # then review db/migrations before applying
```

## Pages written in the latest batch (not yet run in a browser)

Built this batch: studio clients, payments ledger (owner and admin), team (read-only); client pre-work, milestones, files, change requests, handover, payment history and detail, notifications, account, data export and deletion request; public landing, help, contact, and three legal drafts; error boundaries and a projects loading state. The read models for these are unit-tested (tests/unit/read-models.test.ts, tests/unit/studio-reads.test.ts). The pages themselves have not been type-checked by Next or rendered.

## Batch: design port (log-in, sign-up, landing) and theme

Checks run after this batch: static checks (177 files, 652 imports, 175 boundary files) all pass. The new pure modules (theme, sign-up validation, onboarding) pass the type check and their tests (122 tests across 22 files, under the stand-in runner). Not yet run: the pages in Next, the passkey and Google flows, the migration for the passkey table, and any visual comparison against the designs.

## Batch: email check, expired link, 404, invitation

Static checks pass (181 files, 675 imports, 179 boundary files). The stand-in unit tests pass (123 tests across 23 files), including the new invitation preview test. Not yet run: the pages in Next, the cookie hand-off between sign-in and the email check, and any visual comparison with the designs.

## Batch: proposal review, printable copy, notes

Static checks pass (192 files, 707 imports, 190 boundary files). The stand-in unit tests pass: 127 tests across 24 files, including the new review-data, fingerprint and note tests. The stage labels moved to a plain module, so server code and the tests no longer load UI components. Not yet run: the pages in Next, the note dialog in a browser, the print layout, and any visual comparison against the design's screen.png.

## Batch: billing domain and persistence for billing

Static checks pass (200 files, 764 imports, 198 boundary files). The stand-in unit tests pass: 139 tests across 25 files, 12 of them for billing (prices, checkout, settlement, cancellation, the plan in force, and the active-project limit). Not yet run: the database migration (`pnpm db:generate`, then `pnpm db:migrate`), a live Paystack USD charge, and the webhook against Paystack.

## Batch: conditional settlement and persistence (signatures, notes, pending sign-ups)

Static checks pass (205 files, 792 imports, 203 boundary files). The stand-in unit tests pass: 142 tests across 26 files. The store tests check that one signature is recorded when two attempts race, and that one caller takes a pending sign-up. Not yet run: the migration (pnpm db:generate, then pnpm db:migrate), the Postgres store against a real database, the drizzle select with a row lock (.limit(1).for("update")), and conditional settlement under concurrent webhooks.

## Batch: core domain moved to the store

The studios, memberships, clients, projects, contacts, milestones and proposals are read and changed through one store, with explicit commands (signing, milestone transitions, payment activation, sending a draft, creating a project or a studio). The fourteen modules that read the fixture arrays now use it. Production code no longer imports the fixtures, apart from the in-memory store, the studio contact on the proposal and the development session override.

Checked here: static checks (209 files, 816 imports, 207 boundary files, no problems); strict type check over 73 files including the converted modules and tests, no errors; stand-in unit tests, 154 tests across 27 files. The type check found one real bug, a call to a removed billing store method on the checkout failure path, now fixed and covered by a test. Not run: the migration, the seed, and the Postgres store against a real database. The Postgres store file (`server/core/drizzle.ts`) was not type-checked, because the real Drizzle types are not installed in this environment. Expect type errors in it on the first `pnpm typecheck`.

## Batch: activity log, notification queue, invitations, files, payments, change requests in the store

Events and queued emails are written with the change that causes them. Invitations, change requests, files, payments and account deletion requests moved into the store, so no module keeps its own records. A milestone has one open payment, and a payment and its milestone settle in one transaction.

Checked here: static checks (212 files, 873 imports, 210 boundary files, no problems); strict type check over 77 files including the new and converted modules and their tests, no errors; stand-in unit tests, 170 tests across 28 files, including new tests for events with effects, payments, invitations, change requests, files and deletion requests. Not run: the migration, the Postgres store against a real database, or any of the transactions and conditional updates. The Postgres files (`server/core/drizzle.ts`, `server/store/drizzle.ts`, the schema) were not type-checked, because the real Drizzle types are not installed in this environment. The partial unique index, the identity column and the conditional updates are written from the documented behaviour and need to be exercised on a real database.

Concurrency is checked in the in-memory store only (two signings, two settlements, two acceptances in one process). The same cases need a test against Postgres with two connections.

## Batch: verification pass, then pricing and billing

**What was verified, and how**
- Static checks, all passing: imports (224 files), named imports (947), Next boundaries (222), db-usage (24 tables, 20 inserts, 21 updates, 239 column references, 37 enum values), links (45 routes, 139 links), tailwind-classes (3,300 strings, 1,590 class lists), next-rules, react-rules.
- Each new check was tested with deliberate mistakes and caught them: an unknown column, a missing required column, a column the database generates, a bad enum value in set() and in eq(), a typo in a column reference; a mistyped colour class, a mistyped utility, a dead link; state set in an effect, Date.now() while rendering, an apostrophe in JSX text.
- Strict type check over 82 files with the stand-in library types: no errors. Unused declarations across the whole project: none.
- 181 unit tests across 30 files pass under the stand-in runner.
- The SQL patterns behind the concurrency guards were replayed against SQLite 3.45: one open payment per milestone (partial unique index with ON CONFLICT DO NOTHING), a payment and a milestone move once, a late confirmation still settles a payment our expiry marked failed, an invitation is accepted once and an expired one is refused, a proposal is signed once, a file becomes ready once. This checks the pattern logic. It is not Postgres, and it does not exercise Drizzle's generated SQL or Postgres's locking.

**Defects found and fixed**
- Design colour tokens missing from the theme (secondary-fixed, surface-tint, background and others), so classes used by the landing and proposal pages did nothing. The full set is now defined, in light and dark.
- A stray `font-headline-sm` class on the landing page.
- Two effects that set state directly (log-in and the passkey panel), replaced by a browser-only value hook.
- Apostrophes written unescaped in JSX text on the account pages.
- Two unused parameters on the onboarding action.
- The store registry and the effects settings were held in module variables, which Next can split between bundles. They are on globalThis now.
- The design generator cited in the docs was not in the repository. It is in scripts/design, with its paths made relative.
- Plan copy that claimed things the product does not enforce.
- The pricing buttons pointed at a billing page that did not exist. The link check found it, and the page is built.
- A plain anchor to an internal page on the check-email page and in the generated proposal page.

**Not verified (needs your machine)**
- pnpm install, typecheck, lint, format, build, test with the real libraries. The Postgres store, the schema and the Drizzle calls were checked against the schema by text only, not type-checked.
- The migration and the seed. Any query against a real Postgres, including both concurrency paths with two connections.
- Paystack (including the return link's reference parameter), Resend, storage, Google and passkey sign-in.
- Typed routes on pages that pass a template literal to <Link>: your earlier build accepted them, but pages written since have not been through next build.
- Visual match against the designs' screen.png files.
