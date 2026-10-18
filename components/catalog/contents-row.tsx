import Image from "next/image";
import Link from "next/link";
import { tagPillClassName } from "@/components/ui/tag-pill";
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

  return (
    <li
      className="border-b border-edition-hairline last:border-b-0 hover:border-b-transparent focus-within:border-b-transparent"
    >
      <Link
        href={`/scores/${score.slug}`}
        className={cn(
          "group relative flex items-center justify-between gap-6 rounded-md border border-transparent px-4 py-4",
          "edition-interactive-transition",
          "hover:border-edition-hairline hover:bg-edition-hover",
          "focus-visible:border-edition-hairline focus-visible:bg-edition-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring",
        )}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="type-work-title">{score.title}</h3>
          {metadataLine ? (
            <p className="type-shelf">{metadataLine}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {score.difficulty ? (
              <span className="type-body-sm text-edition-muted">
                {score.difficulty}
              </span>
            ) : null}
            {score.tags.map((tag) => (
              <span key={tag.slug} className={tagPillClassName}>
                {tag.label}
              </span>
            ))}
          </div>
        </div>
        {score.previewR2Key ? (
          <div
            className={cn(
              "hidden shrink-0 rounded-md border border-edition-hairline-strong bg-edition-surface-strong p-1 sm:block",
              "edition-interactive-transition group-hover:border-edition-field-border",
            )}
          >
            <div className="relative h-20 w-28 overflow-hidden rounded-sm bg-edition-surface-page">
              <Image
                src={`/api/scores/${score.id}/preview`}
                alt=""
                fill
                unoptimized
                className="object-contain p-0.5"
              />
            </div>
          </div>
        ) : null}
      </Link>
    </li>
  );
}
