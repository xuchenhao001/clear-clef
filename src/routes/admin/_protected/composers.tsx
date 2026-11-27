import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminComposerMergeForm } from "@/components/admin/admin-composer-merge-form";
import { AdminFixSlugsButton } from "@/components/admin/admin-fix-slugs-button";
import { AdminReindexButton } from "@/components/admin/admin-reindex-button";
import { loadAdminComposers } from "@/src/server/admin";

export const Route = createFileRoute("/admin/_protected/composers")({
  loader: () => loadAdminComposers(),
  component: AdminComposersPage,
});

function AdminComposersPage() {
  const composers = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Composers"
        description="Authority records used for grouping and search. Known name variants are merged here."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Composers" }]}
        actions={
          <div className="flex flex-wrap gap-3">
            <AdminFixSlugsButton />
            <AdminReindexButton />
          </div>
        }
      />
      {composers.length === 0 ? (
        <p className="type-body-sm text-edition-muted">
          No composer records yet. They are created when scores are uploaded or edited.
        </p>
      ) : (
        <>
          <AdminComposerMergeForm composers={composers} />
          <section aria-labelledby="admin-composer-list">
            <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
              <h2 id="admin-composer-list" className="type-running-head">
                Authority file
              </h2>
              <p className="type-extent">{composers.length} records</p>
            </div>
            <ul>
              {composers.map((composer) => (
                <li
                  key={composer.id}
                  className="border-b border-edition-hairline-soft py-3.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="type-row-title">{composer.displayName}</p>
                    <p className="type-shelf">
                      {composer.scoreCount}{" "}
                      {composer.scoreCount === 1 ? "score" : "scores"}
                    </p>
                  </div>
                  <p className="mt-1 type-shelf">
                    {composer.sortName}
                    {composer.birthYear && composer.deathYear
                      ? ` · ${composer.birthYear}–${composer.deathYear}`
                      : ""}
                    {composer.aliases.length > 0
                      ? ` · aliases: ${composer.aliases.join(", ")}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
