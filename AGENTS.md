# Agent instructions — ClearClef

ClearClef is a **public MusicXML score catalog** on TanStack Start + Cloudflare Workers (D1 metadata, R2 files, Verovio in the browser). Prefer [docs/](docs/) over inventing new architecture.

Use **pnpm** only (`packageManager` in `package.json`). Do not add `package-lock.json`.

## Non-negotiables

1. **Canonical format = MusicXML (target 4.x partwise).** v1 stores a sanitized copy at ingest (DOCTYPE stripped, BOM removed); prefer `.mxl` for originals on R2. Keep original + canonical. MIDI / MEI / ABC / MNX / PDF are not the store format (ABC may convert once on ingest later).
2. **List/detail = route loaders + D1** (via `createServerFn`). Never load Verovio/WASM on catalog index pages.
3. **Viewer = client-only** via `React.lazy` + `Suspense`. Paginate SVG; do not SSR engraved scores.
4. **Writes are admin-only in v1.** Public read; protected `/admin/*` via Better Auth (email/password, admin role). First admin is created at `/admin/setup`; public sign-up stays disabled. Admins upload, list, edit, download originals, and delete scores at `/admin/scores`. Require a **license** on every score.
5. **XXE:** Treat uploads as hostile. Strip external MusicXML DOCTYPE; reject ENTITY / internal subsets; non-validating parse; no DTD resolution.
6. **No per-request server engraving.** Page-1 preview SVG is generated at ingest and stored in R2.
7. **R2:** one bucket (`clear-clef`). Scores under `scores/`. Public HTML cache uses `Cache-Control` + `purgePublicScore` (`lib/cache/public-pages.ts`), not a second R2 binding.
8. Public queries use `visibility = 'public'`. `owner_id` is set on admin upload; `visibility` / `format` remain hooks for membership and MNX.

## Cloudflare Worker `env`

- **Single local secrets file:** `.dev.vars` (from `.dev.vars.example`). Do not add a parallel `.env` for runtime.
- **Secrets** (`BETTER_AUTH_SECRET`): must use `bindings.secret()` in `cloudflare.config.ts`; `.dev.vars` only applies to declared bindings.
- **Vars** (`BETTER_AUTH_URL`): use `bindings.text()`; value comes from `ctx.mode` (`development` = localhost for `pnpm dev`). `.dev.vars` does **not** override text bindings.
- Binding constants: `lib/worker-bindings.ts` (Worker/app) and `worker-bindings.mjs` (Node-only: `cloudflare.config.ts`, Vite, scripts). Keep them aligned (`tests/worker-bindings-sync.test.ts`).
- Local D1: `pnpm db:migrate:local` uses `--persist-to .cloudflare/state` (same path as Vite `persistState` in `vite.config.ts`). `cf dev` does not accept `--persist-to`. See [docs/local-dev.md](docs/local-dev.md).

## Do not build in v1

In-browser editor, transposition UI, comments, full-score server PNGs, MIDI playback, MEI-as-canonical, open public uploads.

## Where to look

| Topic | Doc |
| --- | --- |
| System design | [docs/architecture.md](docs/architecture.md) |
| Schema / R2 keys | [docs/data-model.md](docs/data-model.md) |
| Standards | [docs/notation.md](docs/notation.md) |
| Upload pipeline | [docs/ingest.md](docs/ingest.md) |
| Verovio | [docs/rendering.md](docs/rendering.md) |
| Phases | [docs/roadmap.md](docs/roadmap.md) |
| ADRs | [docs/decisions.md](docs/decisions.md) |
| Visual design | [docs/design.md](docs/design.md) |

Cursor rules under `.cursor/rules/` reinforce product, ingest, viewer, and design constraints when matching files are open.
