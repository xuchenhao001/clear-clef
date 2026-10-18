import { describe, expect, it } from "vitest";
import { publicDocumentRequest } from "@/lib/cache/public-document";

describe("publicDocumentRequest", () => {
  it("caches the unfiltered catalog", () => {
    const key = publicDocumentRequest(new Request("https://clear-clef.example/"));
    expect(key?.url).toBe("https://clear-clef.example/");
  });

  it("skips filtered catalog urls", () => {
    expect(
      publicDocumentRequest(new Request("https://clear-clef.example/?key=C")),
    ).toBeNull();
  });

  it("caches a score page without its query string", () => {
    const key = publicDocumentRequest(
      new Request("https://clear-clef.example/scores/nocturne?uploaded=1"),
    );
    expect(key?.url).toBe("https://clear-clef.example/scores/nocturne");
  });

  it("skips admin and api paths", () => {
    expect(
      publicDocumentRequest(new Request("https://clear-clef.example/admin")),
    ).toBeNull();
    expect(
      publicDocumentRequest(
        new Request("https://clear-clef.example/api/scores/1/file"),
      ),
    ).toBeNull();
  });
});
