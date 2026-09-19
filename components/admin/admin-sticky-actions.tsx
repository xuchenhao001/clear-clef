import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type AdminStickyActionsProps = {
  pending: boolean;
  backHref: string;
  submitLabel?: string;
  pendingLabel?: string;
};

export function AdminStickyActions({
  pending,
  backHref,
  submitLabel = "Save changes",
  pendingLabel = "Saving…",
}: AdminStickyActionsProps) {
  return (
    <div
      className="sticky bottom-0 z-10 -mx-6 border-t border-edition-hairline bg-edition-canvas/95 px-6 py-4 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
        <Link
          href={backHref}
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
