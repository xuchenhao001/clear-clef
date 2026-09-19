import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminUploadForm } from "@/components/admin/AdminUploadForm";

export default function AdminUploadPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Upload score"
        description="Add a MusicXML file to the catalog. We store the original and a sanitized copy, then build a page-1 preview in your browser."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Upload" },
        ]}
      />
      <AdminUploadForm />
    </div>
  );
}
