"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { parseThemePreference, THEME_COOKIE, type ThemePreference } from "@/lib/theme";

/**
 * Saves the theme preference. The cookie is readable by scripts so the device setting can be applied before
 * the first paint. It holds only the choice, never anything personal, so it is not httpOnly.
 */
export async function setThemeAction(value: string): Promise<{ ok: true; theme: ThemePreference }> {
  const theme = parseThemePreference(value);
  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
  revalidatePath("/", "layout");
  return { ok: true, theme };
}
