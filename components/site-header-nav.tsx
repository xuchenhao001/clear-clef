
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "cn";

function navLinkClassName(active: boolean) {
  return cn(
    "type-nav-link edition-interactive-transition",
    active ? "nav-current text-edition-ink" : "hover:text-edition-ink",
  );
}

export function CatalogNavLink() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onCatalog = pathname === "/";

  return (
    <Link
      to="/"
      className={navLinkClassName(onCatalog)}
      aria-current={onCatalog ? "page" : undefined}
    >
      Catalogue
    </Link>
  );
}

export function AdminNavLink() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onAdmin = pathname.startsWith("/admin");

  return (
    <Link
      to="/admin"
      className={navLinkClassName(onAdmin)}
      aria-current={onAdmin ? "page" : undefined}
    >
      Register
    </Link>
  );
}
