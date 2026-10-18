import { describe, expect, it } from "vitest";
import cloudflareConfig from "../cloudflare.config";
import { WORKER_ENV_KEYS } from "@/lib/worker-env-contract";
import {
  betterAuthUrlForMode,
  workerNameForMode,
} from "@/lib/worker-bindings";

type TextBinding = { type: "text"; value: string };
type SecretBinding = { type: "secret" };

function textValue(binding: unknown): string {
  expect(binding).toMatchObject({ type: "text" });
  return (binding as TextBinding).value;
}

describe("cloudflare.config.ts", () => {
  it("maps worker name per mode", async () => {
    for (const mode of ["development", "production", undefined] as const) {
      const config = await cloudflareConfig({ mode, isPreview: false });
      expect(config.worker.name).toBe(workerNameForMode(mode));
    }
  });

  it("maps BETTER_AUTH_URL to worker-bindings per mode", async () => {
    for (const mode of ["development", "production", undefined] as const) {
      const config = await cloudflareConfig({ mode, isPreview: false });
      expect(textValue(config.worker.env.BETTER_AUTH_URL)).toBe(
        betterAuthUrlForMode(mode),
      );
    }
  });

  it("declares BETTER_AUTH_SECRET as a secret binding", async () => {
    const config = await cloudflareConfig({
      mode: "development",
      isPreview: false,
    });
    expect(config.worker.env.BETTER_AUTH_SECRET).toMatchObject({
      type: "secret",
    } satisfies SecretBinding);
  });

  it("declares every key in WORKER_ENV_KEYS", async () => {
    const config = await cloudflareConfig({
      mode: "development",
      isPreview: false,
    });
    for (const key of Object.values(WORKER_ENV_KEYS)) {
      expect(config.worker.env).toHaveProperty(key);
    }
  });

  it("uses localhost auth URL in development mode (cf dev)", async () => {
    const config = await cloudflareConfig({
      mode: "development",
      isPreview: false,
    });
    expect(textValue(config.worker.env.BETTER_AUTH_URL)).toBe(
      "http://localhost:3000",
    );
  });
});
