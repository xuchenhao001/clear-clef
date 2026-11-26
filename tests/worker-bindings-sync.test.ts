import { describe, expect, it } from "vitest";
import * as app from "@/lib/worker-bindings";
import * as node from "../worker-bindings.mjs";

describe("worker-bindings.mjs stays aligned with lib/worker-bindings.ts", () => {
  it("exports the same constants and mode helpers", () => {
    expect(node.D1_DATABASE_ID).toBe(app.D1_DATABASE_ID);
    expect(node.LOCAL_PERSIST_TO).toBe(app.LOCAL_PERSIST_TO);
    expect(node.WORKER_NAME).toBe(app.WORKER_NAME);
    expect(node.BETTER_AUTH_URL_PRODUCTION).toBe(app.BETTER_AUTH_URL_PRODUCTION);
    expect(node.BETTER_AUTH_URL_DEVELOPMENT).toBe(app.BETTER_AUTH_URL_DEVELOPMENT);
    expect(node.BETTER_AUTH_ALTERNATE_ORIGINS).toEqual(
      app.BETTER_AUTH_ALTERNATE_ORIGINS,
    );
    expect(node.publicSiteOrigins()).toEqual(app.publicSiteOrigins());

    for (const mode of ["development", "production", "staging", undefined] as const) {
      expect(node.betterAuthUrlForMode(mode)).toBe(app.betterAuthUrlForMode(mode));
    }
  });
});
