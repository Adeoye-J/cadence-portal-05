"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { THEME_OPTIONS, type ThemePreference } from "@/lib/theme";
import { setThemeAction } from "@/server/theme-actions";

const LABEL: Record<ThemePreference, string> = { light: "Light", dark: "Dark", system: "Match device" };

function applyNow(theme: ThemePreference) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/** Lets the signed-in user choose light, dark, or their device setting. Applies at once, then saves. */
export function ThemeSelector({ current }: { current: ThemePreference }) {
  const [value, setValue] = useState<ThemePreference>(current);
  const [pending, startTransition] = useTransition();

  function choose(next: ThemePreference) {
    setValue(next);
    applyNow(next);
    startTransition(async () => {
      await setThemeAction(next);
    });
  }

  return (
    <fieldset className="flex flex-col gap-3" aria-busy={pending || undefined}>
      <legend className="text-body-sm-medium text-ink">Theme</legend>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
        {THEME_OPTIONS.map((option) => (
          <label
            key={option}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center rounded-control border px-3 text-body-sm-medium transition-colors",
              value === option ? "border-primary bg-primary-container text-on-primary" : "border-border bg-surface-container-lowest text-ink hover:bg-surface-container",
            )}
          >
            <input
              type="radio"
              name="theme"
              value={option}
              checked={value === option}
              onChange={() => choose(option)}
              className="sr-only"
            />
            {LABEL[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
