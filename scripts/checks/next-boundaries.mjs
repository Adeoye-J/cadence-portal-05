import fs from "node:fs";
import path from "node:path";
const ROOT = process.cwd();
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { if (f === "node_modules" || f.startsWith(".") || (f === "scripts" && d === ROOT)) continue; const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(f)) files.push(p); } })(ROOT);
const problems = [];
const SERVER_ONLY_IN_CLIENT = [/^node:/, /^@\/lib\/env$/, /^@\/lib\/session$/, /^@\/lib\/auth$/, /^@\/db\//, /^\.\.?\/.*\/lib\/env$/, /^pg$/, /^drizzle-orm/, /^@\/server\/(?!.*-actions$)/];
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  const isServerAction = /^\s*["']use server["']/m.test(src);
  const isClient = /^\s*["']use client["']/m.test(src);
  if (isServerAction) {
    // Only async function exports (type exports are erased and allowed).
    for (const m of src.matchAll(/^export\s+(const|let|var|function|class|default)\b([^\n]*)/gm)) {
      if (m[1] === "function" && /^\s*async/.test(src.slice(m.index, m.index + 60))) continue;
      if (m[1] === "function") { problems.push(`${rel}: "use server" file exports a non-async function`); }
      else if (m[1] !== "function") problems.push(`${rel}: "use server" file exports "${m[1]}" (only async functions allowed)`);
    }
    for (const m of src.matchAll(/^export\s+async\s+function/gm)) void m;
  }
  if (isClient) {
    for (const m of src.matchAll(/from\s+["']([^"']+)["']/g)) {
      const spec = m[1];
      if (SERVER_ONLY_IN_CLIENT.some((re) => re.test(spec))) {
        problems.push(`${rel}: "use client" imports server-only module "${spec}"`);
      }
    }
  }
  // A page or layout that reads cookies/headers must not be marked "use client".
  if (isClient && /next\/headers/.test(src)) problems.push(`${rel}: "use client" imports next/headers`);
}
console.log(`${files.length} files checked for Next.js boundary rules, ${problems.length} problems`);
for (const p of problems) console.log("  " + p);
