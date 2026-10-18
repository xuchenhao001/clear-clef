import Link from "next/link";
import { cn } from "cn";

type BackToCatalogProps = {
  className?: string;
};

export function BackToCatalog({ className }: BackToCatalogProps) {
  return (
    <Link
      href="/"
      className={cn(
        "type-hint edition-interactive-transition hover:text-edition-gilt focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring",
        className,
      )}
    >
      Back
    </Link>
  );
}
