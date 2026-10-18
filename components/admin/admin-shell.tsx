import { AdminNavLinks } from "@/components/admin/admin-nav-links";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { SiteFooter } from "@/components/site-footer";
import { SkipToContent } from "@/components/skip-to-content";
import { ThemeMenu } from "@/components/theme-menu";
import { Wordmark } from "@/components/wordmark";
import { Link } from "@tanstack/react-router";

type AdminShellProps = {
  email: string;
  children: React.ReactNode;
};

/**
 * The same ground and rail as the public catalog. Register sections live in
 * the left index; the header only carries the wordmark and the account.
 */
export function AdminShell({ email, children }: AdminShellProps) {
  return (
    <div className="surface-ground flex min-h-dvh flex-col text-edition-ink">
      <SkipToContent />
      <header className="surface-rail sticky top-0 z-40 border-b border-edition-hairline">
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-4 px-6">
          <Wordmark href="/admin" />
          <div className="flex items-center gap-4">
            <Link to="/" className="type-nav-link hidden hover:text-edition-ink sm:inline">
              Catalogue
            </Link>
            <ThemeMenu />
            <p className="hidden max-w-[12rem] truncate type-shelf lg:block">{email}</p>
            <AdminSignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1200px] flex-1 items-start gap-10 px-6 py-10 md:py-14 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <AdminNavLinks />
        <main
          id="content"
          tabIndex={-1}
          className="min-w-0 outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
        >
          {children}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
