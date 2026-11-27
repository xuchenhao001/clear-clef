"use client";

import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AdminComposerMergeForm } from "@/components/admin/admin-composer-merge-form";
import type { ComposerWithCount } from "@/lib/scores/composers";
import type { AdminComposerCreditSearch } from "@/lib/admin/composer-credit";
import type { ComposerCreditStats } from "@/lib/scores/credit";

type AdminAuthorityFileProps = {
  composers: ComposerWithCount[];
  stats: ComposerCreditStats;
  search: AdminComposerCreditSearch;
};

export function AdminAuthorityFile({
  composers,
  stats,
  search,
}: AdminAuthorityFileProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState(search.composerQ ?? "");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("view", "authority");
    if (q.trim()) params.set("composerQ", q.trim());
    navigate({ href: `/admin/composers?${params.toString()}` });
  }

  const uncredited = composers.find(
    (composer) => composer.displayName === "Uncredited",
  );
  const credited = composers.filter(
    (composer) => composer.displayName !== "Uncredited",
  );

  return (
    <div className="flex flex-col gap-7">
      <form
        className="flex flex-col gap-2 border-b border-edition-hairline pb-4 sm:flex-row sm:items-end"
        onSubmit={submit}
      >
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="authority-q" className="type-label">
            Search the authority file
          </label>
          <input
            id="authority-q"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Name, sort name or alias…"
            className="mt-1.5 w-full border-b border-edition-hairline bg-transparent py-2 type-body-sm text-edition-ink outline-none placeholder:text-edition-muted focus-visible:border-edition-gilt"
          />
        </div>
        <button
          type="submit"
          className="type-hint pb-2 text-edition-gilt hover:text-edition-ink"
        >
          Search
        </button>
        {search.composerQ ? (
          <Link
            to="/admin/composers"
            search={{ view: "authority" }}
            className="type-hint pb-2 text-edition-muted hover:text-edition-ink"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {uncredited ? (
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-y border-edition-hairline bg-edition-surface/30 px-3 py-3">
          <div>
            <p className="type-row-title">Uncredited</p>
            <p className="mt-1 type-shelf">
              Reviewed anonymous works. {uncredited.scoreCount}{" "}
              {uncredited.scoreCount === 1 ? "work" : "works"}.
            </p>
          </div>
          <Link
            to="/admin/composers"
            search={{ view: "unassigned" }}
            className="type-hint text-edition-gilt hover:text-edition-ink"
          >
            Review {stats.unassigned} unassigned{" "}
            {stats.unassigned === 1 ? "work" : "works"} →
          </Link>
        </div>
      ) : null}

      <section aria-labelledby="authority-file-heading">
        <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
          <h2 id="authority-file-heading" className="type-running-head">
            Authority file
          </h2>
          <p className="type-extent">
            {credited.length} {credited.length === 1 ? "composer" : "composers"}
          </p>
        </div>
        {credited.length === 0 ? (
          <p className="py-6 type-body-sm text-edition-muted">
            No composer matches this search.
          </p>
        ) : (
          <ul>
            {credited.map((composer) => (
              <li
                key={composer.id}
                className="border-b border-edition-hairline-soft py-3.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <p className="type-row-title">{composer.displayName}</p>
                    <p className="mt-1 type-shelf">
                      {composer.sortName}
                      {composer.birthYear && composer.deathYear
                        ? ` · ${composer.birthYear}–${composer.deathYear}`
                        : ""}
                      {composer.aliases.length > 0
                        ? ` · aliases: ${composer.aliases.join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="type-shelf">
                      {composer.scoreCount}{" "}
                      {composer.scoreCount === 1 ? "work" : "works"}
                    </span>
                    <Link
                      to="/admin/scores"
                      search={{ composer: composer.id }}
                      className="type-hint text-edition-gilt hover:text-edition-ink"
                    >
                      View works
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 border-b border-edition-hairline pb-3 outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring">
          <span className="type-running-head">Merge duplicate composers</span>
          <span className="type-hint text-edition-muted group-open:text-edition-gilt">
            Open
          </span>
        </summary>
        <div className="border-b border-edition-hairline">
          <AdminComposerMergeForm composers={composers} />
        </div>
      </details>
    </div>
  );
}
