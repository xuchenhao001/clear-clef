export function CatalogHero() {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      <h1 className="type-catalog-h1 text-balance">Score catalog</h1>
      <span aria-hidden className="rule-inked block h-[3px] w-20" />
      <p className="max-w-[46ch] type-body-md text-edition-body">
        Public catalog of licensed scores. Browse by credit, filter by metadata,
        open any work to read or practice.
      </p>
    </header>
  );
}
