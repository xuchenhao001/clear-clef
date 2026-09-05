import { BackToCatalog } from "@/components/catalog/back-to-catalog";
import { PublicShell } from "@/components/public-shell";

export default function NotFound() {
  return (
    <PublicShell
      mainClassName="mx-auto w-full max-w-[1200px] gap-4 px-6 py-16"
    >
      <h1 className="type-page-h1">Page not found</h1>
      <p className="type-body-md text-edition-body">
        This page does not exist or has moved.
      </p>
      <BackToCatalog className="w-fit" />
    </PublicShell>
  );
}
