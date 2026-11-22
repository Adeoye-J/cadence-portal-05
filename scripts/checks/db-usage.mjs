/**
 * Checks the Drizzle code against the schema, without a database: every column used exists, every insert gives the
 * columns that need a value and none that the database generates, and the enum values written in code are real.
 * It is a text scan, not a type check. It does not replace pnpm typecheck or a run against Postgres.
 */
import fs from "node:fs";
import path from "node:path";
import { lineOf, matchClose, splitTop, stripComments } from "./lib-scan.mjs";

const ROOT = process.cwd();
const read = (p) => stripComments(fs.readFileSync(path.join(ROOT, p), "utf8"));

const enums = new Map();
const tables = new Map();
const tableVars = new Map();

function parseSchema(file) {
  const src = read(file);
  for (const m of src.matchAll(/export const (\w+) = pgEnum\(\s*"[^"]+",\s*\[([^\]]*)\]/g)) {
    enums.set(m[1], [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
  }
  for (const m of src.matchAll(/export const (\w+) = pgTable\(\s*"([^"]+)",\s*\{/g)) {
    const open = m.index + m[0].length - 1;
    const body = src.slice(open + 1, matchClose(src, open));
    const columns = new Map();
    for (const part of splitTop(body)) {
      const km = part.match(/^(\w+):\s*([\s\S]*)$/);
      if (!km) continue;
      const expr = km[2];
      const hasDefault = /\.default\(|\.defaultNow\(|\.\$defaultFn\(|generated(Always|ByDefault)AsIdentity/.test(expr);
      const identity = /generatedAlwaysAsIdentity/.test(expr);
      const notNull = /\.notNull\(\)|\.primaryKey\(\)/.test(expr);
      const enumVar = (expr.match(/^(\w+)\("/) || [])[1];
      columns.set(km[1], { required: notNull && !hasDefault, identity, enumValues: enums.get(enumVar) });
    }
    tables.set(m[2], columns);
    tableVars.set(m[1], columns);
  }
}
parseSchema("db/auth-schema.ts");
parseSchema("db/schema.ts");
tableVars.set("users", tableVars.get("user"));

const FILES = ["server/core/drizzle.ts", "server/store/drizzle.ts", "server/billing-store-drizzle.ts", "server/outbox-drizzle.ts"].filter((f) => fs.existsSync(path.join(ROOT, f)));
const problems = [];
let inserts = 0, updates = 0, refs = 0, literals = 0;

function objectKeys(objSrc) {
  const inner = objSrc.slice(1, -1);
  return splitTop(inner).map((p) => (p.match(/^(\w+)\s*(?::|$)/) || [])[1]).filter(Boolean);
}

function literalValues(objSrc) {
  const out = [];
  for (const p of splitTop(objSrc.slice(1, -1))) {
    const m = p.match(/^(\w+):\s*(?:"([^"]+)"|(\w+)\s+as\s+const)\s*$/);
    if (m) out.push([m[1], m[2]]);
  }
  return out;
}

for (const file of FILES) {
  const src = read(file);
  const where = (idx) => `${file}:${lineOf(src, idx)}`;

  // Import aliases for tables: import { signatures as signatureRows } from "@/db/schema"
  for (const im of src.matchAll(/import \{([^}]*)\} from "@\/db\/(?:schema|auth-schema)"/g)) {
    for (const part of im[1].split(",")) {
      const am = part.trim().match(/^(\w+) as (\w+)$/);
      if (am && tableVars.has(am[1])) tableVars.set(am[2], tableVars.get(am[1]));
    }
  }

  // Aliases for row types: type Name = typeof table.$inferSelect
  const aliases = new Map([...src.matchAll(/type (\w+) = typeof (\w+)\.\$inferSelect/g)].map((m) => [m[1], m[2]]));

  // Column references: tableVar.column
  for (const m of src.matchAll(/\b(\w+)\.(\w+)\b/g)) {
    const cols = tableVars.get(m[1]);
    if (!cols || m.index > 0 && src[m.index - 1] === ".") continue;
    if (["$inferSelect", "$inferInsert"].includes(m[2])) continue;
    refs++;
    if (!cols.has(m[2])) problems.push(`${where(m.index)}: ${m[1]}.${m[2]} is not a column`);
  }

  // inserts
  for (const m of src.matchAll(/\.insert\((\w+)\)\s*\.values\(/g)) {
    const cols = tableVars.get(m[1]);
    if (!cols) { problems.push(`${where(m.index)}: insert into unknown table ${m[1]}`); continue; }
    const open = m.index + m[0].length - 1;
    const arg = src.slice(open + 1, matchClose(src, open));
    const objStart = arg.indexOf("{");
    if (objStart < 0) continue;
    const obj = arg.slice(objStart, matchClose(arg, objStart) + 1);
    const keys = new Set(objectKeys(obj));
    inserts++;
    for (const k of keys) {
      if (!cols.has(k)) problems.push(`${where(m.index)}: insert into ${m[1]} gives unknown column ${k}`);
      else if (cols.get(k).identity) problems.push(`${where(m.index)}: insert into ${m[1]} gives ${k}, which the database generates`);
    }
    for (const [name, info] of cols) if (info.required && !keys.has(name)) problems.push(`${where(m.index)}: insert into ${m[1]} is missing required column ${name}`);
    for (const [k, v] of literalValues(obj)) {
      const ev = cols.get(k)?.enumValues;
      literals++;
      if (ev && !ev.includes(v)) problems.push(`${where(m.index)}: ${m[1]}.${k} = "${v}" is not one of ${ev.join(", ")}`);
    }
  }

  // updates
  for (const m of src.matchAll(/\.update\((\w+)\)\s*\.set\(/g)) {
    const cols = tableVars.get(m[1]);
    if (!cols) { problems.push(`${where(m.index)}: update of unknown table ${m[1]}`); continue; }
    const open = m.index + m[0].length - 1;
    const arg = src.slice(open + 1, matchClose(src, open)).trim();
    if (!arg.startsWith("{")) continue;
    updates++;
    for (const k of objectKeys(arg)) if (!cols.has(k)) problems.push(`${where(m.index)}: update of ${m[1]} sets unknown column ${k}`);
    for (const [k, v] of literalValues(arg)) {
      const ev = cols.get(k)?.enumValues;
      literals++;
      if (ev && !ev.includes(v)) problems.push(`${where(m.index)}: ${m[1]}.${k} set to "${v}", which is not one of ${ev.join(", ")}`);
    }
  }

  // eq/ne(table.column, "literal")
  for (const m of src.matchAll(/\b(?:eq|ne)\((\w+)\.(\w+),\s*"([^"]+)"\)/g)) {
    const ev = tableVars.get(m[1])?.get(m[2])?.enumValues;
    literals++;
    if (ev && !ev.includes(m[3])) problems.push(`${where(m.index)}: ${m[1]}.${m[2]} compared with "${m[3]}", which is not one of ${ev.join(", ")}`);
  }
  // sql`${table.column} <> 'literal'`
  for (const m of src.matchAll(/\$\{(\w+)\.(\w+)\}\s*(?:<>|=|!=)\s*'([^']+)'/g)) {
    const ev = tableVars.get(m[1])?.get(m[2])?.enumValues;
    literals++;
    if (ev && !ev.includes(m[3])) problems.push(`${where(m.index)}: ${m[1]}.${m[2]} compared with '${m[3]}', which is not one of ${ev.join(", ")}`);
  }

  // mapper functions: (name: typeof table.$inferSelect) or an alias of it
  for (const m of src.matchAll(/function \w+\((\w+): (?:typeof (\w+)\.\$inferSelect|(\w+))\)[^{]*\{/g)) {
    const tv = m[2] || aliases.get(m[3]);
    const cols = tv && tableVars.get(tv);
    if (!cols) continue;
    const open = m.index + m[0].length - 1;
    const body = src.slice(open, matchClose(src, open));
    for (const u of body.matchAll(new RegExp(`\\b${m[1]}\\.(\\w+)\\b`, "g"))) {
      refs++;
      if (!cols.has(u[1])) problems.push(`${where(open + u.index)}: ${m[1]}.${u[1]} is not a column of ${tv}`);
    }
  }
  // toPayment-style: row.payment is a payments row, read through const p = row.payment
  for (const m of src.matchAll(/payment: typeof (\w+)\.\$inferSelect[^)]*\)[^{]*\{\s*const (\w+) = row\.payment;/g)) {
    const cols = tableVars.get(m[1]);
    const open = src.indexOf("{", m.index + m[0].indexOf(")"));
    const body = src.slice(open, matchClose(src, open));
    for (const u of body.matchAll(new RegExp(`\\b${m[2]}\\.(\\w+)\\b`, "g"))) {
      refs++;
      if (!cols.has(u[1])) problems.push(`${where(open + u.index)}: ${m[2]}.${u[1]} is not a column of ${m[1]}`);
    }
  }
}

console.log(`${tables.size} tables, ${enums.size} enums; ${FILES.length} files: ${inserts} inserts, ${updates} updates, ${refs} column references, ${literals} enum literals checked, ${problems.length} problems`);
for (const p of problems) console.log("  " + p);
process.exit(problems.length ? 1 : 0);
