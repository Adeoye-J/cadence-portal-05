import { cn } from "@/lib/cn";

/**
 * Placeholder logo. The design's logo is a hosted image that could not be fetched, so the wordmark stands in.
 * Replace the body with the real SVG or image when the asset is supplied. Keep the accessible name.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Cadence logo" className={cn("inline-flex h-7 items-center text-headline-md font-semibold tracking-tight text-primary", className)}>
      Cadence
    </span>
  );
}

/**
 * Placeholder for the Google mark. The official mark must be supplied; this is a neutral stand-in so the
 * button keeps its layout and meaning.
 */
export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-[18px]", className)}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor">G</text>
    </svg>
  );
}

/**
 * Placeholder for an illustration or photo the designs reference by an external address. Keeps the layout and says what
 * belongs there. Replace with the supplied asset when it arrives.
 */
export function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <span role="img" aria-label={label || "Image placeholder"} className={cn("flex min-h-24 w-full items-center justify-center rounded-lg border border-dashed border-border bg-surface-container-low text-label-sm text-ink-muted", className)}>
      {label || "Image"}
    </span>
  );
}
