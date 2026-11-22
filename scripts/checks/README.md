# Static checks

Dependency-free Node scripts (ES modules). They run from the project root.

- `imports.mjs`: every local import resolves, and every package import is declared in package.json.
- `named-imports.mjs`: every named or default import from a local module is actually exported there.
- `next-boundaries.mjs`: "use server" files export only async functions, and "use client" files do not import server-only modules (env, session, auth, database, Node built-ins).
- `lucide-names.mjs`: every icon name imported in lib/icons.ts is exported by the installed lucide-react. Runs only after `pnpm install`.

The first three skip the scripts/ folder, because they match import text in their own source. Run all four with `pnpm check:static`.
