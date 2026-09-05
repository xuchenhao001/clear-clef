import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Keep repo AGENTS.md as the product source of truth; Next 16 otherwise appends a generated block on `next dev`.
  agentRules: false,
  images: {
    localPatterns: [
      {
        pathname: "/api/scores/**",
      },
    ],
  },
};

export default nextConfig;

initOpenNextCloudflareForDev({ configPath: "./wrangler.dev.jsonc" });
