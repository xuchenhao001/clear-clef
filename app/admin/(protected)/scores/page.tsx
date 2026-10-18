import Link from "next/link";
import { Suspense } from "react";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminScoreList } from "@/components/admin/admin-score-list";
import { AdminScoresFilters } from "@/components/admin/admin-scores-filters";
import { buttonVariants } from "@/components/ui/button";
import {
  filterAdminScores,
  parseAdminScoreListFilters,
} from "@/lib/admin/filters";
import { listAdminScores } from "@/lib/scores/admin";
import { cn } from "cn";

type AdminScoresPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminScoresPage({ searchParams }: AdminScoresPageProps) {
  const params = await searchParams;
  const filters = parseAdminScoreListFilters(params);
  const allScores = await listAdminScores();
  const scores = filterAdminScores(allScores, filters);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Scores"
        description="Filter, open, and maintain catalog entries. Rows link to the edit screen."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Scores" },
        ]}
        actions={
          <Link href="/admin/upload" className={cn(buttonVariants(), "w-fit")}>
            Upload score
          </Link>
        }
      />

      {allScores.length === 0 ? (
        <AdminEmptyState
          title="No scores in the catalog"
          description="Upload a MusicXML file to create the first public catalog entry."
          primaryHref="/admin/upload"
          primaryLabel="Upload score"
        />
      ) : (
        <>
          <Suspense fallback={null}>
            <AdminScoresFilters
              key={`${filters.q ?? ""}-${filters.visibility ?? ""}`}
              current={filters}
            />
          </Suspense>

          {scores.length === 0 ? (
            <AdminEmptyState
              title="No scores match these filters"
              description="Try a different search or clear filters to see the full list."
              primaryHref="/admin/scores"
              primaryLabel="Clear filters"
            />
          ) : (
            <AdminScoreList scores={scores} />
          )}
        </>
      )}
    </div>
  );
}
