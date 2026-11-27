import { Link, createFileRoute, useLocation } from "@tanstack/react-router";
import { BackToCatalog } from "@/components/catalog/back-to-catalog";
import { ScoreRights } from "@/components/score/ScoreRights";
import { ScoreViewerLoader } from "@/components/score/ScoreViewerLoader";
import { publicPageCacheControl } from "@/lib/cache/public-pages";
import type { CatalogSearch } from "@/lib/catalog/url-state";
import { isCjk } from "@/lib/catalog/normalize";
import { difficultySlug, keySlug } from "@/lib/catalog/vocab";
import { scoreHead } from "@/lib/seo/site";
import { loadPublicScore } from "@/src/server/public";

export const Route = createFileRoute("/_site/scores/$slug")({
  loader: ({ params }) => loadPublicScore({ data: params.slug }),
  headers: () => ({
    "Cache-Control": publicPageCacheControl,
  }),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Score not found · ClearClef" },
          { name: "robots", content: "noindex, follow" },
        ],
      };
    }
    return scoreHead(loaderData);
  },
  component: ScoreDetailPage,
});

function ScoreDetailPage() {
  const score = Route.useLoaderData();
  const location = useLocation();
  const fromCatalog = (
    location.state as { fromCatalog?: CatalogSearch } | undefined
  )?.fromCatalog;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col px-6 py-10 md:py-16">
      <div className="space-y-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-baseline gap-2">
          <BackToCatalog search={fromCatalog} />
          <span aria-hidden className="type-hint text-edition-muted-soft">
            /
          </span>
          <Link
            to="/"
            className="type-hint hover:text-edition-gilt"
          >
            Catalogue
          </Link>
          {score.composer ? (
            <>
              <span aria-hidden className="type-hint text-edition-muted-soft">
                /
              </span>
              <Link
                to="/"
                search={{ composer: score.composerSlug ? [score.composerSlug] : undefined }}
                className="type-hint hover:text-edition-gilt"
              >
                {score.composer}
              </Link>
            </>
          ) : null}
        </nav>

        <header className="space-y-3">
          {score.composer ? (
            <p className="type-eyebrow">
              {score.composer}
              {score.composerDates ? ` · ${score.composerDates}` : ""}
            </p>
          ) : null}
          <h1
            className="type-masthead-sm"
            lang={isCjk(score.title) ? "zh-Hans" : undefined}
          >
            {score.title}
          </h1>
          <span aria-hidden className="rule-gilt block h-0.5 w-16" />
          {score.lyricist ? (
            <p className="type-shelf">Lyrics by {score.lyricist}</p>
          ) : null}
          {score.arranger || score.editionLabel ? (
            <p className="type-shelf">
              {[score.arranger ? `arr. ${score.arranger}` : null, score.editionLabel]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </header>

        <dl className="max-w-xl pt-2">
          {score.keyLabel ? (
            <div className="stat-row">
              <dt className="type-label">Key</dt>
              <dd className="type-value">
                <Link
                  to="/"
                  search={{ key: score.key ? [keySlug(score.key)] : undefined }}
                  className="hover:text-edition-gilt"
                >
                  {score.keyLabel}
                </Link>
              </dd>
            </div>
          ) : null}
          {score.timeSignature ? (
            <div className="stat-row">
              <dt className="type-label">Time</dt>
              <dd className="type-value">{score.timeSignature}</dd>
            </div>
          ) : null}
          {score.catalogNumber ? (
            <div className="stat-row">
              <dt className="type-label">Catalogue</dt>
              <dd className="type-value">{score.catalogNumber}</dd>
            </div>
          ) : null}
          {score.difficultyLabel ? (
            <div className="stat-row">
              <dt className="type-label">Difficulty</dt>
              <dd className="type-value">
                <Link
                  to="/"
                  search={{
                    difficulty: score.difficulty
                      ? [difficultySlug(score.difficulty)]
                      : undefined,
                  }}
                  className="hover:text-edition-gilt"
                >
                  {score.difficultyLabel}
                </Link>
              </dd>
            </div>
          ) : null}
          {score.tags.length > 0 ? (
            <div className="stat-row">
              <dt className="type-label">Tags</dt>
              <dd className="type-value">
                <span className="flex flex-wrap justify-end gap-x-3 gap-y-1">
                  {score.tags.map((tag) => (
                    <Link
                      key={tag.slug}
                      to="/"
                      search={{ tag: [tag.slug] }}
                      className="hover:text-edition-gilt"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </span>
              </dd>
            </div>
          ) : null}
          <ScoreRights license={score.license} sourceUrl={score.sourceUrl} />
        </dl>
      </div>

      <div className="pt-8 md:pt-10">
        <ScoreViewerLoader
          fileUrl={score.fileUrl}
          compressed={score.compressed}
          title={score.title}
        />
      </div>

      {score.related.length > 0 ? (
        <section className="mt-14 border-t border-edition-hairline pt-8" aria-labelledby="related-works">
          <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
            <h2 id="related-works" className="type-running-head">
              More by {score.composer ?? "this credit"}
            </h2>
            {score.composerSlug ? (
              <Link
                to="/"
                search={{ composer: [score.composerSlug] }}
                className="type-hint text-edition-gilt hover:text-edition-ink"
              >
                All works
              </Link>
            ) : null}
          </div>
          <ul>
            {score.related.map((related) => (
              <li key={related.id} className="border-b border-edition-hairline-soft">
                <Link
                  to="/scores/$slug"
                  params={{ slug: related.slug }}
                  className="flex items-baseline justify-between gap-4 py-3 hover:text-edition-gilt focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
                >
                  <span className="type-row-title">{related.title}</span>
                  <span className="type-shelf shrink-0">
                    {[related.keyLabel, related.difficultyLabel]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
