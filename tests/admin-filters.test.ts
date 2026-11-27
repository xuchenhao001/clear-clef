import { describe, expect, it } from "vitest";
import {
  formatAdminScoresSearchPath,
  parseAdminScoreListFilters,
} from "@/lib/admin/filters";
import {
  formatAdminComposerCreditSearch,
  parseAdminComposerCreditSearch,
} from "@/lib/admin/composer-credit";

describe("parseAdminScoreListFilters", () => {
  it("normalizes visibility, query, import and page", () => {
    expect(parseAdminScoreListFilters({})).toEqual({});
    expect(
      parseAdminScoreListFilters({ visibility: "public", q: "  bach  " }),
    ).toEqual({ visibility: "public", q: "bach" });
    expect(parseAdminScoreListFilters({ visibility: "invalid" })).toEqual({});
    expect(
      parseAdminScoreListFilters({
        visibility: "private",
        import: "6a5d4e3c-1234-4abc-9def-1234567890ab",
        page: "3",
      }),
    ).toEqual({
      visibility: "private",
      import: "6a5d4e3c-1234-4abc-9def-1234567890ab",
      page: 3,
    });
    expect(parseAdminScoreListFilters({ page: "0" })).toEqual({});
    expect(parseAdminScoreListFilters({ import: "bad" })).toEqual({});
    expect(
      parseAdminScoreListFilters({ composer: "composer-chopin" }),
    ).toEqual({ composer: "composer-chopin" });
    expect(parseAdminScoreListFilters({ composer: "bad id" })).toEqual({});
  });
});

describe("formatAdminScoresSearchPath", () => {
  it("builds stable admin scores URLs and preserves pagination", () => {
    expect(formatAdminScoresSearchPath({})).toBe("/admin/scores");
    expect(formatAdminScoresSearchPath({ q: "  bach  " })).toBe(
      "/admin/scores?q=bach",
    );
    expect(
      formatAdminScoresSearchPath({ visibility: "private", q: "etude" }),
    ).toBe("/admin/scores?visibility=private&q=etude");
    expect(
      formatAdminScoresSearchPath({
        visibility: "private",
        q: "etude",
        import: "6a5d4e3c-1234-4abc-9def-1234567890ab",
        page: 2,
      }),
    ).toBe(
      "/admin/scores?visibility=private&q=etude&import=6a5d4e3c-1234-4abc-9def-1234567890ab&page=2",
    );
    expect(
      formatAdminScoresSearchPath({ composer: "composer-chopin" }),
    ).toBe("/admin/scores?composer=composer-chopin");
  });
});

describe("composer credit search", () => {
  it("defaults to the unassigned queue and preserves filters", () => {
    expect(parseAdminComposerCreditSearch({})).toEqual({ view: "unassigned" });
    expect(
      parseAdminComposerCreditSearch({
        view: "authority",
        composerQ: "  chopin ",
        page: "2",
      }),
    ).toEqual({ view: "authority", composerQ: "chopin", page: 2 });
    expect(
      formatAdminComposerCreditSearch({
        view: "authority",
        composerQ: "chopin",
        page: 2,
      }),
    ).toBe("/admin/composers?view=authority&composerQ=chopin&page=2");
    expect(formatAdminComposerCreditSearch({ view: "unassigned" })).toBe(
      "/admin/composers",
    );
  });
});
