import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AdminField, AdminInput } from "@/components/admin/admin-field";
import { adminFormInputClassName } from "@/components/admin/admin-form-styles";
import { Button } from "@/components/ui/button";
import type {
  BatchRow,
  BatchSettings,
  ScoreVisibility,
} from "@/lib/batch/types";
import {
  effectiveCatalogNumber,
  effectiveComposer,
  effectiveSourceUrl,
  effectiveTags,
  effectiveTitle,
  effectiveVisibility,
} from "@/lib/batch/state";
import { LICENSE_OPTIONS } from "@/lib/ingest/constants";
import { cn } from "cn";

type OverrideField =
  | "title"
  | "composer"
  | "catalogNumber"
  | "license"
  | "visibility"
  | "tags"
  | "sourceUrl";

type BatchDrawerProps = {
  row: BatchRow | null;
  settings: BatchSettings;
  open: boolean;
  editable: boolean;
  previewSvg: string | null;
  previewStatus: "idle" | "rendering" | "ready" | "failed";
  previewError: string | null;
  onClose: () => void;
  onOverride: (rowKey: string, field: OverrideField, value: string | undefined) => void;
  onInclude: (rowKey: string) => void;
  onExclude: (rowKey: string) => void;
  onRemove: (rowKey: string) => void;
  onRetry: (rowKey: string) => void;
  onDrawPreview: (rowKey: string) => void;
};

const FACT_LABEL = "type-label";
const FACT_VALUE = "type-value";

type DrawerSelectItem = { label: string; value: string };

