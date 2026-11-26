import { describe, expect, it } from "vitest";
import {
  BETTER_AUTH_URL_DEVELOPMENT,
  BETTER_AUTH_URL_PRODUCTION,
  betterAuthUrlForMode,
} from "@/lib/worker-bindings";

describe("betterAuthUrlForMode", () => {
  it("uses localhost for cf dev", () => {
    expect(betterAuthUrlForMode("development")).toBe(BETTER_AUTH_URL_DEVELOPMENT);
  });

  it("uses production workers URL for build/deploy modes", () => {
    expect(betterAuthUrlForMode("production")).toBe(BETTER_AUTH_URL_PRODUCTION);
    expect(betterAuthUrlForMode(undefined)).toBe(BETTER_AUTH_URL_PRODUCTION);
    expect(betterAuthUrlForMode("staging")).toBe(BETTER_AUTH_URL_PRODUCTION);
  });
});
