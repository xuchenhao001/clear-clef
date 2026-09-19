import Link from "next/link";
import { AdminVisibilityBadge } from "@/components/admin/admin-visibility-badge";
import { tagPillClassName } from "@/components/ui/tag-pill";
import { formatCatalogLine } from "@/lib/scores/catalog-line";
import type { AdminCatalogScore } from "@/lib/scores/admin";
import { cn } from "cn";

type AdminScoreListProps = {
  scores: AdminCatalogScore[];
  compact?: boolean;
};

function formatCreatedAt(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminScoreList({ scores, compact = false }: AdminScoreListProps) {
  return (
    <ul className="overflow-hidden rounded-xl border border-edition-hairline bg-edition-surface-card">
      {scores.map((score) => {
        const metadataLine = formatCatalogLine({
          catalogNumber: score.catalogNumber,
        });
        const editHref = `/admin/scores/${score.id}`;

        return (
          <li
            key={score.id}
            className="border-b border-edition-hairline last:border-b-0"
          >
            <div
              className={cn(
                "group flex items-center justify-between gap-4 px-4 py-4",
                compact ? "py-3" : "sm:py-5",
              )}
            >
              <Link
                href={editHref}
                className={cn(
                  "min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1 -mx-2",
                  "edition-interactive-transition",
                  "hover:border-edition-hairline hover:bg-edition-hover",
                  "focus-visible:border-edition-hairline focus-visible:bg-edition-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-hairline-strong/50",
                )}
              >
                <div className="flex items-center gap-4">
                  {score.previewR2Key && !compact ? (
                    <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-edition-hairline bg-white p-1 sm:block">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin preview API */}
                      <img
                        src={`/api/admin/scores/${score.id}/preview`}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate text-base font-medium text-edition-ink">
                      {score.title}
                    </p>
                    {score.composer ? (
                      <p className="type-body-sm text-edition-muted">{score.composer}</p>
                    ) : null}
                    {metadataLine ? (
                      <p className="type-caption-mono">{metadataLine}</p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminVisibilityBadge visibility={score.visibility} />
                      {!compact ? (
                        <span className="type-body-sm text-edition-muted">
                          {score.license}
                        </span>
                      ) : null}
                      {score.tags.slice(0, compact ? 2 : 4).map((tag) => (
                        <span key={tag.slug} className={tagPillClassName}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                {!compact ? (
                  <span className="hidden type-body-sm text-edition-muted lg:inline">
                    {formatCreatedAt(score.createdAt)}
                  </span>
                ) : null}
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {score.visibility === "public" ? (
                    <Link
                      href={`/scores/${score.slug}`}
                      className="type-nav-link hover:text-edition-ink"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </Link>
                  ) : null}
                  <a
                    href={`/api/admin/scores/${score.id}/file`}
                    className="type-nav-link hover:text-edition-ink"
                  >
                    Download
                  </a>
                  <Link
                    href={editHref}
                    className="type-nav-link font-medium hover:text-edition-ink"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
