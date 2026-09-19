import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export default function AdminNotFound() {
  return (
    <div>
      <AdminPageHeader
        title="Page not found"
        description="This admin page does not exist or the score may have been removed."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Not found" }]}
      />
      <Link href="/admin/scores" className={cn(buttonVariants(), "w-fit")}>
        Back to scores
      </Link>
    </div>
  );
}
