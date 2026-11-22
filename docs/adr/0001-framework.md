# 0001: Framework

**Status:** Accepted. Exact version to be confirmed (see docs/versions.md).

**Context.** The brief requires Next.js on the App Router with TypeScript in strict mode, a deployment target of Vercel, and server-first rendering with per-route rendering modes.

**Decision.** Next.js, App Router only. TypeScript strict with `noUncheckedIndexedAccess`. Deploy to Vercel using its default output. Use `typedRoutes` so that broken links fail the typecheck. The Pages Router is not used, and no route needs it.

**Consequences.** Server Components by default. Route handlers only for webhooks and other real HTTP endpoints. Server Actions for mutations. Caching and revalidation follow the documented model of the installed version, so the version must be recorded before caching is designed.
