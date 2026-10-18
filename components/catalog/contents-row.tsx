import { Link } from "@tanstack/react-router";
import { formatCatalogLine } from "@/lib/scores/catalog-line";
import type { PublicCatalogScore } from "@/lib/scores/queries";
import { cn } from "cn";

type ContentsRowProps = {
  score: PublicCatalogScore;
};

export function ContentsRow({ score }: ContentsRowProps) {
  const metadataLine = formatCatalogLine({
    catalogNumber: score.catalogNumber,
    key: score.key,
    timeSignature: score.timeSignature,
  });
  const aside = [metadataLine, score.difficulty].filter(Boolean).join(" · ");

  return (
    <li className="border-b border-edition-hairline-soft">
      <Link
        to="/scores/$slug"
        params={{ slug: score.slug }}
        className={cn(
          "group flex items-center gap-4 py-3.5",
          "edition-interactive-transition",
          "hover:text-edition-gilt focus-visible:text-edition-gilt focus-visible:outline-none",
        )}
      >
        {score.previewR2Key ? (
          <span className="relative hidden h-12 w-16 shrink-0 overflow-hidden bg-edition-surface-page sm:block">
            <img
              src={`/api/scores/${score.id}/preview`}
              alt=""
              className="h-full w-full object-contain"
            />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-3">
            <span className="type-row-title truncate">{score.title}</span>
            <span
              aria-hidden
              className="mb-1 hidden min-w-6 flex-1 border-b border-dotted border-edition-hairline-strong sm:block"
            />
            <span className="type-shelf hidden shrink-0 sm:inline">{aside}</span>
          </span>
          {score.composer ? (
            <span className="mt-1 block type-shelf">{score.composer}</span>
          ) : null}
          <span className="mt-1 block type-shelf sm:hidden">{aside}</span>
        </span>
      </Link>
    </li>
  );
}
