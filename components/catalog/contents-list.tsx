import type { PublicCatalogScore } from "@/lib/scores/queries";
import { groupScoresByCredit } from "@/lib/scores/group";
import { ContentsRow } from "@/components/catalog/contents-row";
import { Fleuron } from "@/components/ui/fleuron";
import { cn } from "cn";

type ContentsListProps = {
  scores: PublicCatalogScore[];
};

export function ContentsList({ scores }: ContentsListProps) {
  const groups = groupScoresByCredit(scores);
  const total = scores.length;

  return (
    <div className="surface-leaf shadow-leaf mt-2 overflow-hidden rounded-lg border border-edition-hairline">
      <div className="rule-printed flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
        <span className="type-running-head">Contents</span>
        <span className="type-running-head">
          {total} {total === 1 ? "work" : "works"}
        </span>
      </div>
      {groups.map((group, groupIndex) => (
        <section
          key={group.credit}
          className="border-b border-edition-hairline last:border-b-0"
        >
          <div
            className={cn(
              "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pb-3",
              groupIndex === 0 ? "pt-5" : "pt-8",
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
      <div
        aria-hidden
        className="flex items-center justify-center gap-3 px-4 py-5 text-edition-locator"
      >
        <span className="h-px w-10 bg-edition-hairline-strong" />
        <Fleuron className="w-5" />
        <span className="h-px w-10 bg-edition-hairline-strong" />
      </div>
    </div>
  );
}
