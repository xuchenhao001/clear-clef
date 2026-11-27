import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type {
  PublicCatalogFacet,
  PublicCatalogFacetValue,
} from "@/lib/scores/queries";
import {
  setFacetValue,
  type CatalogSearch,
} from "@/lib/catalog/url-state";
import { cn } from "cn";

type FacetNavProps = {
  facets: PublicCatalogFacet[];
  search: CatalogSearch;
  onNavigate?: () => void;
};

function activeValues(search: CatalogSearch): number {
  return (
    (search.composer?.length ?? 0) +
    (search.key?.length ?? 0) +
    (search.difficulty?.length ?? 0) +
    (search.license?.length ?? 0) +
    (search.tag?.length ?? 0)
  );
}

function FacetValueLink({
  facet,
  value,
  search,
  onNavigate,
}: {
  facet: PublicCatalogFacet;
  value: PublicCatalogFacetValue;
  search: CatalogSearch;
  onNavigate?: () => void;
}) {
  const active = (search[facet.name] ?? []).includes(value.slug);
  return (
    <li className="border-b border-edition-hairline-soft">
      <Link
        to="/"
        search={setFacetValue(search, facet.name, value.slug)}
        onClick={onNavigate}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex items-baseline justify-between gap-3 py-2.5 text-[0.8125rem] normal-case tracking-[0.02em] edition-interactive-transition hover:text-edition-ink coarse:min-h-11",
          active ? "nav-current text-edition-ink" : "text-edition-muted",
        )}
      >
        <span>{value.label}</span>
        <span className="type-extent shrink-0">{value.count}</span>
      </Link>
    </li>
  );
}

function pluralLabel(label: string): string {
  if (label === "Difficulty") return "difficulties";
  if (label === "Key") return "keys";
  return `${label.toLowerCase()}s`;
}

function FacetGroup({
  facet,
  search,
  onNavigate,
}: {
  facet: PublicCatalogFacet;
  search: CatalogSearch;
  onNavigate?: () => void;
}) {
  if (facet.values.length === 0) {
    return null;
  }

  const selected = new Set(search[facet.name] ?? []);
  const ordered = [...facet.values].sort((left, right) => {
    const leftSelected = selected.has(left.slug) ? -1 : 0;
    const rightSelected = selected.has(right.slug) ? -1 : 0;
    return leftSelected - rightSelected;
  });
  const first = ordered.slice(0, 7);
  const rest = ordered.slice(7);

  return (
    <div className="mt-6">
      <p className="type-running-head">{facet.label}</p>
      <ul className="mt-2 border-t border-edition-hairline">
        {first.map((value) => (
          <FacetValueLink
            key={value.slug}
            facet={facet}
            value={value}
            search={search}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
      {rest.length > 0 ? (
        <details className="group mt-1">
          <summary className="type-hint cursor-pointer list-none py-2 text-edition-gilt marker:content-none hover:text-edition-ink">
            More {pluralLabel(facet.label)} ({rest.length})
          </summary>
          <ul className="border-t border-edition-hairline">
            {rest.map((value) => (
              <FacetValueLink
                key={value.slug}
                facet={facet}
                value={value}
                search={search}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function CatalogFacetNav({ facets, search, onNavigate }: FacetNavProps) {
  const count = activeValues(search);
  const hasRefinements = Boolean(search.q) || count > 0;

  return (
    <nav aria-label="Catalogue filters">
      <div className="flex items-baseline justify-between gap-3">
        <p className="type-running-head">Filters</p>
        {count > 0 ? (
          <Link
            to="/"
            search={{ ...search, composer: undefined, key: undefined, difficulty: undefined, license: undefined, tag: undefined, page: undefined }}
            onClick={onNavigate}
            className="type-hint text-edition-gilt hover:text-edition-ink"
          >
            Clear {count}
          </Link>
        ) : null}
      </div>
      <ul className="mt-3 border-t border-edition-hairline">
        <li className="border-b border-edition-hairline-soft">
          <Link
            to="/"
            search={{}}
            onClick={onNavigate}
            activeOptions={{ includeSearch: true, exact: true }}
            aria-current={!hasRefinements ? "page" : undefined}
            className={cn(
              "type-nav-link inline-flex py-2.5 edition-interactive-transition hover:text-edition-ink",
              !hasRefinements && "nav-current text-edition-ink",
            )}
          >
            All works
          </Link>
        </li>
      </ul>
      {facets.map((facet) => (
        <FacetGroup
          key={facet.name}
          facet={facet}
          search={search}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function CatalogFilterSheet({
  facets,
  search,
}: {
  facets: PublicCatalogFacet[];
  search: CatalogSearch;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const count = activeValues(search);

  function show() {
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function close() {
    dialogRef.current?.close();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="type-hint inline-flex min-h-11 items-center gap-2 border-b border-edition-hairline-strong py-2 text-edition-ink hover:text-edition-gilt focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring lg:hidden"
      >
        Filters
        {count > 0 ? (
          <span className="inline-flex min-w-5 justify-center bg-edition-gilt px-1 text-[0.625rem] leading-5 text-edition-on-gilt">
            {count}
          </span>
        ) : null}
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Catalogue filters"
        onClose={() => setOpen(false)}
        className="m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-black/70 lg:hidden"
      >
        <div className="surface-board flex h-dvh flex-col text-edition-ink">
          <div className="flex items-center justify-between border-b border-edition-hairline px-6 py-4">
            <p className="type-running-head">Filters</p>
            <button
              type="button"
              onClick={close}
              className="type-hint text-edition-gilt hover:text-edition-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <CatalogFacetNav
              facets={facets}
              search={search}
              onNavigate={close}
            />
          </div>
          <div className="border-t border-edition-hairline px-6 py-4">
            <button
              type="button"
              onClick={close}
              className="type-hint w-full border border-edition-gilt py-3 text-edition-gilt hover:bg-edition-gilt hover:text-edition-on-gilt focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
            >
              Show results
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
