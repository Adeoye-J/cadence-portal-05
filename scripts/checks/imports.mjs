import fs from "node:fs";
import path from "node:path";
const ROOT = process.cwd();
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const declared = new Set([...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)]);
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { if (f === "node_modules" || f.startsWith(".") || (f === "scripts" && d === ROOT)) continue; const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(ts|tsx|mjs)$/.test(f)) files.push(p); } })(ROOT);
const resolveLocal = (base) => {
  for (const c of [base, base + ".ts", base + ".tsx", base + ".mjs", path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return true;
  }
  return false;
};
const problems = [];
const specRe = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  for (const m of src.matchAll(specRe)) {
    const spec = m[1] || m[2];
    if (!spec) continue;
    if (spec.startsWith("@/")) { if (!resolveLocal(path.join(ROOT, spec.slice(2)))) problems.push(`${file}: missing alias target ${spec}`); continue; }
    if (spec.startsWith(".")) { if (!resolveLocal(path.resolve(path.dirname(file), spec))) problems.push(`${file}: missing relative ${spec}`); continue; }
    const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
    if (name.startsWith("node:")) continue;
    if (!declared.has(name) && !["react", "react-dom"].includes(name)) problems.push(`${file}: package not declared in package.json: ${name}`);
  }
}
const uniq = [...new Set(problems)];
console.log(`${files.length} files checked, ${uniq.length} import problems`);
for (const p of uniq) console.log("  " + p);
