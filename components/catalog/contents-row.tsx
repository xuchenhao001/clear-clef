import Image from "next/image";
import Link from "next/link";
import { formatCatalogLine } from "@/lib/scores/catalog-line";
import type { PublicCatalogScore } from "@/lib/scores/queries";

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
    <li>
      <Link
        href={`/scores/${score.slug}`}
        className="group flex items-start justify-between gap-6 py-5 transition-colors hover:bg-edition-canvas-soft"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="type-work-title group-hover:text-edition-ink">
            {score.title}
          </h3>
          {metadataLine ? (
            <p className="type-caption-mono">{metadataLine}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {score.difficulty ? (
              <span className="type-body-sm text-edition-muted">
                {score.difficulty}
              </span>
            ) : null}
            {score.tags.map((tag) => (
              <span
                key={tag.slug}
                className="rounded-full bg-edition-surface-strong px-3 py-1 text-xs font-medium text-edition-body"
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
        {score.previewR2Key ? (
          <div className="hidden shrink-0 rounded-xl border border-edition-hairline bg-edition-canvas-soft p-1 sm:block">
            <div className="relative h-20 w-28 overflow-hidden rounded-lg bg-edition-surface-page">
              <Image
                src={`/api/scores/${score.id}/preview`}
                alt={`First page of ${score.title}`}
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
