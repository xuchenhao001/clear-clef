"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ComposerPicker,
  type ComposerChoice,
} from "@/components/admin/composer-picker";
import {
  formatAdminComposerCreditSearch,
  type AdminComposerCreditSearch,
} from "@/lib/admin/composer-credit";
import type { ComposerWithCount } from "@/lib/scores/composers";
import type {
  UnassignedImport,
  UnassignedPage,
  UnassignedScore,
} from "@/lib/scores/credit";
import { difficultyLabel, keyLabel } from "@/lib/catalog/vocab";
import { inspectFile } from "@/lib/ingest/inspect-client";

type AdminUnassignedQueueProps = {
  page: UnassignedPage;
  composers: ComposerWithCount[];
  imports: UnassignedImport[];
  search: AdminComposerCreditSearch;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function scoreFacts(score: UnassignedScore): string {
  return [
    score.catalogNumber,
    score.key ? keyLabel(score.key) : null,
    score.timeSignature,
    score.difficulty ? difficultyLabel(score.difficulty) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function visibilityLabel(value: string): string {
  return value === "public"
    ? "Public"
    : value === "unlisted"
      ? "Unlisted"
      : "Private";
}

function choiceToBody(choice: ComposerChoice) {
  if (choice.kind === "existing") return { composerId: choice.composer.id };
  if (choice.kind === "create") return { createName: choice.name };
  if (choice.kind === "uncredited") return { keepUncredited: true };
  return null;
}

export function AdminUnassignedQueue({
  page,
  composers,
  imports,
  search,
}: AdminUnassignedQueueProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const searchStr = useRouterState({
    select: (state) => state.location.searchStr,
  });
  const [q, setQ] = useState(search.q ?? "");
  const [visibility, setVisibility] = useState(search.visibility ?? "");
  const [importId, setImportId] = useState(search.import ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [choice, setChoice] = useState<ComposerChoice | null>(null);
  const [rowTarget, setRowTarget] = useState<string | null>(null);
  const [rowChoice, setRowChoice] = useState<ComposerChoice | null>(null);
  const [pending, setPending] = useState(false);
  const [rowPending, setRowPending] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = formatAdminComposerCreditSearch({
        view: "unassigned",
        q,
        visibility,
        import: importId,
      });
      const current = new URLSearchParams(searchStr);
      const currentView = current.get("view");
      const currentQuery = current.get("q") ?? "";
      const currentVisibility = current.get("visibility") ?? "";
      const currentImport = current.get("import") ?? "";
      const differs =
        (search.view ?? "unassigned") !== "unassigned" ||
        currentQuery !== q.trim() ||
        currentVisibility !== visibility ||
        currentImport !== importId ||
        currentView === "authority";
      if (differs) navigate({ href: next });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [q, visibility, importId, navigate, search.view, searchStr]);

  const visibleIds = useMemo(
    () => page.items.map((score) => score.id),
    [page.items],
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }

  async function selectAllMatching() {
    setSelectingAll(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (visibility) params.set("visibility", visibility);
      if (importId) params.set("import", importId);
      const response = await fetch(
        `/api/admin/composers/unassigned-ids?${params.toString()}`,
      );
      const json = (await response.json()) as {
        error?: string;
        ids?: string[];
        total?: number;
      };
      if (!response.ok) {
        throw new Error(json.error ?? "Could not select the queue");
      }
      if ((json.total ?? 0) > 500) {
        throw new Error(
          "Select all is limited to 500 works. Narrow the filters first.",
        );
      }
      setSelected(new Set(json.ids ?? []));
    } catch (selectError) {
      setError(
        selectError instanceof Error
          ? selectError.message
          : "Could not select the queue",
      );
    } finally {
      setSelectingAll(false);
    }
  }

  async function readCreditFromFile(score: UnassignedScore) {
    setReadingId(score.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/scores/${score.id}/file`);
      if (!response.ok) {
        throw new Error("Could not read the original file");
      }
      const blob = await response.blob();
      const filename = score.sourceFilename ?? "score.mxl";
      const inspected = await inspectFile(new File([blob], filename));
      const raw = inspected.metadata.composer?.trim() ?? null;
      if (!raw) {
        setMessage("The file has no composer credit.");
        return;
      }
      const save = await fetch(`/api/admin/scores/${score.id}/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ composerRaw: raw, sourceFilename: filename }),
      });
      const json = (await save.json()) as { error?: string };
      if (!save.ok) {
        throw new Error(json.error ?? "Could not save the file credit");
      }
      setMessage(`File credit saved: “${raw}”. Review it before assigning.`);
      await router.invalidate();
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "Could not read the file credit",
      );
    } finally {
      setReadingId(null);
    }
  }

  async function assign(ids: string[], target: ComposerChoice) {
    const body = choiceToBody(target);
    if (!body) {
      setError("Choose a composer, create one, or keep the works uncredited.");
      return;
    }
    const response = await fetch("/api/admin/composers/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoreIds: ids, ...body }),
    });
    const json = (await response.json()) as {
      error?: string;
      assigned?: number;
      target?: { displayName: string };
    };
    if (!response.ok) {
      throw new Error(json.error ?? "Assignment failed");
    }
    const count = json.assigned ?? ids.length;
    const name =
      target.kind === "uncredited"
        ? "Uncredited"
        : (json.target?.displayName ?? "the chosen composer");
    setMessage(
      `${count} ${count === 1 ? "work" : "works"} assigned to ${name}.`,
    );
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) next.delete(id);
      return next;
    });
    setChoice(null);
    setRowChoice(null);
    setRowTarget(null);
    await router.invalidate();
  }

  async function assignSelected() {
    if (!choice || selected.size === 0) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await assign([...selected], choice);
    } catch (assignError) {
      setError(
        assignError instanceof Error ? assignError.message : "Assignment failed",
      );
    } finally {
      setPending(false);
    }
  }

  async function keepSelectedUncredited() {
    if (selected.size === 0) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await assign([...selected], { kind: "uncredited" });
    } catch (assignError) {
      setError(
        assignError instanceof Error ? assignError.message : "Assignment failed",
      );
    } finally {
      setPending(false);
    }
  }

  async function assignRow(scoreId: string) {
    if (!rowChoice) return;
    setRowPending(true);
    setError(null);
    setMessage(null);
    try {
      await assign([scoreId], rowChoice);
    } catch (assignError) {
      setError(
        assignError instanceof Error ? assignError.message : "Assignment failed",
      );
    } finally {
      setRowPending(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-4 border-b border-edition-hairline pb-5 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="credit-queue-q" className="type-label">
            Search
          </label>
          <input
            id="credit-queue-q"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Title, file credit, filename, catalogue…"
            className="mt-1.5 w-full border-b border-edition-hairline bg-transparent py-2 type-body-sm text-edition-ink outline-none placeholder:text-edition-muted focus-visible:border-edition-gilt"
          />
        </div>
        <div className="w-full sm:w-44">
          <label htmlFor="credit-queue-visibility" className="type-label">
            Visibility
          </label>
          <select
            id="credit-queue-visibility"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as typeof visibility)}
            className="mt-1.5 w-full rounded-sm border border-edition-hairline bg-edition-canvas/60 px-2.5 py-2 type-body-sm text-edition-ink outline-none focus-visible:border-edition-gilt"
          >
            <option value="">All</option>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </div>
        {imports.length > 0 ? (
          <div className="w-full sm:w-56">
            <label htmlFor="credit-queue-import" className="type-label">
              Batch
            </label>
            <select
              id="credit-queue-import"
              value={importId}
              onChange={(event) => setImportId(event.target.value)}
              className="mt-1.5 w-full rounded-sm border border-edition-hairline bg-edition-canvas/60 px-2.5 py-2 type-body-sm text-edition-ink outline-none focus-visible:border-edition-gilt"
            >
              <option value="">All batches</option>
              {imports.map((item) => (
                <option key={item.importId} value={item.importId}>
                  {item.importId.slice(0, 10)} · {item.count}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {q || visibility || importId ? (
          <button
            type="button"
            className="type-hint pb-2 text-edition-muted hover:text-edition-gilt"
            onClick={() => {
              setQ("");
              setVisibility("");
              setImportId("");
            }}
          >
            Clear filters
          </button>
        ) : null}
      </form>

      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-edition-hairline pb-3">
        {page.items.length > 0 ? (
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <span className="flex items-baseline gap-3">
              <input
                id="credit-select-page"
                type="checkbox"
                checked={allVisibleSelected}
                onChange={togglePage}
                className="size-4 accent-[var(--edition-gilt)]"
              />
              <label htmlFor="credit-select-page" className="type-label">
                Select this page
              </label>
            </span>
            {page.total > page.items.length ? (
              <button
                type="button"
                className="type-hint text-edition-gilt hover:text-edition-ink"
                onClick={() => void selectAllMatching()}
                disabled={selectingAll}
              >
                {selectingAll
                  ? "Selecting…"
                  : `Select all ${page.total} matching`}
              </button>
            ) : null}
          </div>
        ) : (
          <span />
        )}
        <p className="type-extent" aria-live="polite">
          {page.total} unassigned {page.total === 1 ? "work" : "works"}
          {selectedCount > 0 ? ` · ${selectedCount} selected` : ""}
        </p>
      </div>

      {message ? (
        <p className="type-body-sm text-edition-semantic-success" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="type-body-sm text-edition-semantic-error" role="alert">
          {error}
        </p>
      ) : null}

      {page.items.length === 0 ? (
        <p className="py-8 type-body-sm text-edition-muted">
          {q || visibility || importId
            ? "No works match these filters."
            : "No works need a composer decision."}
        </p>
      ) : (
        <ul>
          {page.items.map((score) => {
            const facts = scoreFacts(score);
            const checked = selected.has(score.id);
            const editing = rowTarget === score.id;
            return (
              <li
                key={score.id}
                className="border-b border-edition-hairline-soft py-4"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <input
                    id={`credit-score-${score.id}`}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(score.id)}
                    className="mt-1 size-4 shrink-0 accent-[var(--edition-gilt)]"
                    aria-label={`Select ${score.title}`}
                  />
                  <div className="w-14 shrink-0 sm:w-20">
                    {score.previewUrl ? (
                      <img
                        src={score.previewUrl}
                        alt=""
                        loading="lazy"
                        className="h-20 w-full rounded-sm border border-edition-hairline bg-edition-surface-page object-contain object-top sm:h-24"
                      />
                    ) : (
                      <div className="flex h-20 w-full items-center justify-center rounded-sm border border-edition-hairline bg-edition-surface-page px-1 text-center type-caption-mono text-edition-board-muted sm:h-24">
                        No preview
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <label
                        htmlFor={`credit-score-${score.id}`}
                        className="type-row-title cursor-pointer break-words"
                      >
                        {score.title}
                      </label>
                      <span className="type-shelf">
                        {visibilityLabel(score.visibility)}
                        {score.importId ? ` · ${score.importId}` : ""}
                        {` · ${formatDate(score.createdAt)}`}
                      </span>
                    </div>
                    {facts ? (
                      <p className="mt-1 type-shelf">{facts}</p>
                    ) : null}
                    <p className="mt-1 type-shelf">
                      File credit:{" "}
                      {score.composerRaw ? (
                        <span className="text-edition-ink">
                          “{score.composerRaw}”
                        </span>
                      ) : (
                        <span className="text-edition-muted">none found</span>
                      )}
                      {score.sourceFilename ? (
                        <>
                          <span aria-hidden className="mx-2 text-edition-muted-soft">·</span>
                          <span className="type-caption-mono break-all">
                            {score.sourceFilename}
                          </span>
                        </>
                      ) : null}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                      <button
                        type="button"
                        className="type-hint text-edition-gilt hover:text-edition-ink"
                        aria-expanded={editing}
                        onClick={() => {
                          setRowTarget(editing ? null : score.id);
                          setRowChoice(null);
                        }}
                      >
                        {editing ? "Close composer picker" : "Assign composer…"}
                      </button>
                      {!score.composerRaw ? (
                        <button
                          type="button"
                          className="type-hint text-edition-muted hover:text-edition-gilt"
                          disabled={readingId === score.id}
                          onClick={() => void readCreditFromFile(score)}
                        >
                          {readingId === score.id
                            ? "Reading file…"
                            : "Read credit from file"}
                        </button>
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
                        className="type-hint hover:text-edition-gilt"
                      >
                        Open
                      </Link>
                    </div>

                    {editing ? (
                      <div className="mt-3 flex flex-col gap-2 rounded-sm border border-edition-hairline bg-edition-surface/40 p-3 sm:flex-row sm:items-center">
                        <ComposerPicker
                          id={`credit-picker-${score.id}`}
                          composers={composers}
                          value={rowChoice}
                          onChange={setRowChoice}
                          suggestedName={score.composerRaw}
                          allowUncredited
                          allowClear
                          className="min-w-0 flex-1"
                        />
                        <Button
                          type="button"
                          disabled={!rowChoice || rowPending}
                          onClick={() => void assignRow(score.id)}
                          className="w-full sm:w-auto"
                        >
                          {rowPending ? "Assigning…" : "Assign"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {page.pageCount > 1 ? (
        <nav aria-label="Unassigned works pages" className="flex flex-wrap items-center gap-3">
          {page.page > 1 ? (
            <Link
              to="/admin/composers"
              search={{
                ...search,
                view: "unassigned",
                page: page.page - 1,
              }}
              className="type-hint hover:text-edition-gilt"
            >
              Previous
            </Link>
          ) : null}
          <span className="type-extent">
            Page {page.page} of {page.pageCount}
          </span>
          {page.page < page.pageCount ? (
            <Link
              to="/admin/composers"
              search={{
                ...search,
                view: "unassigned",
                page: page.page + 1,
              }}
              className="type-hint hover:text-edition-gilt"
            >
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}

      {selectedCount > 0 ? (
        <div className="sticky bottom-0 z-20 -mx-6 border-t border-edition-hairline-strong bg-edition-canvas/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="type-running-head">
                {selectedCount} selected
              </p>
              <button
                type="button"
                className="mt-1 type-hint text-edition-muted hover:text-edition-gilt"
                onClick={() => setSelected(new Set())}
              >
                Clear selection
              </button>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <ComposerPicker
                id="credit-bulk-picker"
                composers={composers}
                value={choice}
                onChange={setChoice}
                allowUncredited
                placeholder="Choose a composer…"
                className="min-w-0 sm:w-72"
              />
              <Button
                type="button"
                disabled={!choice || pending}
                onClick={() => void assignSelected()}
                className="w-full sm:w-auto"
              >
                {pending
                  ? "Assigning…"
                  : choice?.kind === "existing"
                    ? `Assign ${selectedCount} to ${choice.composer.displayName}`
                    : choice?.kind === "create"
                      ? `Create & assign ${selectedCount}`
                      : choice?.kind === "uncredited"
                        ? `Keep ${selectedCount} uncredited`
                        : `Assign ${selectedCount}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => void keepSelectedUncredited()}
                className="w-full sm:w-auto"
              >
                Keep uncredited
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
