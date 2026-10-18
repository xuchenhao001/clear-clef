import Link from "next/link";

type AdminEmptyStateProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

/** Nothing to list: a chapter head and hint links, on the same ground as the index. */
export function AdminEmptyState({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 py-2">
      <p className="type-eyebrow">ClearClef</p>
      <p className="type-page-h1 text-balance">{title}</p>
      <span aria-hidden className="rule-gilt block h-0.5 w-16" />
      <p className="max-w-[46ch] type-body-sm text-edition-body text-pretty">
        {description}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-5">
        <Link href={primaryHref} className="type-hint text-edition-gilt hover:text-edition-ink">
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className="type-hint hover:text-edition-gilt">
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
