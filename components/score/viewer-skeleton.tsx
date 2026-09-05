export function ViewerSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-edition-hairline bg-edition-canvas">
      <div className="border-b border-edition-hairline px-4 py-3">
        <div className="h-4 w-16 animate-pulse rounded bg-edition-hairline" />
      </div>
      <div className="bg-edition-surface-page p-4">
        <div className="mx-auto aspect-[4/3] max-w-3xl animate-pulse rounded bg-edition-hairline-soft" />
        <p className="mt-4 text-center text-sm text-edition-muted">
          Preparing the score.
        </p>
      </div>
    </div>
  );
}
