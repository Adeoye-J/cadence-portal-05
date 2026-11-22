/** Small source-scanning helpers shared by the checks. Not a parser: enough to match brackets and skip strings. */

/** Index after the string or template literal that starts at i. */
export function skipString(src, i) {
  const q = src[i];
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === "\\") { j += 2; continue; }
    if (q === "`" && c === "$" && src[j + 1] === "{") { j = matchClose(src, j + 1) + 1; continue; }
    if (c === q) return j + 1;
    j += 1;
  }
  return src.length;
}

/** Index of the bracket that closes the one at openIdx, skipping strings and comments. */
export function matchClose(src, openIdx) {
  const open = src[openIdx];
  const close = { "(": ")", "{": "}", "[": "]" }[open];
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") { i = skipString(src, i) - 1; continue; }
    if (c === "/" && src[i + 1] === "/") { i = src.indexOf("\n", i); if (i < 0) return src.length; continue; }
    if (c === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i) + 1; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return i; }
  }
  return src.length;
}

/** Splits the inside of a bracket pair at top-level commas. */
export function splitTop(inner) {
  const parts = [];
  let start = 0;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '"' || c === "'" || c === "`") { i = skipString(inner, i) - 1; continue; }
    if (c === "(" || c === "{" || c === "[") { i = matchClose(inner, i); continue; }
    if (c === ",") { parts.push(inner.slice(start, i)); start = i + 1; }
  }
  parts.push(inner.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

export function lineOf(src, idx) {
  let n = 1;
  for (let i = 0; i < idx && i < src.length; i++) if (src[i] === "\n") n++;
  return n;
}

/** Removes // and /* *​/ comments, keeping line breaks so line numbers still match. */
export function stripComments(src) {
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") { const j = skipString(src, i); out += src.slice(i, j); i = j - 1; continue; }
    if (c === "/" && src[i + 1] === "/") { const j = src.indexOf("\n", i); const end = j < 0 ? src.length : j; i = end - 1; continue; }
    if (c === "/" && src[i + 1] === "*") { const j = src.indexOf("*/", i) + 2; out += src.slice(i, j).replace(/[^\n]/g, " "); i = j - 1; continue; }
    out += c;
  }
  return out;
}
