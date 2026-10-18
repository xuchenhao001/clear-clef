/**
 * The screen name, set left over the work list. The index column starts on
 * the same line; there is no centered title above the page.
 */
export function CatalogHero() {
  return (
    <header className="mb-8">
      <p className="type-eyebrow">Public catalogue</p>
      <h1 className="type-masthead mt-3 text-balance">Score catalog</h1>
      <span aria-hidden className="rule-gilt mt-4 block h-0.5 w-16" />
      <p className="mt-4 max-w-[46ch] type-body-md text-edition-body text-pretty">
        Licensed piano scores. Choose a work from the index and open it on the
        folio.
      </p>
    </header>
  );
}
