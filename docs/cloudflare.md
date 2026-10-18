# Cloudflare (`cf` CLI)

ClearClef uses the native **`cf`** workflow: one **`cloudflare.config.ts`**, no Wrangler config.

## Layout

| File | Role |
| --- | --- |
| `cloudflare.config.ts` | Worker name, entrypoint, bindings (`defineConfig` + `ctx.mode`) |
| `lib/worker-bindings.ts` | Binding constants for Worker/app code (bundled) |
| `worker-bindings.mjs` | Node-only mirror for config, Vite, and `scripts/*` (keep in sync with `.ts`) |
| `vite.config.ts` | TanStack Start + `@cloudflare/vite-plugin@2` (reads config at build/dev) |
| `.dev.vars` | Local **secrets** only (`BETTER_AUTH_SECRET`) |
| `.cloudflare/types/` | Generated `Env` types (`pnpm cf-typegen`) |
| `.cloudflare/output/` | Build output for `cf deploy --prebuilt` (gitignored) |
| `.cloudflare/state/` | Local D1/R2 persist (gitignored) |

## Commands

| Script | Runs |
| --- | --- |
| `pnpm dev` | `cf dev` → Vite in **`development`** mode (`persistState`: `.cloudflare/state`) |
| `pnpm build` | `tsc` + `cf build` → `.cloudflare/output/` |
| `pnpm deploy` | `pnpm build` + `cf deploy --prebuilt` |
| `pnpm deploy:staging` | same with `--mode staging` |
| `pnpm db:migrate:local` | D1 migrations into `.cloudflare/state` |
| `pnpm cf-typegen` | Refresh `.cloudflare/types/index.d.ts` |

`cf deploy` does **not** run `package.json` `build` by itself; use `pnpm deploy` so typecheck + `cf build` run first.

## Modes (`ctx.mode`)

| Mode | Typical command | Worker | `BETTER_AUTH_URL` |
| --- | --- | --- | --- |
| `development` | `pnpm dev` | `clear-clef` | `http://localhost:3000` |
| `production` | `pnpm deploy` | `clear-clef` | production workers.dev |
| `staging` | `pnpm deploy:staging` | `clear-clef-staging` | staging workers.dev |

## Deploy secrets

Set `BETTER_AUTH_SECRET` on the Worker (dashboard or `cf` secret APIs). Do not commit secrets. Optional: `cf deploy --prebuilt --secrets-file .dev.vars` in a controlled CI step (never commit real `.dev.vars`).

## Requirements

- **Node 24 LTS** (`engines.node` in `package.json`; required to load `cloudflare.config.ts`)
- `pnpm exec cf auth login` before remote deploy / D1 remote migrate

See also [local-dev.md](local-dev.md) for troubleshooting.
