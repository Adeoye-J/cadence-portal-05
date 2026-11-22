/** Every internal link, redirect and router push in the code must point at a route that exists. */
import fs from "node:fs";
import path from "node:path";
import { lineOf, stripComments } from "./lib-scan.mjs";

const ROOT = process.cwd();
const APP = path.join(ROOT, "app");

const routes = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) { walk(full); continue; }
    if (name !== "page.tsx" && name !== "route.ts") continue;
    const segs = path.relative(APP, dir).split(path.sep).filter((s) => s && !(s.startsWith("(") && s.endsWith(")")));
    const pattern = "^/" + segs.map((s) => (s.startsWith("[...") ? ".+" : s.startsWith("[") ? "[^/]+" : s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("/") + "$";
    routes.push({ re: new RegExp(pattern.replace(/\/\$$/, "/?$").replace(/^\^\/\/\?\$$/, "^/$")), file: path.relative(ROOT, full), shape: "/" + segs.join("/") });
  }
})(APP);
const firstSegments = new Set(routes.map((r) => r.shape.split("/")[1]).filter(Boolean));

const files = [];
for (const base of ["app", "components", "lib", "server"]) {
  (function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name)) files.push(full);
    }
  })(path.join(ROOT, base));
}

const explicit = /(?:href\s*[=:]\s*\{?\s*|redirect\(\s*|permanentRedirect\(\s*|\.push\(\s*|\.replace\(\s*|routeTo\(\s*)(["'`])(\/[^"'`]*)\1/g;
const generic = /(["'`])(\/[a-z][a-z0-9-]*(?:\/[^"'`\s]*)?)\1/g;
const emailLinks = /\$\{\w*(?:appUrl|APP_URL|baseUrl)\w*\}(\/[A-Za-z0-9_\-./${}]*)/g;

function normalise(raw) {
  let p = raw.replace(/\$\{[^}]*\}/g, "x").split(/[?#]/)[0];
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return /^\/[A-Za-z0-9_\-./%x]*$/.test(p) ? p : null;
}

const problems = [];
let checked = 0;
const seen = new Set();
for (const file of files) {
  const src = stripComments(fs.readFileSync(file, "utf8"));
  const rel = path.relative(ROOT, file);
  const consider = (raw, idx, mustMatch) => {
    const p = normalise(raw);
    if (!p || p.startsWith("/_next") || p === "/favicon.ico") return;
    if (!mustMatch && !firstSegments.has(p.split("/")[1])) return;
    const key = `${rel}:${p}`;
    if (seen.has(key)) return;
    seen.add(key);
    checked++;
    if (!routes.some((r) => r.re.test(p))) problems.push(`${rel}:${lineOf(src, idx)}: no route for ${raw}`);
  };
  for (const m of src.matchAll(explicit)) consider(m[2], m.index, true);
  for (const m of src.matchAll(generic)) consider(m[2], m.index, false);
  for (const m of src.matchAll(emailLinks)) consider(m[1], m.index, true);
}
console.log(`${routes.length} routes; ${checked} distinct links checked; ${problems.length} without a route`);
for (const p of problems) console.log("  " + p);
process.exit(problems.length ? 1 : 0);
