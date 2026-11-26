import type { BatchFilter, BatchRow, BatchSettings } from "@/lib/batch/types";
import {
  displayStatus,
  effectiveComposer,
  effectiveTitle,
  isIncluded,
  needsAttention,
  rowMatchesFilter,
  variantNote,
} from "@/lib/batch/state";
import { cn } from "cn";

const toneClassName = {
  ok: "text-edition-semantic-success",
  warn: "text-edition-gilt",
  bad: "text-edition-semantic-error",
  muted: "text-edition-muted",
} as const;

type BatchQueueProps = {
  rows: BatchRow[];
  settings: BatchSettings;
  filter: BatchFilter;
  onFilter: (filter: BatchFilter) => void;
  onOpen: (rowKey: string) => void;
};

export function BatchQueue({
  rows,
  settings,
  filter,
  onFilter,
  onOpen,
}: BatchQueueProps) {
  const visibleRows = rows.filter((row) => rowMatchesFilter(row, filter));
  const counts = {
    all: rows.length,
    attention: rows.filter(needsAttention).length,
    ready: rows.filter(isIncluded).length,
    composer: rows.filter((row) => rowMatchesFilter(row, "composer")).length,
    skipped: rows.filter(
      (row) => row.status === "duplicate" || row.status === "excluded",
    ).length,
  };

  const filters: Array<{ value: BatchFilter; label: string; count: number }> = [
    { value: "all", label: "All", count: counts.all },
    { value: "attention", label: "Needs attention", count: counts.attention },
    { value: "ready", label: "Ready", count: counts.ready },
    { value: "composer", label: "No composer", count: counts.composer },
    { value: "skipped", label: "Skipped", count: counts.skipped },
  ];

  return (
    <section aria-labelledby="batch-files-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-edition-hairline pb-3">
        <h2 id="batch-files-heading" className="type-running-head">
          Files
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                "type-caption-mono edition-interactive-transition",
                filter === item.value
                  ? "text-edition-gilt"
                  : "text-edition-muted hover:text-edition-ink",
              )}
              aria-pressed={filter === item.value}
              onClick={() => onFilter(item.value)}
            >
              {item.label} {item.count}
            </button>
          ))}
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <p className="py-8 type-body-sm text-edition-muted">
          No files match this view.
        </p>
      ) : (
        <ul>
          {visibleRows.map((row) => {
            const title = effectiveTitle(row);
            const composer = effectiveComposer(row);
            const status = displayStatus(row, settings);
            const note = variantNote(row, rows);

            return (
              <li
                key={row.key}
                className="border-b border-edition-hairline-soft"
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-start justify-between gap-4 py-3.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
                  aria-haspopup="dialog"
                  onClick={() => onOpen(row.key)}
                >
                  <span className="block min-w-0 flex-1">
                    <span className="block type-row-title break-words">
                      {title.trim() || "Untitled file"}
                    </span>
                    {row.status !== "invalid" ? (
                      <span className="mt-1 block type-shelf">
                        {composer.trim() || "No composer in file (optional)"}
                      </span>
                    ) : null}
                    <span className="mt-1 block type-caption-mono text-edition-muted break-all">
                      {row.path}
                    </span>

                    {row.titleCheck ? (
                      <span className="mt-1.5 block type-body-sm text-edition-gilt">
                        Check the credits against this title.
                      </span>
                    ) : null}

                    {row.status === "duplicate" ? (
                      <span className="mt-1.5 block type-body-sm text-edition-muted">
                        {row.exactMatch?.kind === "batch"
                          ? `Identical to ${row.exactMatch.title}.`
                          : row.exactMatch?.kind === "catalog"
                            ? `Already in the catalog: ${row.exactMatch.title}.`
                            : "Already in the catalog."}
                      </span>
                    ) : null}

                    {row.status === "invalid" || row.status === "failed" ? (
                      <span className="mt-1.5 block type-body-sm text-edition-semantic-error">
                        {row.error ?? "This file could not be read."}
                      </span>
                    ) : null}

                    {row.status === "preview-failed" ? (
                      <span className="mt-1.5 block type-body-sm text-edition-semantic-error">
                        Uploaded, but the page-1 preview could not be drawn.
                      </span>
                    ) : null}

                    {note ? (
                      <span className="mt-1.5 block type-body-sm text-edition-muted">
                        {note}.
                      </span>
                    ) : null}
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                    <span
                      className={cn(
                        "type-running-head whitespace-nowrap",
                        toneClassName[status.tone],
                      )}
                    >
                      {status.label}
                    </span>
                    <span className="type-hint text-edition-gilt">Review</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
