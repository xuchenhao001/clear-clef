import { Link } from "@tanstack/react-router";
import { formatCatalogLine } from "@/lib/scores/catalog-line";
import type { AdminCatalogScore } from "@/lib/scores/admin";

type AdminScoreListProps = {
  scores: AdminCatalogScore[];
  compact?: boolean;
  heading?: string;
  headAction?: React.ReactNode;
};

function formatCreatedAt(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const visibilityLabel: Record<string, string> = {
  public: "Public",
  unlisted: "Unlisted",
  private: "Private",
};

export function AdminScoreList({
  scores,
  compact = false,
  heading = "Scores",
  headAction,
}: AdminScoreListProps) {
  const count = scores.length;

  return (
    <section aria-labelledby="admin-score-list">
      <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
        <h2 id="admin-score-list" className="type-running-head">
          {heading}
        </h2>
        <span className="flex items-center gap-4">
          <p className="type-extent">
            {count} {count === 1 ? "work" : "works"}
          </p>
          {headAction}
        </span>
      </div>
      <ul>
        {scores.map((score) => {
          const metadataLine = formatCatalogLine({
            catalogNumber: score.catalogNumber,
          });
          const aside = [
            visibilityLabel[score.visibility] ?? score.visibility,
            compact ? null : score.license,
            metadataLine,
            compact ? null : formatCreatedAt(score.createdAt),
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <li key={score.id} className="border-b border-edition-hairline-soft">
              <div className="flex items-baseline justify-between gap-4 py-3.5">
                <Link
                  to="/admin/scores/$id"
                  params={{ id: score.id }}
                  className="min-w-0 flex-1 outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
                >
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
                </Link>
                <span className="flex shrink-0 items-center gap-4">
                  {score.visibility === "public" ? (
                    <Link
                      to="/scores/$slug"
                      params={{ slug: score.slug }}
                      className="type-hint hover:text-edition-gilt"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </Link>
                  ) : null}
                  <a
                    href={`/api/admin/scores/${score.id}/file`}
                    className="type-hint hover:text-edition-gilt"
                  >
                    File
                  </a>
                  <Link
                    to="/admin/scores/$id"
                    params={{ id: score.id }}
                    className="type-hint text-edition-gilt hover:text-edition-ink"
                  >
                    Edit
                  </Link>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
