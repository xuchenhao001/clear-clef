import { describe, expect, it } from "vitest";
import { groupScoresByCredit, UNCREDITED_LABEL } from "@/lib/scores/group";

describe("groupScoresByCredit", () => {
  it("groups by credited name and sorts titles within a group", () => {
    const groups = groupScoresByCredit([
      { composer: "Bach", title: "Prelude" },
      { composer: "Bach", title: "Allemande" },
      { composer: "Chopin", title: "Nocturne" },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.credit).toBe("Bach");
    expect(groups[0]?.scores.map((score) => score.title)).toEqual([
      "Allemande",
      "Prelude",
    ]);
    expect(groups[1]?.credit).toBe("Chopin");
  });

  it("places uncredited works last", () => {
    const groups = groupScoresByCredit([
      { composer: null, title: "Untitled" },
      { composer: "Bach", title: "Prelude" },
    ]);

    expect(groups[0]?.credit).toBe("Bach");
    expect(groups[1]?.credit).toBe(UNCREDITED_LABEL);
  });
});
