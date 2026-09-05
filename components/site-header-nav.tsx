"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const currentNavClassName =
  "text-[0.9375rem] font-medium leading-snug text-edition-ink";

function navLinkClassName(active: boolean) {
  return cn(active ? currentNavClassName : "type-nav-link hover:text-edition-ink");
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
      Catalog
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
      Admin
    </Link>
  );
}
