import { describe, expect, it } from "vitest";
import {
  isThemePreference,
  themePreferenceLabel,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

describe("theme preferences", () => {
  it("recognizes stored preference values", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("sepia")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });

  it("labels preferences for the menu trigger", () => {
    expect(themePreferenceLabel("light")).toBe("Light");
    expect(themePreferenceLabel("dark")).toBe("Dark");
    expect(themePreferenceLabel("system")).toBe("System");
  });

  it("uses a stable storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("clear-clef-theme");
  });
});
