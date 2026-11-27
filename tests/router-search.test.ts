import { describe, expect, it } from "vitest";
import { parseSearch, stringifySearch } from "@/lib/router-search";

describe("router search serialization", () => {
  it("keeps repeated facet params as arrays", () => {
    expect(parseSearch("?key=a-minor&key=c-major&q=nocturne")).toEqual({
      key: ["a-minor", "c-major"],
      q: "nocturne",
    });
  });

  it("serializes arrays as repeated params and skips empty values", () => {
    expect(
      stringifySearch({
        key: ["a-minor", "c-major"],
        q: "nocturne",
        page: undefined,
      }),
    ).toBe("?key=a-minor&key=c-major&q=nocturne");
  });

  it("handles an empty search", () => {
    expect(parseSearch("")).toEqual({});
    expect(stringifySearch({})).toBe("");
  });
});
