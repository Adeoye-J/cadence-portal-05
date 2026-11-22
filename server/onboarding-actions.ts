"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { createStudioFor, takePendingSignup } from "@/server/onboarding";

export type OnboardingState = { status: "idle" } | { status: "error"; message: string };

/** Creates the studio from the sign-up details the user entered, and makes them its owner. */
export async function completeOnboardingAction(): Promise<OnboardingState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "Sign in again to continue." };
  const details = await takePendingSignup(viewer.email);
  if (!details) return { status: "error", message: "Your sign-up details have expired. Start again from the sign-up page." };
  await createStudioFor(viewer.userId, details.studioName);
  redirect("/studio/projects");
}
