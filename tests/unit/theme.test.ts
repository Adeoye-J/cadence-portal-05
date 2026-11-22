import { describe, expect, it } from "vitest";
import { parseThemePreference } from "@/lib/theme";

describe("theme preference", () => {
  it("accepts the three choices", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
  });

  it("falls back to the device setting for anything else, including a missing cookie", () => {
    expect(parseThemePreference(undefined)).toBe("system");
    expect(parseThemePreference("")).toBe("system");
    expect(parseThemePreference("<script>")).toBe("system");
  });
});
