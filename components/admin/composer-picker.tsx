"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { canonicalComposer } from "@/lib/catalog/composers";
import type { ComposerWithCount } from "@/lib/scores/composers";
import { cn } from "cn";

export type ComposerChoice =
  | { kind: "existing"; composer: ComposerWithCount }
  | { kind: "create"; name: string }
  | { kind: "uncredited" }
  | { kind: "none" };

type ComposerPickerProps = {
  composers: ComposerWithCount[];
  value: ComposerChoice | null;
  onChange: (choice: ComposerChoice | null) => void;
  id?: string;
  placeholder?: string;
  suggestedName?: string | null;
  allowUncredited?: boolean;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
};

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function matches(composer: ComposerWithCount, query: string): boolean {
  if (!query) return true;
  const target = normalized(query);
  return (
    normalized(composer.displayName).includes(target) ||
    normalized(composer.sortName).includes(target) ||
    composer.aliases.some((alias) => normalized(alias).includes(target))
  );
}

function choiceLabel(choice: ComposerChoice | null): string {
  if (!choice) return "";
  if (choice.kind === "existing") return choice.composer.displayName;
  if (choice.kind === "create") return choice.name;
  if (choice.kind === "uncredited") return "Uncredited (reviewed anonymous)";
  return "";
}

export function ComposerPicker({
  composers,
  value,
  onChange,
  id,
  placeholder = "Search composers…",
  suggestedName,
  allowUncredited = false,
  allowClear = false,
  disabled = false,
  className,
}: ComposerPickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-list`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestion = useMemo(() => {
    const raw = suggestedName?.trim();
    if (!raw) return null;
    const canonical = canonicalComposer(raw)?.displayName;
    if (!canonical || canonical === "Uncredited") return null;
    const found = composers.find(
      (composer) =>
        normalized(composer.displayName) === normalized(canonical) ||
        composer.aliases.some(
          (alias) => normalized(alias) === normalized(canonical),
        ),
    );
    return found ?? null;
  }, [composers, suggestedName]);

  const filtered = useMemo(() => {
    return composers
      .filter((composer) => composer.displayName !== "Uncredited")
      .filter((composer) => matches(composer, query))
      .filter(
        (composer) =>
          !suggestion || query.trim() || composer.id !== suggestion.id,
      )
      .slice(0, 40);
  }, [composers, query, suggestion]);

  const trimmedQuery = query.trim();
  const exactMatch = filtered.some((composer) => {
    const target = normalized(trimmedQuery);
    return (
      normalized(composer.displayName) === target ||
      normalized(composer.sortName) === target ||
      composer.aliases.some((alias) => normalized(alias) === target)
    );
  });
  const canCreate = trimmedQuery.length >= 2 && !exactMatch;

  type Option =
    | { kind: "suggested"; composer: ComposerWithCount; source: string }
    | { kind: "existing"; composer: ComposerWithCount }
    | { kind: "create"; name: string }
    | { kind: "uncredited" };

  const options = useMemo<Option[]>(() => {
    const result: Option[] = [];
    if (
      suggestion &&
      !query.trim() &&
      !filtered.some((composer) => composer.id === suggestion.id)
    ) {
      result.push({
        kind: "suggested",
        composer: suggestion,
        source: suggestedName?.trim() ?? suggestion.displayName,
      });
    }
    for (const composer of filtered) {
      result.push({ kind: "existing", composer });
    }
    if (canCreate) {
      result.push({ kind: "create", name: trimmedQuery });
    }
    if (allowUncredited) {
      result.push({ kind: "uncredited" });
    }
    return result;
  }, [allowUncredited, canCreate, filtered, suggestion, suggestedName, trimmedQuery]);

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(Math.max(0, current), Math.max(0, options.length - 1)),
    );
  }, [options.length]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function choose(option: Option) {
    if (option.kind === "suggested" || option.kind === "existing") {
      onChange({ kind: "existing", composer: option.composer });
    } else if (option.kind === "create") {
      onChange({ kind: "create", name: option.name });
    } else {
      onChange({ kind: "uncredited" });
    }
    setOpen(false);
    setQuery("");
  }

  const selectedLabel = choiceLabel(value);
  const shownValue = open ? query : selectedLabel;

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && options.length > 0
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          autoComplete="off"
          disabled={disabled}
          value={shownValue}
          placeholder={selectedLabel || placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
              setOpen(true);
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => Math.min(current + 1, options.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const option = options[activeIndex];
              if (option) choose(option);
            } else if (event.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
          className="w-full rounded-sm border border-edition-hairline bg-edition-canvas/60 px-3 py-2 type-body-sm text-edition-ink outline-none placeholder:text-edition-muted focus-visible:border-edition-gilt focus-visible:ring-3 focus-visible:ring-edition-focus-ring disabled:opacity-60"
        />
        {allowClear && value ? (
          <button
            type="button"
            className="shrink-0 type-hint text-edition-muted hover:text-edition-gilt"
            onClick={() => {
              onChange(null);
              setOpen(false);
              setQuery("");
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Composers"
          className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-sm border border-edition-hairline-strong bg-edition-board shadow-plate"
        >
          {options.length === 0 ? (
            <p className="px-3 py-3 type-body-sm text-edition-muted">
              No composer matches. Type at least two letters to create one.
            </p>
          ) : (
            <ul className="divide-y divide-edition-hairline-soft">
              {options.map((option, index) => {
                const key =
                  option.kind === "suggested" || option.kind === "existing"
                    ? option.composer.id
                    : option.kind === "create"
                      ? `create-${option.name}`
                      : "uncredited";
                const selected =
                  option.kind === "existing" || option.kind === "suggested"
                    ? value?.kind === "existing" &&
                      value.composer.id === option.composer.id
                    : option.kind === "create"
                      ? value?.kind === "create" && value.name === option.name
                      : value?.kind === "uncredited";
                return (
                  <li key={key}>
                    <button
                      type="button"
                      id={`${listId}-option-${index}`}
                      role="option"
                      tabIndex={-1}
                      aria-selected={selected}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left outline-none",
                        index === activeIndex && "bg-edition-surface",
                        "hover:bg-edition-surface focus-visible:ring-3 focus-visible:ring-edition-focus-ring",
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(option)}
                    >
                      {option.kind === "suggested" ? (
                        <>
                          <span className="type-body-sm text-edition-ink">
                            Suggested: {option.composer.displayName}
                          </span>
                          <span className="type-caption-mono text-edition-gilt">
                            from “{option.source}”
                          </span>
                        </>
                      ) : option.kind === "existing" ? (
                        <>
                          <span className="type-body-sm text-edition-ink">
                            {option.composer.displayName}
                          </span>
                          <span className="type-caption-mono text-edition-muted">
                            {option.composer.scoreCount}{" "}
                            {option.composer.scoreCount === 1 ? "work" : "works"}
                            {option.composer.aliases.length > 0
                              ? ` · ${option.composer.aliases.slice(0, 3).join(", ")}`
                              : ""}
                          </span>
                        </>
                      ) : option.kind === "create" ? (
                        <>
                          <span className="type-body-sm text-edition-gilt">
                            Create “{option.name}”
                          </span>
                          <span className="type-caption-mono text-edition-muted">
                            Adds a new authority record
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="type-body-sm text-edition-ink">
                            Keep uncredited
                          </span>
                          <span className="type-caption-mono text-edition-muted">
                            Reviewed anonymous · stays visible as Uncredited
                          </span>
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
