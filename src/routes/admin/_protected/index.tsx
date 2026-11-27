import { Link, createFileRoute } from "@tanstack/react-router";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminScoreList } from "@/components/admin/admin-score-list";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { buttonVariants } from "@/components/ui/button";
import { loadAdminOverview } from "@/src/server/admin";
import { cn } from "cn";

export const Route = createFileRoute("/admin/_protected/")({
  loader: () => loadAdminOverview(),
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const { scores, stats, health, creditStats } = Route.useLoaderData();
  const recentScores = scores.slice(0, 5);

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader
        title="Catalog overview"
        description="Catalog health at a glance. Upload new works or open the full score list to edit metadata."
        actions={
          <>
            <Link to="/admin/upload" className={cn(buttonVariants(), "w-fit")}>
              Upload score
            </Link>
            <Link
              to="/admin/batch-upload"
              className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
            >
              Batch upload
            </Link>
            <Link
              to="/admin/scores"
              className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
            >
              All scores
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Public" value={stats.public} />
        <AdminStatCard label="Unlisted" value={stats.unlisted} />
        <AdminStatCard label="Private" value={stats.private} />
      </div>

      <section aria-labelledby="catalog-health" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
          <h2 id="catalog-health" className="type-running-head">
            Catalog health
          </h2>
          <Link
            to="/admin/composers"
            search={{
              view:
                creditStats.unassigned > 0 ? "unassigned" : "authority",
            }}
            className="type-hint text-edition-gilt hover:text-edition-ink"
          >
            {creditStats.unassigned > 0
              ? `Assign ${creditStats.unassigned} composer ${
                  creditStats.unassigned === 1 ? "credit" : "credits"
                } →`
              : "Composer credit"}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="No composer" value={health.missingComposer} />
          <AdminStatCard label="Reviewed anonymous" value={health.uncredited} />
          <AdminStatCard label="No key" value={health.missingKey} />
          <AdminStatCard label="No difficulty" value={health.missingDifficulty} />
          <AdminStatCard label="No preview" value={health.missingPreview} />
          <AdminStatCard label="Repeated work keys" value={health.duplicateWorks} />
          <AdminStatCard label="Unused tags" value={health.unusedTags} />
          <AdminStatCard label="Search rows" value={health.indexRows} />
        </div>
      </section>

      {recentScores.length > 0 ? (
        <AdminScoreList
          scores={recentScores}
          compact
          heading="Recent scores"
          headAction={
            scores.length > recentScores.length ? (
              <Link
                to="/admin/scores"
                className="type-nav-link hover:text-edition-ink"
              >
                View all
              </Link>
            ) : null
          }
        />
      ) : (
        <AdminEmptyState
          title="No scores in the catalog"
          description="Upload a MusicXML file to create the first public catalog entry."
          primaryHref="/admin/upload"
          primaryLabel="Upload score"
        />
      )}
    </div>
  );
}
