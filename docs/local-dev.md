# Local development (Cloudflare Workers)

## Checklist (first time / after pulling)

1. `cp .dev.vars.example .dev.vars` and set `BETTER_AUTH_SECRET` (≥32 chars).
2. `pnpm db:migrate:local` if `drizzle/*.sql` changed (or `pnpm db:ensure:local`).
3. `pnpm dev` — runs **`cf dev`** (Vite in **`development`** mode); `BETTER_AUTH_URL` is `http://localhost:3000` from `cloudflare.config.ts`.

## How Worker `env` is filled

| Kind | Declared in | Local value | Notes |
| --- | --- | --- | --- |
| Secret | `bindings.secret()` | `.dev.vars` | Required in config or `.dev.vars` is ignored |
| Plain string | `bindings.text(...)` | Same as config (per `ctx.mode`) | **Not** overridden by `.dev.vars` |
| D1 / R2 | `bindings.d1` / `r2` | `.cloudflare/state` | Migrations: `--persist-to .cloudflare/state` |

`pnpm dev` persists via the Vite plugin (`persistState: .cloudflare/state` in `vite.config.ts`). `pnpm db:migrate:local` must use the same path (`--persist-to` on `cf d1` only — not on `cf dev`).

## Common failures

| Error | Likely cause | Fix |
| --- | --- | --- |
| `BETTER_AUTH_SECRET must be at least 32 characters` | Secret missing from `env` | `bindings.secret()` in config + `.dev.vars` |
| `Invalid origin: http://localhost:3000` | `BETTER_AUTH_URL` still production URL | `development` mode → localhost in `cloudflare.config.ts` |
| Catalog SQL / missing column | Local D1 not migrated | `pnpm db:migrate:local` |
| Secret works in wrangler folder but not in dev | Migrations/data under `.wrangler` vs `.cloudflare` | Migrate with `--persist-to .cloudflare/state` |

## CI guardrails

- `tests/cloudflare-config.test.ts` — config matches `worker-bindings.mjs` / `lib/worker-bindings.ts`.
- `tests/worker-bindings.test.ts` — mode → URL / worker name helpers.
- `tests/worker-bindings-sync.test.ts` — `.mjs` and `.ts` binding files stay identical.
- `pnpm cf-typegen` after `cloudflare.config.ts` binding changes (types committed under `.cloudflare/types/`).

When you add a new `env` binding: update `cloudflare.config.ts`, `lib/worker-env-contract.ts`, `.dev.vars.example` if secret, run `pnpm cf-typegen`, and extend tests. See [cloudflare.md](cloudflare.md).
