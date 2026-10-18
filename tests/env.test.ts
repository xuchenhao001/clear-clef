import { afterEach, describe, expect, it } from "vitest";
import { resolveAuthEnv } from "@/lib/env";

describe("resolveAuthEnv", () => {
  const originalSecret = process.env.BETTER_AUTH_SECRET;
  const originalUrl = process.env.BETTER_AUTH_URL;

  afterEach(() => {
    process.env.BETTER_AUTH_SECRET = originalSecret;
    process.env.BETTER_AUTH_URL = originalUrl;
  });

  it("prefers Cloudflare env over process.env", () => {
    process.env.BETTER_AUTH_SECRET = "process-env-secret-is-too-short";
    process.env.BETTER_AUTH_URL = "http://process.example";

    const resolved = resolveAuthEnv({
      BETTER_AUTH_SECRET: "cloudflare-secret-with-enough-length-123456",
      BETTER_AUTH_URL: "http://cloudflare.example",
    });

    expect(resolved.secret).toBe(
      "cloudflare-secret-with-enough-length-123456",
    );
    expect(resolved.baseURL).toBe("http://cloudflare.example");
  });

  it("falls back to process.env when Cloudflare env is absent", () => {
    process.env.BETTER_AUTH_SECRET =
      "process-env-secret-with-enough-length-1234";
    process.env.BETTER_AUTH_URL = "http://localhost:4000";

    const resolved = resolveAuthEnv();

    expect(resolved.secret).toBe(
      "process-env-secret-with-enough-length-1234",
    );
    expect(resolved.baseURL).toBe("http://localhost:4000");
  });

  it("rejects secrets shorter than 32 characters", () => {
    expect(() =>
      resolveAuthEnv({ BETTER_AUTH_SECRET: "too-short" }),
    ).toThrow(/BETTER_AUTH_SECRET.*32 characters|too short on Worker env/);
  });
});
