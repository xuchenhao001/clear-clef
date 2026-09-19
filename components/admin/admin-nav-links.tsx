"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const currentNavClassName =
  "text-[0.9375rem] font-medium leading-snug text-edition-ink";

function navLinkClassName(active: boolean) {
  return cn(active ? currentNavClassName : "type-nav-link hover:text-edition-ink");
}

export function AdminNavLinks() {
  const pathname = usePathname();
  const onDashboard = pathname === "/admin";
  const onScores = pathname.startsWith("/admin/scores");
  const onUpload = pathname.startsWith("/admin/upload");

  return (
    <nav className="flex items-center gap-4" aria-label="Admin">
      <Link
        href="/admin"
        className={navLinkClassName(onDashboard)}
        aria-current={onDashboard ? "page" : undefined}
      >
        Dashboard
      </Link>
      <Link
        href="/admin/scores"
        className={navLinkClassName(onScores)}
        aria-current={onScores ? "page" : undefined}
      >
        Scores
      </Link>
      <Link
        href="/admin/upload"
        className={navLinkClassName(onUpload)}
        aria-current={onUpload ? "page" : undefined}
      >
        Upload
      </Link>
    </nav>
  );
}
