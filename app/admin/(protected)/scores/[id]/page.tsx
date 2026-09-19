import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminScoreEditForm } from "@/components/admin/AdminScoreEditForm";
import { buttonVariants } from "@/components/ui/button";
import { getAdminScoreById } from "@/lib/scores/admin";
import { cn } from "cn";

export default async function AdminScoreEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const score = await getAdminScoreById(id);
  if (!score) {
    notFound();
  }

  const tagsValue = score.tags.map((tag) => tag.label).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="type-page-h1">Edit score</h1>
          <p className="mt-2 type-body-md text-edition-body">{score.title}</p>
        </div>
        <Link
          href="/admin/scores"
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Back to scores
        </Link>
      </div>
      <AdminScoreEditForm
        scoreId={score.id}
        slug={score.slug}
        initial={{
          title: score.title,
          composer: score.composer ?? "",
          lyricist: score.lyricist ?? "",
          catalogNumber: score.catalogNumber ?? "",
          license: score.license,
          key: score.key ?? "",
          timeSignature: score.timeSignature ?? "",
          difficulty: score.difficulty ?? "",
          visibility: score.visibility as "public" | "unlisted" | "private",
          sourceUrl: score.sourceUrl ?? "",
          tags: tagsValue,
        }}
        hasPreview={Boolean(score.previewR2Key)}
      />
    </div>
  );
}
