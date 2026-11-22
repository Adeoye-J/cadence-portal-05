# 0003: Authentication

**Status:** Accepted. Implemented in code. Not yet run: needs a database and the Better Auth version confirmed (docs/versions.md).

**Context.** Sign-in is by magic link (Section 0 of the brief, and the "Sign in to ... portal, one-time access link" email). Passwords are not used. The brief forbids hand-rolled password hashing or session management.

**Decision.** **Better Auth** with the magic-link plugin, its Drizzle adapter, and sessions stored in our Postgres database.

**Why not the brief's examples.** Auth.js (v5) has been published under a beta tag for a long time, and the brief allows only stable releases. Clerk and Supabase Auth both work, but charge per active user and would add a second user table to keep in sync with ours. Better Auth is stable (verify the current version before install) and keeps users and sessions in our database.

**Route protection.** Checked in middleware (or the proxy file, whichever the installed Next.js version documents) for a fast redirect. Every server data function also checks the session and the role. Middleware alone is never enough.

**Consequences.** Magic-link tokens are single-use and expire. Links are rate limited per email and per IP. Email delivery is a dependency (Resend, ADR not yet written).
