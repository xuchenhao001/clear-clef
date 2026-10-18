export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "clear-clef-theme";
export const THEME_CHANGE_EVENT = "clear-clef-theme-change";

const THEME_LABELS: Record<ThemePreference, string> = {
  light: "Lamp",
  dark: "Night",
  system: "System",
};

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "system";
}

export function resolveThemeIsDark(preference: ThemePreference): boolean {
  if (preference === "light") {
    return false;
  }
  if (preference === "dark") {
    return true;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyThemePreference(preference: ThemePreference): void {
  const isDark = resolveThemeIsDark(preference);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

export function setThemePreference(preference: ThemePreference): void {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyThemePreference(preference);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function themePreferenceLabel(preference: ThemePreference): string {
  return THEME_LABELS[preference];
}
