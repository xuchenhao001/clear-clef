import { describe, expect, it } from "vitest";
import {
  parseAdminPatchFormData,
  parseAdminUploadFormData,
  parseTagList,
} from "@/lib/ingest/admin-form";

describe("admin form parsing", () => {
  it("parses comma-separated tags", () => {
    expect(parseTagList("bach, etude , ")).toEqual(["bach", "etude"]);
  });

  it("parses upload fields", () => {
    const formData = new FormData();
    formData.set("license", "CC0");
    formData.set("visibility", "unlisted");
    formData.set("tags", "bach, etude");
    formData.set("catalogNumber", "BWV 1");
    formData.set("sourceUrl", "https://example.com");

    expect(parseAdminUploadFormData(formData)).toEqual({
      license: "CC0",
      visibility: "unlisted",
      tagList: ["bach", "etude"],
      catalogNumber: "BWV 1",
      sourceUrl: "https://example.com",
    });
  });

  it("parses patch metadata fields", () => {
    const formData = new FormData();
    formData.set("title", "New title");
    formData.set("license", "Public Domain");
    formData.set("visibility", "public");
    formData.set("composer", "Composer");
    formData.set("difficulty", "intermediate");

    expect(parseAdminPatchFormData(formData)).toMatchObject({
      title: "New title",
      composer: "Composer",
      difficulty: "intermediate",
      visibility: "public",
    });
  });
});
