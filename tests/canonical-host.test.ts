import { describe, expect, it } from "vitest";
import { canonicalHostRedirect } from "@/lib/seo/canonical-host";
import {
  BETTER_AUTH_ALTERNATE_ORIGINS,
  BETTER_AUTH_URL_PRODUCTION,
} from "@/lib/worker-bindings";

describe("canonical host redirect", () => {
  it("redirects public alternate-origin HTML to the canonical domain", () => {
    const alternate = BETTER_AUTH_ALTERNATE_ORIGINS[0]!;
    const response = canonicalHostRedirect(
      new Request(`${alternate}/scores/example?x=1`),
    );
    expect(response?.status).toBe(301);
    expect(response?.headers.get("location")).toBe(
      `${BETTER_AUTH_URL_PRODUCTION}/scores/example?x=1`,
    );
  });

  it("leaves API and admin requests alone", () => {
    const alternate = BETTER_AUTH_ALTERNATE_ORIGINS[0]!;
    expect(canonicalHostRedirect(new Request(`${alternate}/api/scores/x/file`))).toBeNull();
    expect(canonicalHostRedirect(new Request(`${alternate}/admin`))).toBeNull();
  });

  it("leaves other hosts alone", () => {
    expect(canonicalHostRedirect(new Request("http://localhost:3000/"))).toBeNull();
  });
});
