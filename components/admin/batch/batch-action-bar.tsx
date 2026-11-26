import { Button } from "@/components/ui/button";
import type { BatchCounts, BatchPhase } from "@/lib/batch/types";

type BatchActionBarProps = {
  phase: BatchPhase;
  counts: BatchCounts;
  includedCount: number;
  canStart: boolean;
  disabledReason: string | null;
  running: boolean;
  cancelRequested: boolean;
  privateCount: number;
  publishConfirm: boolean;
  publishing: boolean;
  published: boolean;
  hasFailures: boolean;
  invalidCount: number;
  onStart: () => void;
  onCancel: () => void;
  onReview: () => void;
  onRetryFailed: () => void;
  onRetryUnread: () => void;
  onPublish: () => void;
  onPublishConfirm: () => void;
  onPublishCancel: () => void;
  onNewBatch: () => void;
};

function Counts({ counts, running }: { counts: BatchCounts; running: boolean }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1 type-shelf"
      role={running ? "status" : undefined}
      aria-live={running ? "polite" : undefined}
    >
      <span>{counts.total} files</span>
      <span aria-hidden className="text-edition-muted-soft">·</span>
      <span className="text-edition-ink">{counts.ready} ready</span>
      {counts.uploaded > 0 ? (
        <>
          <span aria-hidden className="text-edition-muted-soft">·</span>
          <span className="text-edition-semantic-success">
            {counts.uploaded} uploaded
          </span>
        </>
      ) : null}
      {counts.active > 0 ? (
        <>
          <span aria-hidden className="text-edition-muted-soft">·</span>
          <span className="text-edition-gilt">{counts.active} in progress</span>
        </>
      ) : null}
      {counts.attention > 0 ? (
        <>
          <span aria-hidden className="text-edition-muted-soft">·</span>
          <span className="text-edition-gilt">{counts.attention} need attention</span>
        </>
      ) : null}
      {counts.skipped > 0 ? (
        <>
          <span aria-hidden className="text-edition-muted-soft">·</span>
          <span>{counts.skipped} skipped</span>
        </>
      ) : null}
      {counts.failed > 0 ? (
        <>
          <span aria-hidden className="text-edition-muted-soft">·</span>
          <span className="text-edition-semantic-error">{counts.failed} failed</span>
        </>
      ) : null}
    </div>
  );
}

export function BatchActionBar({
  phase,
  counts,
  includedCount,
  canStart,
  disabledReason,
  running,
  cancelRequested,
  privateCount,
  publishConfirm,
  publishing,
  published,
  hasFailures,
  invalidCount,
  onStart,
  onCancel,
  onReview,
  onRetryFailed,
  onRetryUnread,
  onPublish,
  onPublishConfirm,
  onPublishCancel,
  onNewBatch,
}: BatchActionBarProps) {
  return (
    <div className="sticky bottom-0 z-20 -mx-6 border-t border-edition-hairline-strong bg-edition-canvas/95 px-6 py-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Counts counts={counts} running={running} />
          {phase === "review" && disabledReason ? (
            <p className="mt-1 type-body-sm text-edition-gilt">{disabledReason}</p>
          ) : null}
          {phase === "review" && !disabledReason ? (
            <p className="mt-1 type-body-sm text-edition-muted">
              {includedCount} {includedCount === 1 ? "score" : "scores"} will be
              uploaded with the settings shown.
            </p>
          ) : null}
          {phase === "done" ? (
            <button
              type="button"
              className="mt-1 type-hint text-edition-muted hover:text-edition-gilt"
              onClick={onNewBatch}
            >
              Start a new batch
            </button>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {running ? (
            <>
              <Button type="button" disabled className="w-full sm:w-auto">
                Uploading…
              </Button>
              <button
                type="button"
                className="type-hint text-edition-muted hover:text-edition-gilt"
                onClick={onCancel}
                disabled={cancelRequested}
              >
                {cancelRequested ? "Stopping after current files…" : "Stop remaining"}
              </button>
            </>
          ) : null}

          {phase === "review" && invalidCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={onRetryUnread}
              className="w-full sm:w-auto"
            >
              Retry reading {invalidCount}
            </Button>
          ) : null}

          {phase === "review" ? (
            <Button
              type="button"
              disabled={!canStart}
              onClick={onStart}
              className="w-full sm:w-auto"
            >
              Upload {includedCount} {includedCount === 1 ? "score" : "scores"}
            </Button>
          ) : null}

          {phase === "done" ? (
            <>
              {publishConfirm ? (
                <>
                  <Button
                    type="button"
                    onClick={onPublishConfirm}
                    disabled={publishing}
                    className="w-full sm:w-auto"
                  >
                    {publishing ? "Publishing…" : `Confirm publish ${privateCount}`}
                  </Button>
                  <button
                    type="button"
                    className="type-hint text-edition-muted hover:text-edition-ink"
                    onClick={onPublishCancel}
                    disabled={publishing}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {invalidCount > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onRetryUnread}
                      className="w-full sm:w-auto"
                    >
                      Retry reading {invalidCount}
                    </Button>
                  ) : null}
                  {hasFailures ? (
                    <Button
                      type="button"
                      onClick={onRetryFailed}
                      className="w-full sm:w-auto"
                    >
                      Retry failed
                    </Button>
                  ) : null}
                  {privateCount > 0 && !published ? (
                    <Button
                      type="button"
                      variant={hasFailures ? "outline" : "default"}
                      onClick={onPublish}
                      className="w-full sm:w-auto"
                    >
                      Publish {privateCount}{" "}
                      {privateCount === 1 ? "score" : "scores"}
                    </Button>
                  ) : null}
                </>
              )}

              {published ? (
                <p className="type-label text-edition-semantic-success">Published</p>
              ) : null}

              {counts.uploaded > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onReview}
                  className="w-full sm:w-auto"
                >
                  Review imported scores
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
