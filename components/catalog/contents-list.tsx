import type { PublicCatalogScore } from "@/lib/scores/queries";
import { groupScoresByCredit } from "@/lib/scores/group";
import { ContentsRow } from "@/components/catalog/contents-row";

type ContentsListProps = {
  scores: PublicCatalogScore[];
};

export function ContentsList({ scores }: ContentsListProps) {
  const groups = groupScoresByCredit(scores);

  return (
    <div className="border-y border-edition-hairline">
      {groups.map((group) => (
        <section key={group.credit} className="border-b border-edition-hairline last:border-b-0">
          <h2 className="type-group-label px-0 pt-8 pb-3">{group.credit}</h2>
          <ul className="divide-y divide-edition-hairline">
            {group.scores.map((score) => (
              <ContentsRow key={score.id} score={score} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
