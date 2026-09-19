import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type AdminEmptyStateProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function AdminEmptyState({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: AdminEmptyStateProps) {
  return (
    <div className="rounded-xl border border-edition-hairline bg-edition-surface-card px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-edition-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md type-body-sm text-edition-muted text-pretty">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href={primaryHref} className={cn(buttonVariants(), "w-fit")}>
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
