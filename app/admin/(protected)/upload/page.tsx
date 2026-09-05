import { AdminUploadForm } from "@/components/admin/AdminUploadForm";

export default function AdminUploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="type-page-h1">Upload score</h1>
        <p className="mt-2 type-body-md text-edition-body">
          Upload MusicXML, store canonical files in R2, and generate a page-1
          preview in the browser.
        </p>
      </div>
      <AdminUploadForm />
    </div>
  );
}
