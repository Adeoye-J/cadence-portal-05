"use server";

import { cookies } from "next/headers";
import { LOGIN_EMAIL_COOKIE, LOGIN_EMAIL_MAX_AGE_SEC } from "@/lib/login-email";
import { signInSchema } from "@/lib/validation/auth";

/** Remembers the address a sign-in link was sent to, for the check-email page. Refuses anything that is not an address. */
export async function rememberSignInEmailAction(email: string): Promise<{ ok: boolean }> {
  const parsed = signInSchema.safeParse({ email });
  if (!parsed.success) return { ok: false };
  const store = await cookies();
  store.set(LOGIN_EMAIL_COOKIE, parsed.data.email, {
    path: "/",
    maxAge: LOGIN_EMAIL_MAX_AGE_SEC,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}
