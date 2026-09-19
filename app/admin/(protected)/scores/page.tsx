import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { listAdminScores } from "@/lib/scores/admin";
import { cn } from "cn";

function formatCreatedAt(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminScoresPage() {
  const scores = await listAdminScores();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-page-h1">Scores</h1>
          <p className="mt-2 type-body-md text-edition-body">
            Manage catalog metadata, visibility, and score files.
          </p>
        </div>
        <Link href="/admin/upload" className={cn(buttonVariants(), "w-fit")}>
          Upload a score
        </Link>
      </div>

      {scores.length === 0 ? (
        <p className="type-body-md text-edition-muted">No scores yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-edition-hairline bg-edition-surface-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edition-hairline text-edition-muted">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Composer</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">License</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score) => (
                <tr
                  key={score.id}
                  className="border-b border-edition-hairline last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-edition-ink">{score.title}</td>
                  <td className="hidden px-4 py-3 text-edition-body sm:table-cell">
                    {score.composer ?? "—"}
                  </td>
                  <td className="px-4 py-3 capitalize text-edition-body">{score.visibility}</td>
                  <td className="hidden px-4 py-3 text-edition-body md:table-cell">
                    {score.license}
                  </td>
                  <td className="hidden px-4 py-3 text-edition-muted lg:table-cell">
                    {formatCreatedAt(score.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <a
                        href={`/api/admin/scores/${score.id}/file`}
                        className="type-nav-link hover:text-edition-ink"
                      >
                        Download
                      </a>
                      <Link
                        href={`/admin/scores/${score.id}`}
                        className="type-nav-link hover:text-edition-ink"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
