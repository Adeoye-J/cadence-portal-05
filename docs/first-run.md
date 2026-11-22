# First run: what to do, in order

This is the checklist for the first time the project is installed and run on a machine with a network
connection. Nothing below has been run yet. The sandbox used to write this code had no registry access.

Keep a record of what fails, and why, in `docs/verification.md`. Each failure there is a finding,
not a reason to stop.

## 0. Baseline

```bash
git init && git add -A && git commit -m "chore: baseline before first install"
```

A baseline makes every later fix easy to review.

## 1. Install and lock

```bash
corepack enable
pnpm install            # creates pnpm-lock.yaml
git add pnpm-lock.yaml && git commit -m "chore: lockfile"
```

Then check every version in `docs/versions.md` against its official source and update the ranges in
`package.json` if needed. Commit the lockfile after each change.

If `pnpm install` fails, check the package names first (`better-auth`, `drizzle-orm`, `drizzle-kit`,
`lucide-react`, `zod`). Then check `husky` and `lint-staged`, which were added last.

## 2. Static checks (no dependencies needed)

```bash
pnpm check:static
```

These passed in the sandbox. A failure here means a file moved or an export was renamed after that run.

The static checks now include: `db-usage` (the Drizzle code against the schema), `links` (every internal link names a route),
`tailwind-classes` (every class has a rule, using the installed Tailwind), `next-rules` (server-action exports, awaited params and
cookies, internal links, environment variables) and `react-rules` (unescaped JSX text, state set in an effect, impure render calls).
The last two use the installed Tailwind and TypeScript and skip themselves if those are missing.

## 3. Type check: expected findings

```bash
pnpm typecheck
```

The pure modules, schemas, and unit tests passed under TypeScript 6 with Zod 4 and stand-ins for
drizzle and vitest. The real run will also cover the pages and components, which were never
type-checked. These are the likely findings, from most to least probable:

- **Lucide export names.** A name in `lib/icons.ts` may not exist in the installed lucide-react version.
- **Next.js route types.** With `typedRoutes`, template-string links such as `/projects/${id}` may need
  a typed route or a cast.
- **Route props.** Pages declare `params` as a Promise. The generated page types may expect a different shape.
- **React 19 action types.** `useActionState` and form `action` props may need tighter typing.
- **Drizzle inference.** The `DrizzleOutbox` and the schema helpers were typed against stand-ins, not the real library.
- **Better Auth types.** The auth config and session shape may differ from `lib/session.ts`.

## 4. Lint and format

```bash
pnpm lint
pnpm format            # one formatting commit, separate from any logic change
pnpm format:check
```

Expect the first `pnpm format` to change most files. Make that its own commit so logic changes stay reviewable.
The CI workflow runs `format:check`, so the formatting commit must land before CI can pass.

## 5. Unit tests

```bash
pnpm test
```

The 95 tests passed under a stand-in runner. Real Vitest may report differences in timers, the module
cache, or the `@/` alias. A test file that uses `Date.now()` needs a look.

## 6. Build

```bash
DATABASE_URL=postgres://ci:ci@localhost:5432/ci AUTH_SECRET=ci-placeholder-secret-not-for-production-use APP_URL=http://localhost:3000 pnpm build
```

The build needs no secrets: configuration is read at server start, not at build time. Expect:

- **Environment at build time.** Not an issue any more. Missing configuration is reported when the server starts, by instrumentation.ts.
- **Dynamic pages.** Pages that read the session should render at request time. A failure of the form
  "Dynamic server usage" means a page was prerendered when it should not have been.
- **Route segment conflicts.** The `(client)` and `(studio)` groups both exist. Confirm that no two
  routes resolve to the same path.

## 7. Database

```bash
docker run -d --name cadence-pg -e POSTGRES_USER=cadence -e POSTGRES_PASSWORD=cadence -e POSTGRES_DB=cadence -p 5432:5432 postgres:17
# set DATABASE_URL=postgres://cadence:cadence@localhost:5432/cadence in .env.local
pnpm db:generate       # review every generated SQL file before applying it
pnpm db:migrate
pnpm db:seed         # development data only; refuses when NODE_ENV is production
```

Check that these tables exist and that the enum values match the code: `user`, `session`, `account`,
`verification`, `passkey`, `studios`, `memberships`, `clients`, `projects`, `project_contacts`, `milestones`,
`payments`, `proposals`, `signatures`, `proposal_notes`, `pending_signups`, `studio_subscriptions`,
`billing_invoices`, `notification_outbox`, `project_events`, `invitations`, `change_requests`, `project_files`, `account_deletion_requests`.

**The database is now required to run the app.** At start-up the server sets the Postgres store, so studios,
memberships, clients, projects, milestones, proposals, signatures, notes, pending sign-ups and billing all come from
Postgres. Run the migration and the seed before `pnpm dev`, or every page that reads a project will fail. The seed creates
the two demo users (`DEV_DEMO_VIEWER=client` or `studio` signs in as one of them), the demo studio, three projects and
their proposals. Run the seed only against a development database.

Nothing is kept in memory in production code. Invitations, files, payments, change requests and the activity log are in Postgres too.

## 8. Object storage

```bash
docker run -d --name cadence-minio -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=cadence -e MINIO_ROOT_PASSWORD=cadence-secret minio/minio server /data --console-address ":9001"
```

Create a bucket, then set `STORAGE_ENDPOINT_URL=http://localhost:9000`, `STORAGE_BUCKET`, and the access keys.
Upload one PDF through the studio. If the file is rejected, check the presigned URL against the signer's
published-example test, then check the request the browser actually sent.

## 9. Payments

Use Paystack test keys only. Expose the app with a tunnel and set the webhook URL to
`{APP_URL}/api/webhooks/paystack`. Confirm a successful test charge marks the payment paid, and that a
repeated webhook changes nothing.

## 10. Record the result

Update `docs/verification.md` with each step's outcome. Mark every item in this file that passed, and
open an issue for each one that did not.
