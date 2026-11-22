"use server";

import { z } from "zod";
import { env } from "@/lib/env";
import { getViewer } from "@/lib/session";
import { cancelSubscription, startSubscriptionCheckout } from "@/server/billing";
import { billingDeps } from "@/server/billing-runtime";
import { getStudioMembership } from "@/server/studio";

const checkoutSchema = z.object({
  planKey: z.enum(["pro", "studio"]),
  cycle: z.enum(["monthly", "annual"]),
});

export type CheckoutResult = { ok: true; url: string } | { ok: false; message: string };

/** Starts a plan payment. The browser then goes to the payment provider's page. */
export async function startCheckoutAction(input: unknown): Promise<CheckoutResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Sign in to change your plan." };
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a plan and a billing cycle." };

  const result = await startSubscriptionCheckout(billingDeps(), {
    userId: viewer.userId,
    email: viewer.email,
    planKey: parsed.data.planKey,
    cycle: parsed.data.cycle,
    callbackUrl: `${env.APP_URL}/studio/billing?return=1`,
  });
  return result.ok ? { ok: true, url: result.authorizationUrl } : { ok: false, message: result.message };
}

/** The owner cancels at the end of the paid period. */
export async function cancelPlanAction(): Promise<{ ok: true } | { ok: false; message: string }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Sign in to change your plan." };
  const membership = await getStudioMembership(viewer.userId);
  if (!membership) return { ok: false, message: "Studio not found." };
  if (membership.role !== "owner") return { ok: false, message: "Only the studio owner can change the plan." };
  await cancelSubscription(billingDeps().store, membership.studioId);
  return { ok: true };
}
