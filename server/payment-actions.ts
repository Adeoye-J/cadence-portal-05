"use server";

import { env } from "@/lib/env";
import { paystack } from "@/lib/services/paystack";
import { getViewer } from "@/lib/session";
import { startMilestonePayment } from "@/server/payments";

export type StartPaymentResult =
  | { ok: true; authorizationUrl: string }
  | { ok: false; message: string };

/**
 * Server Action: starts a payment for one milestone. Returns the provider's checkout URL.
 * The client sends the user there. Nothing is settled here.
 */
export async function startPaymentAction(projectId: string, position: number): Promise<StartPaymentResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Your session has ended. Sign in again to continue." };
  if (!Number.isInteger(position) || position < 1) return { ok: false, message: "Invalid milestone." };

  const result = await startMilestonePayment({
    viewerUserId: viewer.userId,
    viewerEmail: viewer.email,
    projectId,
    position,
    provider: paystack,
    appUrl: env.APP_URL,
  });
  if (!result.ok) return result;
  return { ok: true, authorizationUrl: result.authorizationUrl };
}
