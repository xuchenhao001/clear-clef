import { Link } from "@tanstack/react-router";
import { cn } from "cn";

export type AdminBreadcrumbItem = {
  label: string;
  href?: string;
};

type AdminBreadcrumbsProps = {
  items: AdminBreadcrumbItem[];
};

/** Slab-caps trail, the same imprint type as the running heads below it. */
export function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-2 type-imprint">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden className="text-edition-muted-soft">
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="edition-interactive-transition hover:text-edition-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn("max-w-[16rem] truncate", isLast && "text-edition-ink")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
