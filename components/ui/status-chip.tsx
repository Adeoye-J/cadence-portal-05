import { CircleAlert, CircleCheck, CircleX, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Status chips always pair an icon with text (DESIGN.md: colour is never the
 * only indicator). The tone decides colour; the label decides meaning.
 */
const tones: Record<
  "waiting" | "done" | "critical" | "neutral",
  { Icon: LucideIcon; label: string; className: string }
> = {
  waiting: {
    Icon: CircleAlert,
    label: "Waiting on you",
    className: "border-waiting-border bg-waiting-subtle text-waiting",
  },
  done: {
    Icon: CircleCheck,
    label: "Done",
    className: "border-done-border bg-done-subtle text-done",
  },
  critical: {
    Icon: CircleX,
    label: "Overdue",
    className: "border-danger-border bg-danger-subtle text-danger",
  },
  neutral: {
    Icon: Clock,
    label: "Upcoming",
    className: "border-border bg-surface text-ink-muted",
  },
};

export type StatusTone = keyof typeof tones;

export function StatusChip({ tone, label }: { tone: StatusTone; label?: string }) {
  const { Icon, label: defaultLabel, className } = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label-md tracking-[0.02em]",
        className,
      )}
    >
      <Icon size={12} aria-hidden="true" strokeWidth={2.25} />
      {label ?? defaultLabel}
    </span>
  );
}
