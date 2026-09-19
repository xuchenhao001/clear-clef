import { cn } from "cn";

type AdminVisibilityBadgeProps = {
  visibility: string;
  className?: string;
};

const labels: Record<string, string> = {
  public: "Public",
  unlisted: "Unlisted",
  private: "Private",
};

export function AdminVisibilityBadge({ visibility, className }: AdminVisibilityBadgeProps) {
  const label = labels[visibility] ?? visibility;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-edition-hairline px-2 py-0.5 text-xs font-medium text-edition-body",
        className,
      )}
    >
      {label}
    </span>
  );
}
