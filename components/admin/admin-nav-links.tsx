"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const ENTRIES = [
  { href: "/admin", label: "Overview", match: (path: string) => path === "/admin" },
  {
    href: "/admin/scores",
    label: "Scores",
    match: (path: string) =>
      path === "/admin/scores" || path.startsWith("/admin/scores/"),
  },
  {
    href: "/admin/upload",
    label: "Upload",
    match: (path: string) => path.startsWith("/admin/upload"),
  },
] as const;

export function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Register" className="lg:sticky lg:top-20">
      <p className="type-running-head">Register</p>
      <ul className="mt-3 border-t border-edition-hairline">
        {ENTRIES.map((entry) => {
          const active = entry.match(pathname);
          return (
            <li key={entry.href} className="border-b border-edition-hairline-soft">
              <Link
                href={entry.href}
                className={cn(
                  "type-nav-link inline-flex py-2.5 edition-interactive-transition hover:text-edition-ink",
                  active && "nav-current",
                )}
                aria-current={active ? "page" : undefined}
              >
                {entry.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
