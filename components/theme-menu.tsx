"use client";

import { Menu } from "@base-ui/react/menu";
import { useSyncExternalStore } from "react";
import { cn } from "cn";
import {
  ThemeDarkIcon,
  ThemeLightIcon,
  ThemePreferenceIcon,
  ThemeSystemIcon,
} from "@/components/theme-icons";
import {
  applyThemePreference,
  getStoredThemePreference,
  setThemePreference,
  themePreferenceLabel,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme";

const THEME_OPTIONS: ThemePreference[] = ["light", "dark", "system"];

const THEME_OPTION_ICONS = {
  light: ThemeLightIcon,
  dark: ThemeDarkIcon,
  system: ThemeSystemIcon,
} as const;

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
  align?: "start" | "center" | "end";
};

export function ThemeMenu({ className, align = "end" }: ThemeMenuProps) {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribeToThemeChanges,
    getStoredThemePreference,
    () => "system",
  );

  function choose(next: ThemePreference) {
    setThemePreference(next);
  }

  const triggerLabel = `Appearance: ${themePreferenceLabel(preference)}`;

  return (
    <Menu.Root>
      <Menu.Trigger
        type="button"
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full text-edition-muted transition-colors hover:bg-edition-canvas-soft hover:text-edition-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-hairline-strong/50",
          className,
        )}
        aria-label={triggerLabel}
        title={triggerLabel}
      >
        <ThemePreferenceIcon
          preference={preference}
          className="size-[1.125rem]"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align={align}>
          <Menu.Popup className="z-50 min-w-[9.5rem] origin-[var(--transform-origin)] rounded-xl border border-edition-hairline bg-edition-surface-card p-1 text-edition-ink outline-none transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {THEME_OPTIONS.map((option) => {
              const OptionIcon = THEME_OPTION_ICONS[option];
              return (
                <Menu.Item
                  key={option}
                  className={cn(
                    "flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-[0.9375rem] outline-none select-none data-highlighted:bg-edition-canvas-soft",
                    preference === option
                      ? "font-medium text-edition-ink"
                      : "font-normal text-edition-muted",
                  )}
                  onClick={() => choose(option)}
                >
                  <OptionIcon className="size-4 shrink-0" />
                  {themePreferenceLabel(option)}
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
