import type { ReactNode } from "react";
import type { ThemePreference } from "@/lib/theme";

type ThemeIconProps = {
  className?: string;
};

function IconShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ThemeLightIcon({ className }: ThemeIconProps) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </IconShell>
  );
}

export function ThemeDarkIcon({ className }: ThemeIconProps) {
  return (
    <IconShell className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </IconShell>
  );
}

export function ThemeSystemIcon({ className }: ThemeIconProps) {
  return (
    <IconShell className={className}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </IconShell>
  );
}

export function ThemePreferenceIcon({
  preference,
  className,
}: ThemeIconProps & { preference: ThemePreference }) {
  switch (preference) {
    case "light":
      return <ThemeLightIcon className={className} />;
    case "dark":
      return <ThemeDarkIcon className={className} />;
    case "system":
      return <ThemeSystemIcon className={className} />;
  }
}
