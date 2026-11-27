
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "cn";

const ENTRIES = [
  { to: "/admin", label: "Overview", match: (path: string) => path === "/admin" },
  {
    to: "/admin/scores",
    label: "Scores",
    match: (path: string) =>
      path === "/admin/scores" || path.startsWith("/admin/scores/"),
  },
  {
    to: "/admin/composers",
    label: "Composers",
    match: (path: string) => path.startsWith("/admin/composers"),
  },
  {
    to: "/admin/upload",
    label: "Upload",
    match: (path: string) => path.startsWith("/admin/upload"),
  },
  {
    to: "/admin/batch-upload",
    label: "Batch upload",
    match: (path: string) => path.startsWith("/admin/batch-upload"),
  },
] as const;

export function AdminNavLinks() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav aria-label="Register" className="lg:sticky lg:top-20">
      <p className="type-running-head">Register</p>
      <ul className="mt-3 border-t border-edition-hairline">
        {ENTRIES.map((entry) => {
          const active = entry.match(pathname);
          return (
            <li key={entry.to} className="border-b border-edition-hairline-soft">
              <Link
                to={entry.to}
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
