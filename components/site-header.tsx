import Link from "next/link";
import { AdminNavLink, CatalogNavLink } from "@/components/site-header-nav";
import { ThemeMenu } from "@/components/theme-menu";

export function SiteHeader() {
  return (
    <header className="border-b border-edition-hairline bg-edition-canvas">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-6">
        <nav aria-label="Site" className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-medium tracking-tight text-edition-ink"
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
