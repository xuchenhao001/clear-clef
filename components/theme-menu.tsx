"use client";

import { useSyncExternalStore } from "react";
import { cn } from "cn";
import {
  applyThemePreference,
  getStoredThemePreference,
  setThemePreference,
  themePreferenceLabel,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme";

const CYCLE: ThemePreference[] = ["light", "dark", "system"];

function subscribeToThemeChanges(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (getStoredThemePreference() === "system") {
      applyThemePreference("system");
    }
    onStoreChange();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      const next = getStoredThemePreference();
      applyThemePreference(next);
      onStoreChange();
    }
  };

  mediaQuery.addEventListener("change", onSystemChange);
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

type ThemeMenuProps = {
  className?: string;
};

/** A word in the rail. Each press steps Lamp, Night, System. */
export function ThemeMenu({ className }: ThemeMenuProps) {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribeToThemeChanges,
    getStoredThemePreference,
    () => "system",
  );

  function cycle() {
    const index = CYCLE.indexOf(preference);
    const next = CYCLE[(index + 1) % CYCLE.length] ?? "system";
    setThemePreference(next);
  }

  const label = themePreferenceLabel(preference);

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        "type-nav-link edition-interactive-transition hover:text-edition-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring",
        className,
      )}
      aria-label={`Appearance: ${label}. Activate to change.`}
    >
      {label}
    </button>
  );
}
