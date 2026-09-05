import Link from "next/link";
import { ThemeMenu } from "@/components/theme-menu";

export function SiteHeader() {
  return (
    <header className="border-b border-edition-hairline bg-edition-canvas">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-medium tracking-tight text-edition-ink"
          >
            ClearClef
          </Link>
          <p className="hidden type-nav-link sm:block">Catalog</p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeMenu />
          <Link href="/admin" className="type-nav-link hover:text-edition-ink">
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
