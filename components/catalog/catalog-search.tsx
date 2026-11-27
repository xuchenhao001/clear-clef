import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { CatalogSearch } from "@/lib/catalog/url-state";
import { cn } from "cn";

type CatalogSearchFormProps = {
  search: CatalogSearch;
  compact?: boolean;
};

function hiddenFacetInputs(search: CatalogSearch) {
  return (["composer", "key", "difficulty", "license", "tag"] as const).flatMap(
    (name) =>
      (search[name] ?? []).map((value) => (
        <input key={`${name}-${value}`} type="hidden" name={name} value={value} />
      )),
  );
}

export function CatalogSearchForm({ search, compact = false }: CatalogSearchFormProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(search.q ?? "");
  const lastPushed = useRef(search.q ?? "");

  useEffect(() => {
    setValue(search.q ?? "");
    lastPushed.current = search.q ?? "";
  }, [search.q]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === (search.q ?? "")) {
      return;
    }
    const timeout = window.setTimeout(() => {
      void navigate({
        to: "/",
        search: {
          ...search,
          q: trimmed || undefined,
          page: undefined,
        },
        replace: true,
      });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [value, search, navigate]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed === lastPushed.current) {
      return;
    }
    lastPushed.current = trimmed;
    void navigate({
      to: "/",
      search: {
        ...search,
        q: trimmed || undefined,
        page: undefined,
      },
    });
  }

  return (
    <form
      role="search"
      action="/"
      method="get"
      onSubmit={submit}
      className={cn("w-full", compact ? "max-w-2xl" : "max-w-3xl")}
    >
      <label
        htmlFor="catalog-q"
        className="type-running-head block text-edition-muted"
      >
        Search the catalogue
      </label>
      <div className="mt-2 flex items-baseline gap-4 border-b border-edition-hairline-strong pb-2 focus-within:border-edition-gilt">
        <input
          ref={inputRef}
          id="catalog-q"
          name="q"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setValue("");
            }
          }}
          placeholder="Title, composer, BWV, key…"
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-11 min-w-0 flex-1 bg-transparent type-body-md text-edition-ink outline-none placeholder:text-edition-muted-soft"
        />
        <button
          type="submit"
          className="type-hint shrink-0 py-2 text-edition-gilt hover:text-edition-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring coarse:min-h-11"
        >
          Search
        </button>
      </div>
      {hiddenFacetInputs(search)}
      {search.sort ? <input type="hidden" name="sort" value={search.sort} /> : null}
    </form>
  );
}
