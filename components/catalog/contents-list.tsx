import { Link } from "@tanstack/react-router";
import type { PublicCatalogScore } from "@/lib/scores/queries";
import type { CatalogSearch } from "@/lib/catalog/url-state";
import { ContentsRow } from "@/components/catalog/contents-row";

const UNCREDITED_LABEL = "Uncredited";

type ContentsListProps = {
  scores: PublicCatalogScore[];
  search: CatalogSearch;
  grouped: boolean;
};

function groupsByComposer(scores: PublicCatalogScore[]) {
  const map = new Map<string, PublicCatalogScore[]>();
  for (const score of scores) {
    const credit = score.composer?.trim() || UNCREDITED_LABEL;
    const list = map.get(credit) ?? [];
    list.push(score);
    map.set(credit, list);
  }
  return [...map.entries()].map(([credit, items]) => ({ credit, items }));
}

export function ContentsList({ scores, search, grouped }: ContentsListProps) {
  if (!grouped) {
    return (
      <section aria-labelledby="catalog-results">
        <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
          <h2 id="catalog-results" className="type-running-head">
            Results
          </h2>
        </div>
        <ul>
          {scores.map((score) => (
            <ContentsRow
              key={score.id}
              score={score}
              search={search}
              showComposer
            />
          ))}
        </ul>
      </section>
    );
  }

  const groups = groupsByComposer(scores);
  const orderedGroups = [
    ...groups.filter((group) => group.credit !== UNCREDITED_LABEL),
    ...groups.filter((group) => group.credit === UNCREDITED_LABEL),
  ];

  return (
    <section aria-labelledby="catalog-contents">
      <div className="flex items-baseline justify-between gap-4 border-b border-edition-hairline pb-3">
        <h2 id="catalog-contents" className="type-running-head">
          Works
        </h2>
      </div>
      {orderedGroups.map((group) => {
        const composerSlug = group.items[0]?.composerSlug;
        const heading = <span>{group.credit}</span>;

        return (
          <section key={group.credit} className="pt-8">
            <div className="mb-1 flex items-center gap-3">
              <h3 className="type-group-label shrink-0">
                {composerSlug ? (
                  <Link
                    to="/"
                    search={{
                      ...search,
                      composer: [composerSlug],
                      page: undefined,
                    }}
                    className="hover:text-edition-gilt focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
                  >
                    {heading}
                  </Link>
                ) : (
                  heading
                )}
              </h3>
              <span aria-hidden className="h-px flex-1 bg-edition-hairline" />
              <p className="type-extent shrink-0">
                {group.items.length}{" "}
                {group.items.length === 1 ? "work" : "works"}
              </p>
            </div>
            <ul>
              {group.items.map((score) => (
                <ContentsRow key={score.id} score={score} search={search} />
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}
