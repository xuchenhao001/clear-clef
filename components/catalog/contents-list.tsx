import type { PublicCatalogScore } from "@/lib/scores/queries";
import { groupScoresByCredit } from "@/lib/scores/group";
import { ContentsRow } from "@/components/catalog/contents-row";
import { Fleuron } from "@/components/ui/fleuron";

type ContentsListProps = {
  scores: PublicCatalogScore[];
};

export function ContentsList({ scores }: ContentsListProps) {
  const groups = groupScoresByCredit(scores);
  const total = scores.length;

  return (
    <section className="mt-4" aria-labelledby="catalog-contents">
      <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
        <h2 id="catalog-contents" className="type-running-head">
          Works
        </h2>
        <p className="type-extent">
          {total} {total === 1 ? "work" : "works"}
        </p>
      </div>
      {groups.map((group) => (
        <section key={group.credit} className="pt-8">
          <div className="mb-1 flex items-center gap-3">
            <h3 className="type-group-label shrink-0">{group.credit}</h3>
            <span aria-hidden className="h-px flex-1 bg-edition-hairline" />
            <p className="type-extent shrink-0">
              {group.scores.length}{" "}
              {group.scores.length === 1 ? "work" : "works"}
            </p>
          </div>
          <ul>
            {group.scores.map((score) => (
              <ContentsRow key={score.id} score={score} />
            ))}
          </ul>
        </section>
      ))}
      <div
        aria-hidden
        className="mt-8 flex items-center justify-center gap-3 text-edition-gilt"
      >
        <span className="h-px w-10 bg-edition-hairline-strong" />
        <Fleuron className="w-4" />
        <span className="h-px w-10 bg-edition-hairline-strong" />
      </div>
    </section>
  );
}
