import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { Plate, PlateHead } from "@/components/ui/plate";

type AdminScoreEditSidebarProps = {
  scoreId: string;
  slug: string;
  visibility: string;
  hasPreview: boolean;
};

/** The edit screen's margin: the page-1 preview and the entry's public facts. */
export function AdminScoreEditSidebar({
  scoreId,
  slug,
  visibility,
  hasPreview,
}: AdminScoreEditSidebarProps) {
  return (
    <aside className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
      {hasPreview ? (
        <Plate>
          <PlateHead label="Page 1 preview" />
          <div className="p-4">
            <div className="rounded-md border border-edition-hairline-strong bg-edition-surface-strong p-1">
              <div className="overflow-hidden rounded-sm bg-edition-surface-page p-1">
                {/* Admin-only SVG from session-gated API */}
                <img
                  src={`/api/admin/scores/${scoreId}/preview`}
                  alt=""
                  className="mx-auto max-h-56 w-full object-contain"
                />
              </div>
            </div>
          </div>
        </Plate>
      ) : null}

      <Plate>
        <PlateHead label="Entry" />
        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <p className="type-label">Public URL</p>
            <p className="mt-1 break-all type-caption-mono text-edition-ink">
              /scores/{slug}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <a
              href={`/api/admin/scores/${scoreId}/file`}
              className={buttonVariants({ variant: "outline" })}
            >
              Download original
            </a>
            {visibility === "public" ? (
              <Link
                to="/scores/$slug"
                params={{ slug }}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline" })}
              >
                Open public page
              </Link>
            ) : null}
          </div>
        </div>
      </Plate>
    </aside>
  );
}
