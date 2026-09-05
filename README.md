# ClearClef

Public catalog of Common Western Musical Notation scores. **MusicXML** is the canonical interchange format; scores render in the browser with Verovio; metadata and files live on **Next.js** plus **Cloudflare** (D1 + R2).

Anyone can browse. Uploads are admin-only in v1 (Better Auth email/password; public sign-up disabled).

## Status

**Phases 1–5 are implemented.** Public catalog, admin upload, Verovio viewer, page-1 previews, tags, and filters are in place. See [docs/roadmap.md](docs/roadmap.md).

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js App Router + TypeScript |
| Package manager | pnpm 11 (Corepack) |
| Deploy | [@opennextjs/cloudflare](https://opennext.js.org/cloudflare) |
| UI | Tailwind + shadcn/ui |
| Auth | Better Auth + D1 (admin plugin; email/password) |
| Score files | R2 bucket `clear-clef` (`SCORES_BUCKET`, keys under `scores/`) |
| Next ISR cache | Same bucket (`NEXT_INC_CACHE_R2_BUCKET`, keys under `incremental-cache/`) |
| Catalog metadata | D1 database `clear-clef` (`DB`) + Drizzle ORM |
| Engraving | Verovio (WASM → SVG), client-only |

## Local development

Requires Node 20+, [pnpm](https://pnpm.io) 11 (via Corepack), and a logged-in Wrangler session (`pnpm exec wrangler login`, then `pnpm exec wrangler whoami`).

```bash
corepack enable
cp .dev.vars.example .dev.vars
pnpm install
pnpm db:migrate:local
pnpm cf-typegen                  # after wrangler.jsonc changes; Env types are committed
pnpm dev
```

On first run, open `/admin/setup` to create the admin account.

- `pnpm dev` — Next.js + local Cloudflare bindings via `initOpenNextCloudflareForDev()` (`wrangler.dev.jsonc` omits `WORKER_SELF_REFERENCE`, which is only needed in the Workers runtime)
- `pnpm test` — Vitest unit tests (in-memory SQLite; no remote D1)
- `pnpm typecheck` — TypeScript without emit
- `pnpm preview` — build with OpenNext and run in the Workers runtime
- `pnpm db:migrate:remote` — apply Drizzle SQL to the remote D1 database
- `pnpm deploy` — OpenNext build + deploy the Worker (not required for local work)

Do not commit `.dev.vars` or `.env.local`. Copy from [`.dev.vars.example`](.dev.vars.example) (Wrangler/Cloudflare `env`) and optionally [`.env.example`](.env.example) (Next.js `process.env` mirror).

## Docs

| Doc | Topic |
| --- | --- |
| [docs/README.md](docs/README.md) | Index |
| [docs/architecture.md](docs/architecture.md) | System design and request flows |
| [docs/data-model.md](docs/data-model.md) | D1 tables and R2 layout |
| [docs/notation.md](docs/notation.md) | MusicXML and related standards |
| [docs/ingest.md](docs/ingest.md) | Upload, validation, XXE, license |
| [docs/rendering.md](docs/rendering.md) | Verovio viewer and previews |
| [docs/roadmap.md](docs/roadmap.md) | Implementation phases |
| [docs/decisions.md](docs/decisions.md) | ADRs |
| [AGENTS.md](AGENTS.md) | Instructions for coding agents |

## Not in v1

- In-browser note editor, transposition UI, or community comments
- Server-side full-score PNG pipelines
- MIDI playback (easy later via Verovio MIDI export + Tone.js)
- MEI as the store format
- Open public uploads (spam / copyright risk)

## Seed content

Prefer public-domain or clearly licensed works (e.g. IMSLP, MuseScore public-domain). Do **not** scrape publisher PDFs. Every catalog entry requires an explicit license field.
