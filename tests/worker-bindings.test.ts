import { describe, expect, it } from "vitest";
import {
  BETTER_AUTH_URL_DEVELOPMENT,
  BETTER_AUTH_URL_PRODUCTION,
  BETTER_AUTH_URL_STAGING,
  betterAuthUrlForMode,
  workerNameForMode,
  WORKER_NAME_PRODUCTION,
  WORKER_NAME_STAGING,
} from "@/lib/worker-bindings";

describe("betterAuthUrlForMode", () => {
  it("uses localhost for cf dev", () => {
    expect(betterAuthUrlForMode("development")).toBe(BETTER_AUTH_URL_DEVELOPMENT);
  });

  it("uses staging workers URL", () => {
    expect(betterAuthUrlForMode("staging")).toBe(BETTER_AUTH_URL_STAGING);
  });

  it("uses production workers URL for build/deploy modes", () => {
    expect(betterAuthUrlForMode("production")).toBe(BETTER_AUTH_URL_PRODUCTION);
    expect(betterAuthUrlForMode(undefined)).toBe(BETTER_AUTH_URL_PRODUCTION);
  });
});

describe("workerNameForMode", () => {
  it("uses staging worker only for staging mode", () => {
    expect(workerNameForMode("staging")).toBe(WORKER_NAME_STAGING);
    expect(workerNameForMode("development")).toBe(WORKER_NAME_PRODUCTION);
    expect(workerNameForMode("production")).toBe(WORKER_NAME_PRODUCTION);
    expect(workerNameForMode(undefined)).toBe(WORKER_NAME_PRODUCTION);
  });
});
