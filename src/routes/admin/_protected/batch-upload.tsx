import { Link, createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminBatchUpload } from "@/components/admin/batch/admin-batch-upload";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const Route = createFileRoute("/admin/_protected/batch-upload")({
  component: AdminBatchUploadPage,
});

function AdminBatchUploadPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Batch upload"
        description="Add a folder of MusicXML files, review what the catalog read, then upload them in one run. Page-1 previews are drawn in this browser."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Batch upload" },
        ]}
        actions={
          <Link
            to="/admin/upload"
            className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
          >
            Upload one score
          </Link>
        }
      />
      <AdminBatchUpload />
    </div>
  );
}
