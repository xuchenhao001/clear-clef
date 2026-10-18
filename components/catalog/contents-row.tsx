import Image from "next/image";
import Link from "next/link";
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
        href={`/scores/${score.slug}`}
        className={cn(
          "group flex items-center gap-4 py-3.5",
          "edition-interactive-transition",
          "hover:text-edition-gilt focus-visible:text-edition-gilt focus-visible:outline-none",
        )}
      >
        {score.previewR2Key ? (
          <span className="relative hidden h-12 w-16 shrink-0 overflow-hidden bg-edition-surface-page sm:block">
            <Image
              src={`/api/scores/${score.id}/preview`}
              alt=""
              fill
              unoptimized
              className="object-contain"
            />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-3">
            <span className="type-row-title shrink-0 group-hover:text-edition-gilt">
              {score.title}
            </span>
            <span
              aria-hidden
              className="mb-1 hidden min-w-6 flex-1 border-b border-dotted border-edition-hairline-strong sm:block"
            />
            {aside ? (
              <span className="type-shelf hidden shrink-0 text-right sm:inline">
                {aside}
              </span>
            ) : null}
          </span>
          {score.tags.length > 0 ? (
            <span className="mt-1 block type-shelf">
              {score.tags.map((tag) => tag.label).join(" · ")}
            </span>
          ) : null}
          {aside ? (
            <span className="mt-1 block type-shelf sm:hidden">{aside}</span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}
