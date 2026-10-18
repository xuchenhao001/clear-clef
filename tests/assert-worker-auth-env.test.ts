import { describe, expect, it } from "vitest";
import { assertWorkerAuthEnv } from "@/lib/assert-worker-auth-env";

const validSecret = "test-secret-with-at-least-32-characters";

describe("assertWorkerAuthEnv", () => {
  it("passes for loopback base URL in development", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    expect(() =>
      assertWorkerAuthEnv({
        BETTER_AUTH_SECRET: validSecret,
        BETTER_AUTH_URL: "http://localhost:3000",
      }),
    ).not.toThrow();
    process.env.NODE_ENV = prev;
  });

  it("rejects deployed URL in development", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    expect(() =>
      assertWorkerAuthEnv({
        BETTER_AUTH_SECRET: validSecret,
        BETTER_AUTH_URL: "https://clear-clef.xu-chenhao.workers.dev",
      }),
    ).toThrow(/pnpm dev expects a loopback URL/);
    process.env.NODE_ENV = prev;
  });

  it("rejects missing secret with binding hint", () => {
    expect(() =>
      assertWorkerAuthEnv({
        BETTER_AUTH_URL: "http://localhost:3000",
      }),
    ).toThrow(/bindings\.secret\(\)/);
  });
});
