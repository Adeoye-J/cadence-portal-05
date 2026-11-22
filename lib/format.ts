import type { Currency } from "@/db/schema";

const SYMBOL: Record<Currency, string> = { USD: "$", NGN: "₦" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formats integer minor units, for example 180000 USD becomes "$1,800.00". */
export function formatMoney(amountMinor: number, currency: Currency): string {
  const major = amountMinor / 100;
  const body = Math.abs(major).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${major < 0 ? "-" : ""}${SYMBOL[currency]}${body}`;
}

/** Formats an ISO date (YYYY-MM-DD) as DD MMM YYYY, per DESIGN.md. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const name = MONTHS[Number(month) - 1];
  if (!year || !day || !name) throw new RangeError(`Expected YYYY-MM-DD, got "${iso}"`);
  return `${day} ${name} ${year}`;
}

/** Formats an ISO timestamp as "DD MMM YYYY • HH:mm UTC", for signed records. */
export function formatDateTimeUtc(iso: string): string {
  const d = new Date(iso);
  const month = MONTHS[d.getUTCMonth()];
  if (Number.isNaN(d.getTime()) || !month) throw new RangeError(`Invalid timestamp "${iso}"`);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${d.getUTCFullYear()} • ${hh}:${mm} UTC`;
}

/** Human-readable size: "512 B", "48 KB", "3.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
