"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startPaymentAction } from "@/server/payment-actions";

/**
 * Starts payment for one milestone, then sends the browser to the provider's checkout.
 * The button stays busy until the redirect starts, so a double tap cannot start two payments.
 */
export function PayMilestoneButton({
  projectId,
  position,
  label,
}: {
  projectId: string;
  position: number;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function onClick() {
    setError(undefined);
    startTransition(async () => {
      const result = await startPaymentAction(projectId, position);
      if (result.ok) {
        window.location.assign(result.authorizationUrl);
        return;
      }
      setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={onClick} loading={pending} className="w-full">
        {label}
      </Button>
      {error ? (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
