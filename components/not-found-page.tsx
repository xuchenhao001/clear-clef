import { BackToCatalog } from "@/components/catalog/back-to-catalog";
import { PublicShell } from "@/components/public-shell";

export function NotFoundPage() {
  return (
    <PublicShell mainClassName="mx-auto w-full max-w-[1200px] px-6 py-16">
      <p className="type-eyebrow">ClearClef</p>
      <h1 className="type-masthead-sm mt-3">Page not found</h1>
      <span aria-hidden className="rule-gilt mt-4 block h-0.5 w-16" />
      <p className="type-body-md mt-4 max-w-[46ch] text-edition-body">
        This page does not exist or has moved.
      </p>
      <BackToCatalog className="mt-6 inline-flex" />
    </PublicShell>
  );
}
