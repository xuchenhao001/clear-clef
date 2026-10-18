"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

// A menu is a value ladder: the current item is bone, everything else sits back
// in the muted tone and lifts on hover. Selection is a change of value, not a
// chip — the game never draws a background behind the current entry.
function navLinkClassName(active: boolean) {
  return cn(
    "type-nav-link edition-interactive-transition",
    active ? "nav-current text-edition-ink" : "hover:text-edition-ink",
  );
}

export function CatalogNavLink() {
  const pathname = usePathname();
  const onCatalog = pathname === "/";

  return (
    <Link
      href="/"
      className={navLinkClassName(onCatalog)}
      aria-current={onCatalog ? "page" : undefined}
    >
      Catalogue
    </Link>
  );
}

export function AdminNavLink() {
  const pathname = usePathname();
  const onAdmin = pathname.startsWith("/admin");

  return (
    <Link
      href="/admin"
      className={navLinkClassName(onAdmin)}
      aria-current={onAdmin ? "page" : undefined}
    >
      Register
    </Link>
  );
}
