import { Link, createFileRoute } from "@tanstack/react-router";
import { AdminAuthorityFile } from "@/components/admin/admin-authority-file";
import { AdminFixSlugsButton } from "@/components/admin/admin-fix-slugs-button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminReindexButton } from "@/components/admin/admin-reindex-button";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminUnassignedQueue } from "@/components/admin/admin-unassigned-queue";
import {
  parseAdminComposerCreditSearch,
  type AdminComposerView,
} from "@/lib/admin/composer-credit";
import { loadAdminComposerCredit } from "@/src/server/admin";
import { cn } from "cn";

export const Route = createFileRoute("/admin/_protected/composers")({
  validateSearch: (search) =>
    parseAdminComposerCreditSearch(
      search as Record<string, string | string[] | undefined>,
    ),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadAdminComposerCredit({ data: deps }),
  component: AdminComposersPage,
});

type Tab = {
  view: AdminComposerView;
  label: string;
  count?: number;
};

function AdminComposersPage() {
  const { unassigned, composers, stats, events, imports, health, search } =
    Route.useLoaderData();
  const view = search.view ?? "unassigned";

  const tabs: Tab[] = [
    { view: "unassigned", label: "Unassigned works", count: stats.unassigned },
    { view: "authority", label: "Authority file", count: composers.length },
    { view: "maintenance", label: "Maintenance" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Composers & credit"
        description="Resolve works that still need a composer decision, then maintain the authority file that groups and indexes them."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Composers & credit" },
        ]}
        actions={
          <Link
            to="/admin/scores"
            className="type-hint text-edition-gilt hover:text-edition-ink"
          >
            All scores
          </Link>
        }
      />

      <nav
        aria-label="Composer credit views"
        className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-edition-hairline"
      >
        {tabs.map((tab) => {
          const active = view === tab.view;
          return (
            <Link
              key={tab.view}
              to="/admin/composers"
              search={{ view: tab.view }}
              aria-current={active ? "page" : undefined}
              aria-label={
                typeof tab.count === "number"
                  ? `${tab.label}, ${tab.count}`
                  : tab.label
              }
              className={cn(
                "type-running-head -mb-px border-b-2 pb-3 transition-colors",
                active
                  ? "border-edition-gilt text-edition-gilt"
                  : "border-transparent text-edition-muted hover:text-edition-ink",
              )}
            >
              {tab.label}
              {typeof tab.count === "number" ? (
                <span className="ml-2 type-caption-mono text-edition-muted">
                  {tab.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {view === "unassigned" ? (
        <AdminUnassignedQueue
          page={unassigned}
          composers={composers}
          imports={imports}
          search={search}
        />
      ) : null}

      {view === "authority" ? (
        <AdminAuthorityFile composers={composers} stats={stats} search={search} />
      ) : null}

      {view === "maintenance" ? (
        <div className="flex flex-col gap-8">
          <section aria-labelledby="maintenance-actions">
            <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
              <h2 id="maintenance-actions" className="type-running-head">
                Catalog maintenance
              </h2>
              <p className="type-extent">Occasional operations</p>
            </div>
            <div className="flex flex-wrap items-center gap-5 py-4">
              <AdminFixSlugsButton />
              <AdminReindexButton />
              <p className="type-body-sm text-edition-muted">
                These rewrite stored data. They are not part of assigning
                credits.
              </p>
            </div>
          </section>

          <section aria-labelledby="maintenance-health">
            <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
              <h2 id="maintenance-health" className="type-running-head">
                Catalog health
              </h2>
              <Link
                to="/admin"
                className="type-hint text-edition-gilt hover:text-edition-ink"
              >
                Overview
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminStatCard label="No composer" value={health.missingComposer} />
              <AdminStatCard
                label="Reviewed anonymous"
                value={health.uncredited}
              />
              <AdminStatCard label="No key" value={health.missingKey} />
              <AdminStatCard
                label="No difficulty"
                value={health.missingDifficulty}
              />
              <AdminStatCard label="No preview" value={health.missingPreview} />
              <AdminStatCard
                label="Repeated work keys"
                value={health.duplicateWorks}
              />
              <AdminStatCard label="Unused tags" value={health.unusedTags} />
              <AdminStatCard label="Search rows" value={health.indexRows} />
            </div>
          </section>

          <section aria-labelledby="recent-credit-events">
            <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
              <h2 id="recent-credit-events" className="type-running-head">
                Recent credit decisions
              </h2>
              <p className="type-extent">Latest 6</p>
            </div>
            {events.length === 0 ? (
              <p className="py-5 type-body-sm text-edition-muted">
                No composer decisions recorded yet.
              </p>
            ) : (
              <ul>
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-edition-hairline-soft py-3"
                  >
                    <span className="min-w-0 type-body-sm text-edition-body">
                      <Link
                        to="/admin/scores/$id"
                        params={{ id: event.scoreId }}
                        className="hover:text-edition-gilt"
                      >
                        {event.scoreTitle}
                      </Link>
                      {event.previousComposer
                        ? ` · ${event.previousComposer} → ${event.newComposer ?? "Unassigned"}`
                        : ` · Unassigned → ${event.newComposer ?? "Unassigned"}`}
                    </span>
                    <span className="type-shelf">
                      {event.action === "keep_uncredited"
                        ? "Kept uncredited"
                        : "Assigned"}{" "}
                      ·{" "}
                      {event.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {view !== "unassigned" ? (
        <p className="type-body-sm text-edition-muted">
          {stats.unassigned > 0 ? (
            <Link
              to="/admin/composers"
              search={{ view: "unassigned" }}
              className="type-hint text-edition-gilt hover:text-edition-ink"
            >
              {stats.unassigned}{" "}
              {stats.unassigned === 1 ? "work" : "works"} still{" "}
              {stats.unassigned === 1 ? "needs" : "need"} a composer decision →
            </Link>
          ) : (
            "Every work has a composer decision."
          )}
        </p>
      ) : null}
    </div>
  );
}
