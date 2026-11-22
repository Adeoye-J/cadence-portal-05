/**
 * Lint rules that are cheap to get wrong, checked on the syntax tree so they can run before pnpm lint:
 *  - react/no-unescaped-entities: a quote, apostrophe, > or } in JSX text must be written as an entity.
 *  - react-hooks/set-state-in-effect: an effect must not call a state setter directly (inside a callback is fine).
 *  - react-hooks/purity: a component must not call Date.now, Math.random or performance.now while rendering.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = process.cwd();
let ts;
try {
  const dir = process.env.TS_DIR;
  ts = (await import("node:module")).createRequire(path.join(ROOT, "package.json"))(dir ? path.join(dir, "lib/typescript.js") : "typescript");
} catch {
  console.log("typescript is not installed, so this check was skipped");
  process.exit(0);
}

const files = [];
for (const base of ["app", "components"]) {
  (function walk(p) {
    if (!fs.existsSync(p)) return;
    if (fs.statSync(p).isDirectory()) for (const n of fs.readdirSync(p)) walk(path.join(p, n));
    else if (p.endsWith(".tsx")) files.push(p);
  })(path.join(ROOT, base));
}

const problems = [];
let texts = 0, effects = 0, components = 0;
const NOT_STATE = new Set(["setTimeout", "setInterval", "setImmediate"]);

for (const file of files) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const rel = path.relative(ROOT, file);
  const report = (node, msg) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    problems.push(`${rel}:${line + 1}: ${msg}`);
  };

  /** Visits the body of fn without entering nested functions. */
  const walkOwn = (fn, visit) => {
    const go = (n) => {
      if (n !== fn.body && ts.isFunctionLike(n)) return;
      visit(n);
      ts.forEachChild(n, go);
    };
    ts.forEachChild(fn.body ?? fn, go);
  };

  const isAsync = (fn) => (ts.getCombinedModifierFlags?.(fn) & ts.ModifierFlags.Async) !== 0 || fn.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);

  const visit = (node) => {
    if (ts.isJsxText(node) && node.text.trim()) {
      texts++;
      const bad = node.text.match(/['"}>]/);
      if (bad) report(node, `JSX text contains ${JSON.stringify(bad[0])}: write it as an entity (&apos; &quot; &#125; &gt;)`);
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && /^use(Layout)?Effect$/.test(node.expression.text)) {
      const cb = node.arguments[0];
      if (cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb))) {
        effects++;
        walkOwn(cb, (n) => {
          if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && /^set[A-Z]/.test(n.expression.text) && !NOT_STATE.has(n.expression.text)) {
            report(n, `${n.expression.text}() is called directly in an effect: derive the value, use useSyncExternalStore, or move it into a callback`);
          }
        });
      }
    }
    const fn =
      ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text) ? node
      : ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /^[A-Z]/.test(node.name.text) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) ? node.initializer
      : null;
    if (fn && fn.body && !isAsync(fn)) {
      components++;
      walkOwn(fn, (n) => {
        if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
          const text = n.expression.getText(sf);
          if (text === "Date.now" || text === "Math.random" || text === "performance.now") report(n, `${text}() is called while rendering: it is impure`);
        }
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}
console.log(`${files.length} files; ${texts} JSX text runs, ${effects} effects, ${components} components; ${problems.length} problems`);
for (const p of problems) console.log("  " + p);
process.exit(problems.length ? 1 : 0);
