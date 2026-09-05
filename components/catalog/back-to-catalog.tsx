import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type BackToCatalogProps = {
  className?: string;
};

export function BackToCatalog({ className }: BackToCatalogProps) {
  return (
    <Link
      href="/"
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
    >
      Back to catalog
    </Link>
  );
}
