import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    ".cloudflare/output/**",
    "dist/**",
    "drizzle/**",
    "src/routeTree.gen.ts",
    "scripts/**",
    "tools/**",
  ]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
