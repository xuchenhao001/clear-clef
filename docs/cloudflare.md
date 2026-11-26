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
| `pnpm db:migrate:local` | D1 migrations into `.cloudflare/state` |
| `pnpm cf-typegen` | Refresh `.cloudflare/types/index.d.ts` |

`cf deploy` does **not** run `package.json` `build` by itself; use `pnpm deploy` so typecheck + `cf build` run first.

## Modes (`ctx.mode`)

| Mode | Typical command | Worker | `BETTER_AUTH_URL` |
| --- | --- | --- | --- |
| `development` | `pnpm dev` | `clear-clef` | `http://localhost:3000` |
| `production` | `pnpm deploy` | `clear-clef` | `https://clearclef.dedog.top` (workers.dev alias still works) |

## Worker CPU budget

| Plan | CPU per HTTP request |
| --- | --- |
| Workers Free | **10 ms** |
| Workers Paid | 5 min maximum; default 30 s |

ClearClef keeps score parsing in the browser so batch review and upload work on the Free plan. `POST /api/admin/uploads/preflight` accepts small JSON lookups only; uploads carry canonical XML prepared by the browser and the server sanitizes/hashes it without a full XML parse. See [ingest.md](ingest.md).

If you move to Workers Paid, raise the explicit limit in [`cloudflare.config.ts`](../cloudflare.config.ts):

```ts
export default defineConfig((ctx) => ({
  worker: {
    // ...
    limits: { cpuMs: 30_000 },
  },
}));
```

`cf` accepts `worker.limits.cpuMs`; it has no effect above 10 ms on the Free plan. Do not rely on a paid limit to mask a missing parser fast path; the header-only/browser-first path should stay.

To diagnose CPU failures on a deployed Worker:

```bash
pnpm exec cf o11y telemetry query --body @o11y-query.json
```

Filter on `$workers.outcome = "exceededCpu"` or `$metadata.error` containing `CPU time limit` for the batch window. A 503 with `exceededCpu` is deterministic for that input and should not be retried blindly.

## Deploy secrets

Set `BETTER_AUTH_SECRET` on the Worker (dashboard or `cf` secret APIs). Do not commit secrets. Optional: `cf deploy --prebuilt --secrets-file .dev.vars` in a controlled CI step (never commit real `.dev.vars`).

## Requirements

- **Node 24 LTS** (`engines.node` in `package.json`; required to load `cloudflare.config.ts`)
- `pnpm exec cf auth login` before remote deploy / D1 remote migrate

See also [local-dev.md](local-dev.md) for troubleshooting.
