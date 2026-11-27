import { Link } from "@tanstack/react-router";
import { formatCatalogLine } from "@/lib/scores/catalog-line";
import type { PublicCatalogScore } from "@/lib/scores/queries";
import type { CatalogSearch } from "@/lib/catalog/url-state";
import { isCjk } from "@/lib/catalog/normalize";
import { buildSearchTokens } from "@/lib/search/query";
import { cn } from "cn";

type ContentsRowProps = {
  score: PublicCatalogScore;
  search: CatalogSearch;
  showComposer?: boolean;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query?: string }) {
  const tokens = query ? buildSearchTokens(query).tokens : [];
  if (tokens.length === 0) {
    return <>{text}</>;
  }

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, index) =>
        tokens.some((token) => part.toLowerCase() === token.toLowerCase()) ? (
          <mark
            key={`${part}-${index}`}
            className="bg-transparent text-edition-gilt underline decoration-edition-gilt/50 underline-offset-4"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

export function ContentsRow({ score, search, showComposer = false }: ContentsRowProps) {
  const metadataLine = formatCatalogLine({
    catalogNumber: score.catalogNumber,
    key: score.keyLabel,
    timeSignature: score.timeSignature,
  });
  const aside = [metadataLine, score.difficultyLabel].filter(Boolean).join(" · ");
  const edition = [score.arranger ? `arr. ${score.arranger}` : null, score.editionLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="border-b border-edition-hairline-soft">
      <Link
        to="/scores/$slug"
        params={{ slug: score.slug }}
        state={{ fromCatalog: search } as never}
        className={cn(
          "group flex items-center gap-4 py-3.5",
          "edition-interactive-transition",
          "hover:text-edition-gilt focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring",
        )}
      >
        {score.previewUrl ? (
          <span className="relative hidden h-14 w-[4.5rem] shrink-0 overflow-hidden bg-edition-surface-page sm:block">
            <img
              src={score.previewUrl}
              alt=""
              width={72}
              height={56}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-3">
            <span
              className="type-row-title line-clamp-2"
              lang={isCjk(score.title) ? "zh-Hans" : undefined}
            >
              <Highlight text={score.title} query={search.q} />
            </span>
            <span
              aria-hidden
              className="mb-1 hidden min-w-6 flex-1 border-b border-dotted border-edition-hairline-strong sm:block"
            />
            <span className="type-shelf hidden shrink-0 sm:inline">
              {aside}
            </span>
          </span>
          {showComposer && score.composer ? (
            <span className="mt-1 block type-shelf">{score.composer}</span>
          ) : null}
          {edition ? <span className="mt-1 block type-shelf">{edition}</span> : null}
          <span className="mt-1 block type-shelf sm:hidden">{aside}</span>
        </span>
      </Link>
    </li>
  );
}
