import { BackToCatalog } from "@/components/catalog/back-to-catalog";
import { MarbledPanel } from "@/components/catalog/marbled-panel";
import { PublicShell } from "@/components/public-shell";

export default function NotFound() {
  return (
    <PublicShell
      mainClassName="mx-auto w-full max-w-[1200px] gap-4 px-6 py-16"
    >
      <MarbledPanel className="mx-auto w-full max-w-2xl rounded-lg border border-edition-hairline p-5 shadow-leaf sm:p-8">
        <div className="surface-leaf shadow-leaf flex flex-col items-center gap-3 rounded-md px-6 py-10 text-center">
          <p className="type-imprint">ClearClef</p>
          <h1 className="type-page-h1">Page not found</h1>
          <p className="type-body-md max-w-[46ch] text-edition-body">
            This page does not exist or has moved.
          </p>
          <BackToCatalog className="mt-2 w-fit" />
        </div>
      </MarbledPanel>
    </PublicShell>
  );
}
