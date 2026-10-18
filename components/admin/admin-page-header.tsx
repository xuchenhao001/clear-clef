import { AdminBreadcrumbs, type AdminBreadcrumbItem } from "@/components/admin/admin-breadcrumbs";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: AdminBreadcrumbItem[];
  actions?: React.ReactNode;
};

/**
 * The admin title plate: a slab-caps H1 with the brass title rule, exactly as
 * the public catalog hero is cut. No leaf here — the header sits straight on the
 * map paper, so the plates below it read as leaves laid on the page.
 */
export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <AdminBreadcrumbs items={breadcrumbs} />
        ) : null}
        <h1 className="type-page-h1 text-balance">{title}</h1>
        <span aria-hidden className="rule-gilt mt-3 block h-[3px] w-16" />
        {description ? (
          <p className="mt-3 max-w-2xl type-body-md text-edition-body text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
