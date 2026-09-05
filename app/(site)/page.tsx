import Link from "next/link";
import { listPublicScores } from "@/lib/scores/queries";
import { CatalogFilters } from "@/components/catalog/catalog-filters";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const filters = {
    key: readParam(params, "key"),
    difficulty: readParam(params, "difficulty"),
    license: readParam(params, "license"),
    tag: readParam(params, "tag"),
  };

  const catalog = await listPublicScores(filters);

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Score catalog</h1>
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Browse public-domain and openly licensed piano scores. Engraving runs
            in your browser with Verovio.
          </p>
        </div>

        <CatalogFilters current={filters} />

        {catalog.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-lg font-medium">No public scores yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Upload a score from the admin area to seed the catalog.
            </p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((score) => (
              <li key={score.id}>
                <Link
                  href={`/scores/${score.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition hover:border-zinc-400"
                >
                  <div className="aspect-[4/3] bg-zinc-50 dark:bg-zinc-900">
                    {score.previewR2Key ? (
                      <img
                        src={`/api/scores/${score.id}/preview`}
                        alt={`Preview of ${score.title}`}
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                        Preview pending
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="text-lg font-medium group-hover:underline">
                      {score.title}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {score.composer ?? "Unknown composer"}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2 text-xs text-zinc-500">
                      <span>{score.license}</span>
                      {score.key ? <span>{score.key}</span> : null}
                      {score.difficulty ? <span>{score.difficulty}</span> : null}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
