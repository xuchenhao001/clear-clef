import { Link, createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminUploadForm } from "@/components/admin/AdminUploadForm";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const Route = createFileRoute("/admin/_protected/upload")({
  component: AdminUploadPage,
});

function AdminUploadPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Upload score"
        description="Add a MusicXML file to the catalog. We store the original and a sanitized copy, then build a page-1 preview in your browser."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Upload" },
        ]}
        actions={
          <Link
            to="/admin/batch-upload"
            className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
          >
            Batch upload
          </Link>
        }
      />
      <AdminUploadForm />
    </div>
  );
}
