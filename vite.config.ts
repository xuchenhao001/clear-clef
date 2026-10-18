import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { LOCAL_PERSIST_TO } from "./worker-bindings.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": root,
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    cloudflare({
      persistState: { path: LOCAL_PERSIST_TO },
      viteEnvironment: { name: "ssr" },
      types: { includeRuntime: false },
    }),
  ],
});
