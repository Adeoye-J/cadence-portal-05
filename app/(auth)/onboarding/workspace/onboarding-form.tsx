"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { completeOnboardingAction, type OnboardingState } from "@/server/onboarding-actions";

const initial: OnboardingState = { status: "idle" };

export function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboardingAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.status === "error" ? <p role="alert" className="rounded-control bg-danger-subtle p-3 text-body-sm text-danger">{state.message}</p> : null}
      <Button type="submit" loading={pending} className="w-full sm:w-auto">Create my studio</Button>
    </form>
  );
}
