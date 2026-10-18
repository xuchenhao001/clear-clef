import { AdminNavLink, CatalogNavLink } from "@/components/site-header-nav";
import { ThemeMenu } from "@/components/theme-menu";
import { Wordmark } from "@/components/wordmark";

/**
 * The header is a rail, not a board: a hairline's worth of ground above the
 * page, the logotype, the sections, and nothing else. The logotype is bone slab
 * with one vermilion mark — the game's logotype is white with a single red
 * numeral, and gilt belongs to metal and to the current tab, not to type.
 */
export function SiteHeader() {
  return (
    <header className="surface-rail sticky top-0 z-40 border-b border-edition-hairline">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-4 px-6">
        <nav aria-label="Site" className="flex items-center gap-6">
          <Wordmark />
          <span aria-hidden className="h-5 w-px bg-edition-hairline" />
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
