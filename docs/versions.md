# Versions

**Status: NOT VERIFIED.** The build environment had no network access, so the brief's step ("check the current stable release from its official source before scaffolding") could not be done. Every version below is a version I expect to be current or a recent stable line. None was checked against nextjs.org, npmjs.com or the Node.js release schedule.

Before the first install, run this check and update the table:

```bash
pnpm view next dist-tags
pnpm view react dist-tags
pnpm view tailwindcss dist-tags
pnpm view lucide-react version
pnpm view zod version
```

Then confirm the Node.js Active LTS line at https://nodejs.org/en/about/releases and set `.nvmrc` and `engines` to match.

| Package | Range in package.json | Version checked | Date checked | Verified |
|---|---|---|---|---|
| Node.js | `>=24 <25` (`.nvmrc`: 24) | none | n/a | no |
| next | `^16.0.0` | none | n/a | no |
| react, react-dom | `^19.2.0` | none | n/a | no |
| typescript | `^5.9.0` | none | n/a | no |
| tailwindcss, @tailwindcss/postcss | `^4.1.0` | none | n/a | no |
| lucide-react | `^0.383.0` | none | n/a | no. Chosen because the artifact runtime in this environment lists 0.383.0. Newer releases may name icons differently. |
| zod | `^4.1.0` | none | n/a | no |
| eslint, eslint-config-next | `^9.36.0`, `^16.0.0` | none | n/a | no |
| clsx, tailwind-merge, class-variance-authority | `^2.1.1`, `^3.0.0`, `^0.7.1` | none | n/a | no. `tailwind-merge` 3.x and `class-variance-authority` 0.7.1 were found in the offline package store, and their versions were read from there. |

Ranges use `^`. The lockfile, which is not committed because it could not be generated, must be committed after the first install.

Deprecated or legacy patterns are avoided by design. Moment.js is not used. The Pages Router is not used. The `middleware` file convention is not used yet. Check the Next.js 16 release notes for its current name before routing protection is built.

## Added in the data and test build (also unverified)

| Package | Range | Notes |
|---|---|---|
| drizzle-orm | `^0.44.0` | Unverified. Check the current stable line. |
| drizzle-kit | `^0.31.0` (dev) | Must match the drizzle-orm line. Unverified. |
| vitest | `^3.2.0` (dev) | Unit tests in `tests/unit`. Unverified. |

## Added in the auth build (unverified)

| Package | Range | Notes |
|---|---|---|
| better-auth | `^1.3.0` | Unverified. The API used is listed in docs/assumptions.md, item 31. |
| pg | `^8.16.0` | PostgreSQL driver for the Drizzle node-postgres adapter. Unverified. |
| @types/pg | `^8.15.0` (dev) | Unverified. |

## Observed in the first real install

| Package | Version | Source |
|---|---|---|
| next | 16.4.6 | Build output on the author's machine |
| react | 19.3.1 | Build output on the author's machine |
| lucide-react | 0.383.0 | Build output and typecheck on the author's machine |
| vitest | 3.2.7 | `pnpm test` output on the author's machine |
