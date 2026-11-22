/** Next.js rules that fail a build or a request, checked by text. Not a substitute for next build. */
import fs from "node:fs";
import path from "node:path";
import { lineOf, matchClose, stripComments } from "./lib-scan.mjs";

const ROOT = process.cwd();
const files = [];
for (const base of ["app", "components", "lib", "server", "instrumentation.ts"]) {
  const full = path.join(ROOT, base);
  if (!fs.existsSync(full)) continue;
  (function walk(p) {
    if (fs.statSync(p).isDirectory()) for (const n of fs.readdirSync(p)) walk(path.join(p, n));
    else if (/\.(ts|tsx)$/.test(p)) files.push(p);
  })(full);
}

const envKeys = new Set([...fs.readFileSync(path.join(ROOT, "lib/env-schema.ts"), "utf8").matchAll(/^\s{2}([A-Z][A-Z0-9_]+):/gm)].map((m) => m[1]));
const envExample = fs.existsSync(path.join(ROOT, ".env.example")) ? fs.readFileSync(path.join(ROOT, ".env.example"), "utf8") : "";
const PLATFORM = new Set(["NODE_ENV", "NEXT_RUNTIME", "CI", "TAILWIND_DIR", "VERCEL", "VERCEL_ENV", "VERCEL_URL", "NEXT_PHASE", "PORT"]);

const problems = [];
const add = (file, src, idx, msg) => problems.push(`${path.relative(ROOT, file)}:${lineOf(src, idx)}: ${msg}`);
const counts = { useServer: 0, useClient: 0, pages: 0, links: 0, env: 0 };

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const src = stripComments(raw);
  const name = path.basename(file);
  const head = raw.trimStart().slice(0, 40);
  const isServerFile = /^["']use server["']/.test(head);
  const isClientFile = /^["']use client["']/.test(head);

  if (isServerFile) {
    counts.useServer++;
    for (const m of src.matchAll(/^export\s+(const|let|var|class|default|function(?!\*))\b(?!\s+async)/gm)) {
      if (m[1] === "function") add(file, src, m.index, 'a "use server" file may export only async functions (this exports a non-async function)');
      else add(file, src, m.index, `a "use server" file may export only async functions (this exports a ${m[1]})`);
    }
  }
  if (isClientFile) {
    counts.useClient++;
    if (/^export\s+(const\s+metadata|(async\s+)?function\s+generateMetadata)/m.test(src)) add(file, src, 0, 'a "use client" file cannot export metadata');
  }

  if (/^(page|layout|route|template|default|error|loading|not-found)\.tsx?$/.test(name) || name === "route.ts") {
    counts.pages++;
    for (const m of src.matchAll(/\b(params|searchParams)\.(\w+)/g)) add(file, src, m.index, `${m[1]}.${m[2]} is read without await: in Next 16 ${m[1]} is a Promise`);
  }

  for (const m of src.matchAll(/(?<!await\s)(?<![\w.])(cookies|headers|draftMode)\(\)/g)) add(file, src, m.index, `${m[1]}() must be awaited in Next 16`);

  // Typed routes. A text scan cannot see types, so it checks only what can be seen: a router call must be given a route
  // literal or routeTo(...), and <Link href> must not be given the result of some other function call. Template literals
  // and member expressions typed as Route are accepted by the compiler and are left to pnpm build.
  for (const m of src.matchAll(/<Link\b[^>]*?\bhref=\{/g)) {
    const open = m.index + m[0].length - 1;
    const expr = src.slice(open + 1, matchClose(src, open)).trim();
    counts.links++;
    const call = expr.match(/^([\w.]+)\(/);
    if (call && call[1] !== "routeTo") add(file, src, m.index, `<Link href={${expr.slice(0, 50)}}> is given a call to ${call[1]}, which returns string: wrap the path in routeTo(...)`);
  }
  for (const m of src.matchAll(/\brouter\.(push|replace)\(\s*([^)]*)\)/g)) {
    counts.links++;
    const arg = m[2].trim();
    if (/^routeTo\(/.test(arg) || /^"[^"]*"$/.test(arg)) continue;
    add(file, src, m.index, `router.${m[1]}(${arg.slice(0, 40)}) is not a route literal or routeTo(...)`);
  }

  // An internal page link written as a plain anchor reloads the page and skips prefetching. Use next/link.
  for (const m of src.matchAll(/<a\b[^>]*?\bhref="(\/(?!api\/)[^"#]*)"/g)) {
    add(file, src, m.index, `<a href="${m[1]}"> goes to a page in this app: use <Link> from next/link`);
  }

  if (/\buseSearchParams\b/.test(src) && !/<Suspense\b/.test(src) && !isServerFile) add(file, src, src.indexOf("useSearchParams"), "useSearchParams needs a Suspense boundary above it, or the build fails on static pages");

  for (const m of src.matchAll(/\b(?:process\.env|env)\.([A-Z][A-Z0-9_]+)\b/g)) {
    if (PLATFORM.has(m[1])) continue;
    counts.env++;
    if (!envKeys.has(m[1])) add(file, src, m.index, `${m[1]} is read but is not in lib/env-schema.ts`);
    else if (!new RegExp(`^#?\\s*${m[1]}=`, "m").test(envExample)) add(file, src, m.index, `${m[1]} is not listed in .env.example`);
  }
}
console.log(`${files.length} files; ${counts.useServer} server-action files, ${counts.useClient} client files, ${counts.pages} route files, ${counts.links} link targets, ${counts.env} env reads; ${problems.length} problems`);
for (const p of [...new Set(problems)]) console.log("  " + p);
process.exit(problems.length ? 1 : 0);
