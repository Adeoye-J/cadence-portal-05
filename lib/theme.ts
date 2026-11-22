/**
 * Theme preference: light, dark, or match the device. Stored per browser in a cookie. A cookie is used
 * because no user row exists to hold it yet. Once the database is wired, the same value can move to the
 * user's record, and this cookie becomes its cache.
 */
export const THEME_COOKIE = "cadence-theme";
export const THEME_OPTIONS = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_OPTIONS)[number];

export function parseThemePreference(value: string | undefined | null): ThemePreference {
  return (THEME_OPTIONS as readonly string[]).includes(value ?? "") ? (value as ThemePreference) : "system";
}
