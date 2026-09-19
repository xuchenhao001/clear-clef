import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="type-page-h1">Admin</h1>
        <p className="mt-2 type-body-md text-edition-body">
          Upload scores and manage the public catalog.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/scores" className={cn(buttonVariants(), "w-fit")}>
          Manage scores
        </Link>
        <Link
          href="/admin/upload"
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Upload a score
        </Link>
      </div>
    </div>
  );
}
