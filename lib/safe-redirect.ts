/**
 * Accepts only same-origin paths, so a "next" parameter cannot send users to another site.
 * Rejects protocol-relative paths ("//host"), backslash tricks, and control characters.
 */
export function safeNextPath(value: string | undefined, fallback = "/projects"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
