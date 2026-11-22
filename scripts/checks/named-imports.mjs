import fs from "node:fs";
import path from "node:path";
const ROOT = process.cwd();
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { if (f === "node_modules" || f.startsWith(".") || (f === "scripts" && d === ROOT)) continue; const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(f)) files.push(p); } })(ROOT);
const target = (spec, from) => {
  let base = spec.startsWith("@/") ? path.join(ROOT, spec.slice(2)) : spec.startsWith(".") ? path.resolve(path.dirname(from), spec) : null;
  if (!base) return null;
  for (const c of [base + ".ts", base + ".tsx", path.join(base, "index.ts")]) if (fs.existsSync(c)) return c;
  return null;
};
const exportsOf = (file) => {
  const s = fs.readFileSync(file, "utf8");
  const names = new Set();
  for (const m of s.matchAll(/export\s+(?:async\s+)?(?:const|let|function|class|type|interface|enum)\s+([A-Za-z0-9_]+)/g)) names.add(m[1]);
  for (const m of s.matchAll(/export\s+\{([^}]+)\}/g)) for (const part of m[1].split(",")) { const n = part.trim().split(/\s+as\s+/).pop(); if (n) names.add(n); }
  if (/export\s+\*\s+from/.test(s)) names.add("*");
  if (/export\s+default/.test(s)) names.add("default");
  return names;
};
const problems = [];
let checked = 0;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  for (const m of src.matchAll(/import\s+(type\s+)?\{([^}]+)\}\s+from\s+["']([^"']+)["']/g)) {
    const t = target(m[3], file);
    if (!t) continue;
    const have = exportsOf(t);
    if (have.has("*")) continue;
    for (const raw of m[2].split(",")) {
      const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
      if (!name) continue;
      checked++;
      if (!have.has(name)) problems.push(`${path.relative(ROOT, file)}: "${name}" not exported by ${m[3]}`);
    }
  }
  for (const m of src.matchAll(/import\s+([A-Za-z0-9_]+)\s+from\s+["']([^"']+)["']/g)) {
    const t = target(m[2], file);
    if (!t) continue;
    checked++;
    if (!exportsOf(t).has("default")) problems.push(`${path.relative(ROOT, file)}: default import "${m[1]}" but ${m[2]} has no default export`);
  }
}
console.log(`${checked} local named/default imports checked, ${problems.length} problems`);
for (const p of problems) console.log("  " + p);
