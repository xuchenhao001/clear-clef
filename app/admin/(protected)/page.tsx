import Link from "next/link";
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
        title="Overview"
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
        <AdminStatCard label="Total scores" value={stats.total} />
        <AdminStatCard label="Public" value={stats.public} />
        <AdminStatCard label="Unlisted" value={stats.unlisted} />
        <AdminStatCard label="Private" value={stats.private} />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-edition-ink">Recent scores</h2>
          {scores.length > 5 ? (
            <Link href="/admin/scores" className="type-nav-link hover:text-edition-ink">
              View all
            </Link>
          ) : null}
        </div>
        {recentScores.length > 0 ? (
          <AdminScoreList scores={recentScores} compact />
        ) : (
          <p className="type-body-md text-edition-muted">No scores yet. Upload your first work.</p>
        )}
      </section>
    </div>
  );
}
