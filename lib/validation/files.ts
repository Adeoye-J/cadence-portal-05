/**
 * Deliverable file rules. The declared type is checked before upload. The real content is checked
 * after upload, by reading the first bytes, because a declared type can lie.
 */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export type Family = "pdf" | "png" | "jpeg" | "zip";

/** Declared content types we accept, and the signature family each must match. Office files are ZIP containers. */
export const DELIVERABLE_TYPES: Record<string, { family: Family; label: string }> = {
  "application/pdf": { family: "pdf", label: "PDF" },
  "image/png": { family: "png", label: "PNG image" },
  "image/jpeg": { family: "jpeg", label: "JPEG image" },
  "application/zip": { family: "zip", label: "ZIP archive" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { family: "zip", label: "Word document" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { family: "zip", label: "Excel workbook" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { family: "zip", label: "PowerPoint deck" },
};

const SIGNATURES: [Family, number[]][] = [
  ["pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]], // %PDF-
  ["png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ["jpeg", [0xff, 0xd8, 0xff]],
  ["zip", [0x50, 0x4b, 0x03, 0x04]],
];

/** The family of the file's first bytes, or null when no known signature matches. */
export function sniffFamily(bytes: Uint8Array): Family | null {
  for (const [family, signature] of SIGNATURES) {
    if (signature.every((byte, i) => bytes[i] === byte)) return family;
  }
  return null;
}

/** A filename safe to show and to put in a Content-Disposition header. Returns null if nothing usable is left. */
export function safeFilename(raw: string): string | null {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, "_").replace(/\s+/g, " ").trim().slice(0, 120);
  return /[A-Za-z0-9]/.test(cleaned) ? cleaned : null;
}
