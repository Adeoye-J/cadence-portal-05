import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export { PROJECT_STAGES } from "@/lib/project-stages";
import { PROJECT_STAGES } from "@/lib/project-stages";

type Props = {
  /** Zero-based index of the current stage, 0 to 5. */
  currentIndex: number;
  /** Optional timestamps per stage, already formatted as "14 Nov 2026, 16:40". */
  timestamps?: ReadonlyArray<string | undefined>;
  className?: string;
};

/**
 * Six-stage project progress (DESIGN.md "Horizontal Six-Stage Milestone Stepper").
 * Desktop and tablet render the full rail. Phone renders "Step X of 6" with a
 * segmented bar. Only one layout is exposed to assistive tech at a time.
 */
export function MilestoneStepper({ currentIndex, timestamps = [], className }: Props) {
  const last = PROJECT_STAGES.length - 1;
  const current = Math.min(Math.max(currentIndex, 0), last);

  return (
    <nav aria-label="Project progress" className={cn("w-full", className)}>
      <ol className="hidden sm:flex">
        {PROJECT_STAGES.map((stage, i) => {
          const state = i < current ? "complete" : i === current ? "current" : "upcoming";
          return (
            <li
              key={stage}
              aria-current={state === "current" ? "step" : undefined}
              className="flex min-w-0 flex-1 flex-col gap-2 last:flex-none"
            >
              <div className="flex items-center">
                <StageNode state={state} index={i} />
                {i < last ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mx-2 flex-1",
                      i < current ? "h-0.5 bg-primary-container" : "h-0 border-t border-dashed border-border",
                    )}
                  />
                ) : null}
              </div>
              <div className="pr-3">
                <p
                  className={cn(
                    "text-body-sm",
                    state === "upcoming" ? "text-ink-muted" : "font-semibold text-ink",
                  )}
                >
                  <span className="sr-only">{state}: </span>
                  {stage}
                </p>
                {timestamps[i] ? (
                  <p className="tnum mt-0.5 text-label-md font-normal text-ink-muted">
                    {timestamps[i]}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="sm:hidden">
        <p className="text-label-md text-ink-muted">
          Step {current + 1} of {PROJECT_STAGES.length}
        </p>
        <p className="mt-0.5 text-headline-sm text-ink">{PROJECT_STAGES[current]}</p>
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {PROJECT_STAGES.map((stage, i) => (
            <span
              key={stage}
              className={cn("h-1 flex-1 rounded-full", i <= current ? "bg-primary-container" : "bg-border")}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function StageNode({ state, index }: { state: "complete" | "current" | "upcoming"; index: number }) {
  const label = state === "complete" ? "Completed" : state === "current" ? "Current" : "Upcoming";
  if (state === "complete") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-white">
        <Check size={14} strokeWidth={3} aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-surface">
        <span aria-hidden="true" className="size-2 rounded-full bg-primary-container" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-label-md text-ink-muted">
      {index + 1}
      <span className="sr-only">{label}</span>
    </span>
  );
}
