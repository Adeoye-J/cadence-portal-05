"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ico } from "@/components/ui/icon";
import { cancelPlanAction } from "@/server/billing-actions";

/**
 * The cancel row at the foot of the billing page. Cancelling keeps the plan until the paid period ends, then the studio
 * returns to Free. Nothing is refunded. A second click confirms.
 */
export function CancelPlan({ periodEndLabel, cancelScheduled }: { periodEndLabel: string; cancelScheduled: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function cancel() {
    setError(undefined);
    startTransition(async () => {
      const result = await cancelPlanAction();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div id="cancel" className="pt-space-md pb-space-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm scroll-mt-24">
      <div className="flex items-center gap-2 text-secondary text-body-sm">
        <Ico name="info" size={18} />
        <span>
          {cancelScheduled
            ? `Your plan is set to end on ${periodEndLabel}, then returns to Free.`
            : `Your plan stays active until the end of the period you paid for, on ${periodEndLabel}.`}
        </span>
      </div>
      {cancelScheduled ? null : (
        <div className="flex flex-col items-start sm:items-end gap-1">
          {confirming ? (
            <div className="flex items-center gap-3">
              <button type="button" onClick={cancel} disabled={pending} className="text-error text-body-sm-medium hover:underline disabled:opacity-60">
                {pending ? "Cancelling…" : "Yes, cancel at period end"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="text-body-sm-medium text-secondary hover:underline">
                Keep plan
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="text-error text-body-sm-medium hover:underline transition-colors">
              Cancel plan
            </button>
          )}
          {error ? <p role="alert" className="text-body-sm text-danger">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
