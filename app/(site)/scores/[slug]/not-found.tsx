import { BackToCatalog } from "@/components/catalog/back-to-catalog";

export default function ScoreNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 py-16">
      <h1 className="type-page-h1">Score not found</h1>
      <p className="type-body-md text-edition-body">
        This score is private, unlisted, or does not exist.
      </p>
      <BackToCatalog className="w-fit" />
    </div>
  );
}
