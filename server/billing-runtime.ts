import { db } from "@/db/client";
import { paystack } from "@/lib/services/paystack";
import { checkNewActiveProject, type BillingDeps } from "@/server/billing";
import { createDrizzleBillingStore } from "@/server/billing-store-drizzle";
import { getStudioMembership } from "@/server/studio";

/** The production wiring: Postgres for billing records, Paystack for payments. Only the app and webhook import this. */
export function billingDeps(): BillingDeps {
  return { store: createDrizzleBillingStore(db), provider: paystack };
}

/** Whether the signed-in user's studio may start another active project. */
export async function projectAllowanceForUser(userId: string) {
  const membership = await getStudioMembership(userId);
  if (!membership) return { ok: false as const, message: "Studio not found." };
  return checkNewActiveProject(billingDeps().store, membership.studioId);
}
