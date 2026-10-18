import { BackToCatalog } from "@/components/catalog/back-to-catalog";

export default function ScoreNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col px-6 py-16">
      <p className="type-eyebrow">ClearClef</p>
      <h1 className="type-masthead-sm mt-3">Score not found</h1>
      <span aria-hidden className="rule-gilt mt-4 block h-0.5 w-16" />
      <p className="type-body-md mt-4 max-w-[46ch] text-edition-body">
        This score is private, unlisted, or does not exist.
      </p>
      <BackToCatalog className="mt-6 inline-flex" />
    </div>
  );
}
