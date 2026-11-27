import { describe, expect, it } from "vitest";
import { catalogHead, escapeJsonLd, scoreHead } from "@/lib/seo/site";

describe("catalog SEO head", () => {
  it("indexes default browse and emits a canonical URL", () => {
    const head = catalogHead({
      search: {},
      totalPublic: 81,
      page: 1,
      pageCount: 3,
    });
    expect(head.meta).toEqual(
      expect.arrayContaining([
        { name: "robots", content: "index, follow" },
        { property: "og:type", content: "website" },
      ]),
    );
    expect(head.links).toEqual(
      expect.arrayContaining([{ rel: "canonical", href: expect.stringMatching(/\/$/) }]),
    );
  });

  it("noindexes search and filtered pages without a canonical", () => {
    const head = catalogHead({
      search: { q: "chopin", key: ["c-sharp-minor"] },
      totalPublic: 81,
      page: 1,
      pageCount: 1,
    });
    expect(head.meta).toEqual(
      expect.arrayContaining([{ name: "robots", content: "noindex, follow" }]),
    );
    expect(head.links.some((link) => link.rel === "canonical")).toBe(false);
  });

  it("self-canonicalizes paginated browse and links prev/next", () => {
    const head = catalogHead({
      search: { page: 2 },
      totalPublic: 81,
      page: 2,
      pageCount: 3,
    });
    expect(head.links).toEqual(
      expect.arrayContaining([
        { rel: "canonical", href: expect.stringContaining("page=2") },
        { rel: "prev", href: expect.not.stringContaining("page=2") },
        { rel: "next", href: expect.stringContaining("page=3") },
      ]),
    );
  });

  it("builds score metadata and safe JSON-LD", () => {
    const head = scoreHead({
      title: "Canon <D>",
      composer: "Johann Pachelbel",
      license: "Public Domain",
      key: "D major",
      keyLabel: "D major",
      catalogNumber: "Pachelbel Canon",
      difficulty: "beginner",
      slug: "canon-in-d",
      previewUrl: null,
    });
    expect(head.meta).toEqual(
      expect.arrayContaining([
        { name: "robots", content: "index, follow" },
        { property: "og:type", content: "music.song" },
      ]),
    );
    const jsonLd = head.scripts[0]?.children ?? "";
    expect(jsonLd).toContain("MusicComposition");
    expect(jsonLd).toContain("\\u003cD\\u003e");
    expect(escapeJsonLd({ value: "</script>" })).not.toContain("</script>");
  });
});
