import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminScoreList } from "@/components/admin/admin-score-list";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { buttonVariants } from "@/components/ui/button";
import { getAdminCatalogStats } from "@/lib/admin/catalog-stats";
import { listAdminScores } from "@/lib/scores/admin";
import { cn } from "cn";

export default async function AdminOverviewPage() {
  const scores = await listAdminScores();
  const stats = getAdminCatalogStats(scores);
  const recentScores = scores.slice(0, 5);

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader
        title="Catalog overview"
        description="Catalog health at a glance. Upload new works or open the full score list to edit metadata."
        actions={
          <>
            <Link href="/admin/upload" className={cn(buttonVariants(), "w-fit")}>
              Upload score
            </Link>
            <Link
              href="/admin/scores"
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

      {recentScores.length > 0 ? (
        <AdminScoreList
          scores={recentScores}
          compact
          heading="Recent scores"
          headAction={
            scores.length > recentScores.length ? (
              <Link
                href="/admin/scores"
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
