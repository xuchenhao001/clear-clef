import { AdminUploadForm } from "@/components/admin/AdminUploadForm";

export default function AdminUploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Upload score</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Upload MusicXML, store canonical files in R2, and generate a page-1 SVG
          preview in the browser.
        </p>
      </div>
      <AdminUploadForm />
    </div>
  );
}
