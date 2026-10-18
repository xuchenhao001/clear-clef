import Link from "next/link";
import { AdminNavLink, CatalogNavLink } from "@/components/site-header-nav";
import { ThemeMenu } from "@/components/theme-menu";

export function SiteHeader() {
  return (
    <header className="surface-board on-board rule-tooled">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-4 px-6">
        <nav aria-label="Site" className="flex items-center gap-6">
          <Link
            href="/"
            className="font-display text-[1.125rem] font-semibold tracking-[0.2em] text-edition-ink uppercase"
          >
            ClearClef
          </Link>
          <CatalogNavLink />
          <AdminNavLink />
        </nav>
        <div className="flex items-center gap-4">
          <ThemeMenu />
        </div>
      </div>
    </header>
  );
}
