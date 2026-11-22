/**
 * Every class in the code must produce a rule when compiled against styles/globals.css. Tailwind v4 ignores a class it
 * does not know, so a typo or a colour that is not in the theme fails silently. This uses the installed Tailwind
 * compiler. Set TAILWIND_DIR to point at a copy of the tailwindcss package if it is not installed.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { lineOf, skipString, stripComments } from "./lib-scan.mjs";

const ROOT = process.cwd();
let twDir = process.env.TAILWIND_DIR;
if (!twDir) {
  try { twDir = path.dirname(createRequire(path.join(ROOT, "package.json")).resolve("tailwindcss/package.json")); } catch { /* not installed */ }
}
if (!twDir) { console.log("tailwindcss is not installed, so this check was skipped"); process.exit(0); }

const tw = await import(pathToFileURL(path.join(twDir, "dist/lib.mjs")).href);
const loadStylesheet = async (id, base) => {
  const file = id === "tailwindcss" ? path.join(twDir, "index.css") : id.startsWith("tailwindcss/") ? path.join(twDir, id.slice(12)) : path.resolve(base, id);
  return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
};
const css = fs.readFileSync(path.join(ROOT, "styles/globals.css"), "utf8");

const files = [];
for (const base of ["app", "components"]) {
  (function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.tsx$/.test(name)) files.push(full);
    }
  })(path.join(ROOT, base));
}

/** Static text of every string and template literal, with where it starts and whether it is a className attribute. */
const literals = [];
for (const file of files) {
  const src = stripComments(fs.readFileSync(file, "utf8"));
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c !== '"' && c !== "'" && c !== "`") continue;
    const end = skipString(src, i);
    let text = src.slice(i + 1, end - 1);
    if (c === "`") text = text.replace(/\$\{[^}]*\}/g, " ");
    const attr = /className\s*=\s*$/.test(src.slice(Math.max(0, i - 14), i));
    literals.push({ file: path.relative(ROOT, file), line: lineOf(src, i), text, attr });
    i = end - 1;
  }
}

const candidates = new Set();
for (const l of literals) for (const t of l.text.split(/\s+/)) if (/^[A-Za-z0-9!@\[\]:_\-\/.%#&()>*,='+~^]+$/.test(t)) candidates.add(t);

const compiler = await tw.compile(css, { base: ROOT, loadStylesheet });
const out = compiler.build([...candidates]);
const escape = (t) => t.replace(/[^A-Za-z0-9_-]/g, (ch) => "\\" + ch);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ok = (t) => new RegExp("\\." + escapeRe(escape(t)) + "(?![A-Za-z0-9_-])").test(out);

// Markers and names that are not utilities.
const MARKERS = /^(group|peer|dark|group\/[\w-]+|peer\/[\w-]+|mermaid)$/;
const SHAPED = /^(?:[a-z0-9-]+:|\[[^\]]+\]:)*!?-?(?:bg|text|border|ring|from|to|via|shadow|rounded|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|w|h|min|max|size|font|leading|tracking|opacity|z|top|left|right|bottom|inset|space|divide|outline|fill|stroke|translate|scale|rotate|grid|col|row|flex|items|justify|self|place|order|object|overflow|cursor|transition|duration|ease|animate|blur|backdrop|decoration|underline|list|aspect|columns|break|whitespace|line|sr|accent|caret|scroll|snap|touch|select|resize|appearance|pointer|will|content|basis|grow|shrink|table|origin|skew|drop|hue|saturate|sepia|invert|grayscale|brightness|contrast)-/;
const problems = [];
let classLists = 0;
for (const l of literals) {
  const tokens = l.text.split(/\s+/).filter((t) => /^[A-Za-z0-9!@\[\]:_\-\/.%#&()>*,='+~^]+$/.test(t));
  if (tokens.length === 0) continue;
  const good = tokens.filter(ok);
  if (good.length === 0 && !l.attr) continue;
  classLists++;
  for (const t of tokens) {
    if (ok(t) || MARKERS.test(t)) continue;
    if (t.endsWith(":") || t.includes("/>")) continue;
    if (!l.attr && !SHAPED.test(t)) continue;
    problems.push(`${l.file}:${l.line}: ${t}`);
  }
}
console.log(`${literals.length} strings scanned, ${classLists} class lists, ${candidates.size} candidate tokens; ${problems.length} classes with no rule`);
for (const p of problems) console.log("  " + p);
process.exit(problems.length ? 1 : 0);
