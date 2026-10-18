import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="surface-rail mt-16 border-t border-edition-hairline">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-5">
        <p className="type-imprint">ClearClef · MMXXVI</p>
        <Link to="/" className="type-hint hover:text-edition-ink">
          Catalogue
        </Link>
      </div>
    </footer>
  );
}
