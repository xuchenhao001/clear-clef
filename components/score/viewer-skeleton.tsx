export function ViewerSkeleton() {
  return (
    <div>
      <div className="border-b border-edition-hairline pb-3">
        <div className="h-4 w-16 animate-pulse bg-edition-hairline" />
      </div>
      <div className="surface-folio on-folio mt-6 p-3 sm:p-6">
        <div className="surface-notation p-4">
          <div className="mx-auto aspect-[4/3] max-w-3xl animate-pulse bg-edition-hairline-soft" />
          <p className="mt-4 text-center type-shelf">Preparing the score.</p>
        </div>
      </div>
    </div>
  );
}
