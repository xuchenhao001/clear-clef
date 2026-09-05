import type { PublicCatalogScore } from "@/lib/scores/queries";
import { groupScoresByCredit } from "@/lib/scores/group";
import { ContentsRow } from "@/components/catalog/contents-row";
import { cn } from "cn";

type ContentsListProps = {
  scores: PublicCatalogScore[];
};

export function ContentsList({ scores }: ContentsListProps) {
  const groups = groupScoresByCredit(scores);

  return (
    <div className="border-b border-edition-hairline">
      {groups.map((group, groupIndex) => (
        <section
          key={group.credit}
          className="border-b border-edition-hairline last:border-b-0"
        >
          <h2
            className={cn(
              "type-group-label px-4 pb-4",
              groupIndex === 0 ? "pt-6" : "pt-8",
            )}
          >
            {group.credit}
          </h2>
          <ul>
            {group.scores.map((score) => (
              <ContentsRow key={score.id} score={score} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
