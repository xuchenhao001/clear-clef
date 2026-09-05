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
      <Link
        href="/admin/upload"
        className={cn(buttonVariants(), "w-fit")}
      >
        Upload a score
      </Link>
    </div>
  );
}
