export const UNCREDITED_LABEL = "Uncredited";

export type GroupableScore = {
  composer: string | null;
  title: string;
};

export type ScoreGroup<T extends GroupableScore> = {
  credit: string;
  scores: T[];
};

export function groupScoresByCredit<T extends GroupableScore>(
  scores: T[],
): ScoreGroup<T>[] {
  const map = new Map<string, T[]>();

  for (const score of scores) {
    const credit = score.composer?.trim() || UNCREDITED_LABEL;
    const existing = map.get(credit);
    if (existing) {
      existing.push(score);
    } else {
      map.set(credit, [score]);
    }
  }

  const groups = [...map.entries()].map(([credit, groupScores]) => ({
    credit,
    scores: [...groupScores].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    ),
  }));

  groups.sort((a, b) => {
    if (a.credit === UNCREDITED_LABEL) {
      return 1;
    }
    if (b.credit === UNCREDITED_LABEL) {
      return -1;
    }
    return a.credit.localeCompare(b.credit, undefined, { sensitivity: "base" });
  });

  return groups;
}
