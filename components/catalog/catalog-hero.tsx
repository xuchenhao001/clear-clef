import { CatalogSearchForm } from "@/components/catalog/catalog-search";
import type { CatalogSearch } from "@/lib/catalog/url-state";

type CatalogHeroProps = {
  search: CatalogSearch;
  totalPublic: number;
};

export function CatalogHero({ search, totalPublic }: CatalogHeroProps) {
  return (
    <header className="mb-8">
      <p className="type-eyebrow">Public catalogue</p>
      <h1 className="type-masthead mt-3 text-balance">Score catalogue</h1>
      <span aria-hidden className="rule-gilt mt-4 block h-0.5 w-16" />
      <p className="mt-4 max-w-[54ch] type-body-md text-edition-body text-pretty">
        {totalPublic} licensed piano {totalPublic === 1 ? "work" : "works"},
        engraved from MusicXML. Search by title, composer, catalogue number or
        key, then open the score on the folio.
      </p>
      <div className="mt-7">
        <CatalogSearchForm search={search} compact />
      </div>
    </header>
  );
}
