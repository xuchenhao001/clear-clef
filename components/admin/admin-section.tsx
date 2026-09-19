import { cn } from "cn";

type AdminSectionProps = {
  legend: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function AdminSection({
  legend,
  description,
  children,
  className,
}: AdminSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-edition-hairline bg-edition-surface-card p-6",
        className,
      )}
    >
      <div className="mb-5 space-y-1">
        <h2 className="text-sm font-semibold text-edition-ink">{legend}</h2>
        {description ? (
          <p className="type-body-sm text-edition-muted">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
