"use server";

import { z } from "zod";
import { recordPendingSignup } from "@/server/onboarding";
import { signUpSchema } from "@/lib/validation/signup";

export type SignUpState =
  | { status: "idle" }
  | { status: "ready"; email: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

/**
 * Validates the sign-up form and holds its details until the first sign-in. The client then requests the
 * sign-in link. Nothing is created in the database here.
 */
export async function signUpAction(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    workEmail: formData.get("workEmail") ?? "",
    studioName: formData.get("studioName") ?? "",
    country: formData.get("country") ?? "",
    currency: formData.get("currency") ?? "",
    terms: formData.get("terms") ?? undefined,
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    const flat = Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]));
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: flat };
  }
  const { workEmail, ...details } = parsed.data;
  await recordPendingSignup(details, workEmail);
  return { status: "ready", email: workEmail };
}
