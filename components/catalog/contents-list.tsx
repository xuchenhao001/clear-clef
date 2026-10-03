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
    <div className="mt-2 overflow-hidden rounded-lg border border-edition-hairline bg-edition-surface-card shadow-md">
      {groups.map((group, groupIndex) => (
        <section
          key={group.credit}
          className="border-b border-edition-hairline last:border-b-0"
        >
          <div
            className={cn(
              "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pb-3",
              groupIndex === 0 ? "pt-6" : "pt-8",
            )}
          >
            <h2 className="type-group-label">{group.credit}</h2>
            <p className="type-extent">
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
    </div>
  );
}