function DrawerSelect({
  id,
  label,
  value,
  items,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  items: DrawerSelectItem[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <AdminField label={label} htmlFor={id}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        className={adminFormInputClassName}
        onChange={(event) => onChange(event.target.value)}
      >
        {items.map((item) => (
          <option key={item.value || "__batch__"} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </AdminField>
  );
}

function PreviewImage({ svg, alt }: { svg: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [svg]);

  if (!url) return null;

  return (
    <img
      src={url}
      alt={alt}
      className="mx-auto max-h-[26rem] w-full object-contain"
    />
  );
}

function CreditList({
  row,
  disabled,
  onOverride,
}: {
  row: BatchRow;
  disabled: boolean;
  onOverride: BatchDrawerProps["onOverride"];
}) {
  const credits = row.metadata?.credits ?? [];
  if (credits.length === 0) {
    return (
      <p className="type-body-sm text-edition-muted">
        No credit lines were found in the file.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {credits.map((credit, index) => {
        const text = credit.words.join(" ").trim();
        if (!text) return null;
        return (
          <li
            key={`${text}-${index}`}
            className="flex flex-wrap items-baseline justify-between gap-2 border-b border-edition-hairline-soft pb-2"
          >
            <span className="min-w-0 type-body-sm text-edition-body">
              {text}
              {credit.type ? (
                <span className="ml-2 type-caption-mono text-edition-muted">
                  {credit.type}
                </span>
              ) : null}
            </span>
            {!disabled ? (
              <span className="flex shrink-0 gap-3">
                <button
                  type="button"
                  className="type-hint hover:text-edition-gilt"
                  onClick={() => onOverride(row.key, "title", text)}
                >
                  Use as title
                </button>
                <button
                  type="button"
                  className="type-hint hover:text-edition-gilt"
                  onClick={() => onOverride(row.key, "composer", text)}
                >
                  Use as composer
                </button>
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function BatchFileDrawer({
  row,
  settings,
  open,
  editable,
  previewSvg,
  previewStatus,
  previewError,
  onClose,
  onOverride,
  onInclude,
  onExclude,
  onRemove,
  onRetry,
  onDrawPreview,
}: BatchDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!row) {
    return null;
  }

  const title = effectiveTitle(row);
  const composer = effectiveComposer(row);
  const sourceUrl = effectiveSourceUrl(row, settings);
  const tags = effectiveTags(row, settings);
  const visibility = effectiveVisibility(row, settings);
  const isDuplicate = row.status === "duplicate";
  const isExcluded = row.status === "excluded";
  const isInvalid = row.status === "invalid";
  const canEdit = editable && !isInvalid && row.status !== "reading" && row.status !== "done" && row.status !== "uploaded" && row.status !== "previewing" && row.status !== "preview-failed";
  const canDrawPreview =
    canEdit ||
    row.status === "preview-failed" ||
    (row.status === "uploaded" && editable);
  const previewLabel = `Page 1 of ${title.trim() || row.name}`;
  const committed = row.score !== null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="fixed inset-y-0 right-0 m-0 ml-auto h-dvh max-h-none w-full max-w-md border-0 bg-transparent p-0 text-edition-ink backdrop:bg-black/60 sm:max-w-lg"
      aria-labelledby="batch-drawer-title"
    >
      <div className="surface-board on-board flex h-full flex-col border-l border-edition-hairline shadow-plate">
        <div aria-hidden className="rule-gilt h-[3px]" />
        <div className="flex items-start justify-between gap-4 border-b border-edition-hairline px-5 py-4">
          <div className="min-w-0">
            <h2 id="batch-drawer-title" className="type-masthead-sm text-[1.375rem]">
              Review file
            </h2>
            <p className="mt-1 break-all type-caption-mono text-edition-muted">
              {row.path}
            </p>
          </div>
          <button
            type="button"
            className="type-hint text-edition-gilt hover:text-edition-ink"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
          {isInvalid ? (
            <div className="border-l-2 border-edition-semantic-error pl-3">
              <p className="type-body-sm text-edition-semantic-error">
                {row.error ?? "This file could not be read."}
              </p>
              {editable ? (
                <div className="mt-3 flex flex-wrap gap-4">
                  <button
                    type="button"
                    className="type-hint text-edition-gilt hover:text-edition-ink"
                    onClick={() => onRetry(row.key)}
                  >
                    Try reading again
                  </button>
                  <button
                    type="button"
                    className="type-hint text-edition-muted hover:text-edition-semantic-error"
                    onClick={() => onRemove(row.key)}
                  >
                    Remove file
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {isDuplicate ? (
            <div className="border-l-2 border-edition-gilt pl-3">
              <p className="type-body-sm text-edition-body">
                {row.exactMatch?.kind === "batch"
                  ? `Another file in this batch is identical: ${row.exactMatch.title}.`
                  : row.exactMatch?.kind === "catalog"
                    ? `This file is already in the catalog: ${row.exactMatch.title}.`
                    : "This file matches another score."}
              </p>
              {editable ? (
                <button
                  type="button"
                  className="mt-3 type-hint text-edition-gilt hover:text-edition-ink"
                  onClick={() => onInclude(row.key)}
                >
                  Include anyway
                </button>
              ) : null}
            </div>
          ) : null}

          {isExcluded ? (
            <div className="flex flex-wrap items-center gap-4">
              <p className="type-body-sm text-edition-muted">
                This file is skipped and will not be uploaded.
              </p>
              {editable ? (
                <button
                  type="button"
                  className="type-hint text-edition-gilt hover:text-edition-ink"
                  onClick={() => onInclude(row.key)}
                >
                  Include file
                </button>
              ) : null}
            </div>
          ) : null}

          <section aria-labelledby="batch-file-fields">
            <h3 id="batch-file-fields" className="type-running-head">
              Catalog fields
            </h3>
            <div className="mt-4 flex flex-col gap-5">
              <AdminField
                label="Title"
                htmlFor="batch-file-title"
                hint={
                  row.overrides.title !== undefined
                    ? "Custom title. Use the file title below to reset."
                    : row.titleSource === "filename"
                      ? "Suggested from the filename. Edit if the file has a title."
                      : "Read from the file."
                }
              >
                <AdminInput
                  id="batch-file-title"
                  value={title}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onOverride(row.key, "title", event.target.value)
                  }
                />
              </AdminField>

              <AdminField
                label="Composer"
                htmlFor="batch-file-composer"
                hint={
                  row.suggestedComposer
                    ? "Read from the file."
                    : "Not present in the file. Add it if known; composer is optional."
                }
              >
                <AdminInput
                  id="batch-file-composer"
                  value={composer}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onOverride(row.key, "composer", event.target.value)
                  }
                />
              </AdminField>

              <AdminField label="Catalogue number" htmlFor="batch-file-catalog">
                <AdminInput
                  id="batch-file-catalog"
                  value={effectiveCatalogNumber(row)}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onOverride(row.key, "catalogNumber", event.target.value)
                  }
                  placeholder="BWV 846, Op. 27 No. 2"
                />
              </AdminField>

              <DrawerSelect
                id="batch-file-license"
                label="License"
                value={row.overrides.license ?? ""}
                disabled={!canEdit}
                items={[
                  {
                    label: `Batch: ${settings.license || "not set"}`,
                    value: "",
                  },
                  ...LICENSE_OPTIONS.map((value) => ({ label: value, value })),
                ]}
                onChange={(value) =>
                  onOverride(
                    row.key,
                    "license",
                    value === "" ? undefined : value,
                  )
                }
              />

              <DrawerSelect
                id="batch-file-visibility"
                label="Visibility"
                value={row.overrides.visibility ?? ""}
                disabled={!canEdit}
                items={[
                  {
                    label: `Batch: ${settings.visibility}`,
                    value: "",
                  },
                  { label: "Private", value: "private" },
                  { label: "Unlisted", value: "unlisted" },
                  { label: "Public", value: "public" },
                ]}
                onChange={(value) =>
                  onOverride(
                    row.key,
                    "visibility",
                    value === "" ? undefined : (value as ScoreVisibility),
                  )
                }
              />

              <AdminField
                label="Tags"
                htmlFor="batch-file-tags"
                hint="Override the batch tags for this score."
              >
                <AdminInput
                  id="batch-file-tags"
                  value={tags}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onOverride(row.key, "tags", event.target.value)
                  }
                />
              </AdminField>

              <AdminField
                label="Source URL"
                htmlFor="batch-file-source"
                hint={
                  row.metadata?.sourceUrl
                    ? "Suggested by the file. Edit to override."
                    : "Optional provenance link for this score."
                }
              >
                <AdminInput
                  id="batch-file-source"
                  type="url"
                  value={sourceUrl}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onOverride(row.key, "sourceUrl", event.target.value)
                  }
                  placeholder={settings.sourceUrl || "https://imslp.org/…"}
                />
              </AdminField>
            </div>
          </section>

          <section aria-labelledby="batch-file-facts">
            <h3 id="batch-file-facts" className="type-running-head">
              From the file
            </h3>
            <dl className="mt-3">
              {row.metadata?.key ? (
                <div className="stat-row">
                  <dt className={FACT_LABEL}>Key</dt>
                  <dd className={FACT_VALUE}>{row.metadata.key}</dd>
                </div>
              ) : null}
              {row.metadata?.timeSignature ? (
                <div className="stat-row">
                  <dt className={FACT_LABEL}>Time</dt>
                  <dd className={FACT_VALUE}>{row.metadata.timeSignature}</dd>
                </div>
              ) : null}
              <div className="stat-row">
                <dt className={FACT_LABEL}>Parts</dt>
                <dd className={FACT_VALUE}>{row.metadata?.partCount ?? "—"}</dd>
              </div>
              <div className="stat-row">
                <dt className={FACT_LABEL}>Measures</dt>
                <dd className={FACT_VALUE}>{row.metadata?.measureCount ?? "—"}</dd>
              </div>
              {row.metadata?.software ? (
                <div className="stat-row">
                  <dt className={FACT_LABEL}>Software</dt>
                  <dd className={cn(FACT_VALUE, "type-caption-mono")}>
                    {row.metadata.software}
                  </dd>
                </div>
              ) : null}
              <div className="stat-row">
                <dt className={FACT_LABEL}>Rights in file</dt>
                <dd className={FACT_VALUE}>
                  {row.metadata?.rights?.trim() || "None stated"}
                </dd>
              </div>
              {row.metadata?.sourceUrl ? (
                <div className="stat-row">
                  <dt className={FACT_LABEL}>Source in file</dt>
                  <dd className={FACT_VALUE}>
                    <a
                      href={row.metadata.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all type-caption-mono text-edition-gilt hover:text-edition-ink"
                    >
                      {row.metadata.sourceUrl}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section aria-labelledby="batch-file-credits">
            <h3 id="batch-file-credits" className="type-running-head">
              Credits in file
            </h3>
            <div className="mt-3">
              <CreditList
                row={row}
                disabled={!canEdit}
                onOverride={onOverride}
              />
            </div>
          </section>

          {row.exactMatch?.kind === "catalog" || row.similarMatches.length > 0 ? (
            <section aria-labelledby="batch-file-matches">
              <h3 id="batch-file-matches" className="type-running-head">
                Catalog matches
              </h3>
              <ul className="mt-3 space-y-2">
                {row.exactMatch?.kind === "catalog" ? (
                  <li className="type-body-sm text-edition-body">
                    Exact content match:{" "}
                    <Link
                      to="/admin/scores/$id"
                      params={{ id: row.exactMatch.id }}
                      className="type-hint text-edition-gilt hover:text-edition-ink"
                    >
                      {row.exactMatch.title}
                    </Link>
                  </li>
                ) : null}
                {row.similarMatches.map((match) => (
                  <li key={match.id} className="type-body-sm text-edition-muted">
                    Same title:{" "}
                    <Link
                      to="/admin/scores/$id"
                      params={{ id: match.id }}
                      className="type-hint hover:text-edition-gilt"
                    >
                      {match.title}
                    </Link>
                    {match.composer ? ` · ${match.composer}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="batch-file-preview">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="batch-file-preview" className="type-running-head">
                Page 1
              </h3>
              {canDrawPreview ? (
                <button
                  type="button"
                  className="type-hint text-edition-gilt hover:text-edition-ink"
                  onClick={() => onDrawPreview(row.key)}
                  disabled={previewStatus === "rendering"}
                >
                  {previewStatus === "rendering"
                    ? "Drawing…"
                    : previewStatus === "failed"
                      ? "Try again"
                      : previewSvg
                        ? "Redraw"
                        : "Draw preview"}
                </button>
              ) : null}
            </div>

            {previewStatus === "failed" && previewError ? (
              <p className="mt-3 type-body-sm text-edition-semantic-error">
                {previewError}
              </p>
            ) : null}

            {previewSvg ? (
              <div className="mt-3 border border-edition-hairline-strong bg-edition-surface-page p-2">
                <PreviewImage svg={previewSvg} alt={previewLabel} />
              </div>
            ) : row.score && row.status === "done" ? (
              <div className="mt-3 border border-edition-hairline-strong bg-edition-surface-page p-2">
                {/* Admin-only SVG from a session-gated route. */}
                <img
                  src={`/api/admin/scores/${row.score.id}/preview`}
                  alt={previewLabel}
                  className="mx-auto max-h-[26rem] w-full object-contain"
                />
              </div>
            ) : (
              <p className="mt-3 type-body-sm text-edition-muted">
                {previewStatus === "rendering"
                  ? "Drawing the first page in this browser…"
                  : row.status === "preview-failed"
                    ? "The preview could not be drawn. Try again, or open the score to check the viewer."
                    : "Not drawn yet. The preview will be generated after upload if you skip this."}
              </p>
            )}
          </section>

          {committed && row.score ? (
            <section aria-labelledby="batch-file-result">
              <h3 id="batch-file-result" className="type-running-head">
                Result
              </h3>
              <div className="mt-3 flex flex-wrap gap-4">
                <Link
                  to="/admin/scores/$id"
                  params={{ id: row.score.id }}
                  className="type-hint text-edition-gilt hover:text-edition-ink"
                >
                  Edit score
                </Link>
                {visibility === "public" ? (
                  <Link
                    to="/scores/$slug"
                    params={{ slug: row.score.slug }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="type-hint hover:text-edition-gilt"
                  >
                    Open public page
                  </Link>
                ) : null}
              </div>
              <p className="mt-3 break-all type-caption-mono text-edition-muted">
                /scores/{row.score.slug}
              </p>
            </section>
          ) : null}
        </div>

        <div className="border-t border-edition-hairline-strong px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {editable && !committed && row.status !== "invalid" && row.status !== "reading" ? (
                isExcluded ? (
                  <button
                    type="button"
                    className="type-hint text-edition-gilt hover:text-edition-ink"
                    onClick={() => onInclude(row.key)}
                  >
                    Include file
                  </button>
                ) : (
                  <button
                    type="button"
                    className="type-hint text-edition-muted hover:text-edition-semantic-error"
                    onClick={() => onExclude(row.key)}
                  >
                    Skip file
                  </button>
                )
              ) : null}
              {editable && !committed && row.status !== "reading" ? (
                <button
                  type="button"
                  className="type-hint text-edition-muted hover:text-edition-semantic-error"
                  onClick={() => onRemove(row.key)}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <Button type="button" variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
