import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type AdminScoreEditSidebarProps = {
  scoreId: string;
  slug: string;
  visibility: string;
  hasPreview: boolean;
};

export function AdminScoreEditSidebar({
  scoreId,
  slug,
  visibility,
  hasPreview,
}: AdminScoreEditSidebarProps) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
      {hasPreview ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-edition-ink">Page 1 preview</p>
          <div className="overflow-hidden rounded-xl border border-edition-hairline bg-edition-surface-page p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only SVG from session-gated API */}
            <img
              src={`/api/admin/scores/${scoreId}/preview`}
              alt=""
              className="mx-auto max-h-56 w-full object-contain"
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-edition-hairline bg-edition-surface-card p-4 space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-edition-muted">
            Public URL
          </p>
          <p className="mt-1 font-mono text-sm text-edition-ink">/scores/{slug}</p>
        </div>
        <div className="flex flex-col gap-2">
          <a
            href={`/api/admin/scores/${scoreId}/file`}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Download original
          </a>
          {visibility === "public" ? (
            <Link
              href={`/scores/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Open public page
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
