# Architecture

ClearClef is a greenfield Next.js App Router app deployed to Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). Public catalog pages are SEO-friendly Server Components; score engraving runs only in the browser.

## Stack

| Concern | Technology | Notes |
| --- | --- | --- |
| Package manager | pnpm 11 (Corepack; `packageManager` in `package.json`) | Do not use npm or yarn |
| App | Next.js App Router + TypeScript | Node.js runtime only — **do not** set `export const runtime = "edge"` |
| Deploy | OpenNext Cloudflare adapter | `opennextjs-cloudflare` for build / preview / deploy |
| Local bindings | `initOpenNextCloudflareForDev()` in `next.config` | Use `next dev` for day-to-day; `pnpm preview` for Workers runtime |
| UI | Tailwind + shadcn/ui | Keep catalog HTML light |
| Score objects | Cloudflare **R2** (`clear-clef`) | Zero egress; immutable object caching |
| Next ISR / incremental cache | Same R2 bucket, prefix `incremental-cache/` (`NEXT_INC_CACHE_R2_BUCKET`) | Separate *keys*, not a second bucket |
| Metadata | Cloudflare **D1** + Drizzle ORM | SQLite at the edge |
| Optional later | KV cache tags, Turnstile on upload, OAuth providers | Do not block MVP |

## Data flow (canonical score)

```mermaid
flowchart LR
  sources[MuseScore_Dorico_ABC]
  musicxml[Canonical_MusicXML_MXL]
  r2[R2_object_store]
  d1[D1_metadata]
  renderer[Browser_renderer_SVG]
  sources --> musicxml
  musicxml --> r2
  musicxml --> d1
  r2 --> renderer
```

## Request flows (MVP)

```mermaid
flowchart TB
  visitor[Visitor]
  pages[Next_RSC_pages]
  viewer[ScoreViewer_client]
  api[Route_handlers]
  d1[D1]
  r2[R2]
  admin[Admin_upload]
  visitor --> pages
  pages --> d1
  visitor --> viewer
  viewer --> api
  api --> r2
  admin --> api
  api --> d1
```

### Public browse (cacheable)

1. List and detail pages are **Server Components**.
2. They query D1 for metadata (`visibility = 'public'`).
3. They render HTML title, composer, license, tags, and a static page-1 preview when available.
4. They **must not** import Verovio or any WASM.

### Score viewer (client-only)

1. Detail page mounts a Client Component via `next/dynamic(..., { ssr: false })`.
2. The client fetches `.mxl` / MusicXML from an app route that streams from R2.
3. Verovio loads the buffer and renders SVG **per page**; v1 uses Previous/Next pagination (not scroll lazy-load).
4. Engraved SVGs are huge DOMs — never SSR them.

### Admin ingest (not public)

1. First boot: create the admin at `/admin/setup` (one-time; public sign-up remains disabled).
2. Protected `/admin/upload` (Better Auth admin session).
3. Route handler validates, extracts metadata, writes R2 objects, inserts D1 rows.
4. Page-1 preview SVG is generated once at ingest in the admin browser, not on every catalog request.

## Cloudflare bindings (conceptual)

When scaffolding, expect roughly:

- `DB` — D1 database for catalog metadata and Better Auth tables
- `SCORES_BUCKET` — R2 `clear-clef` (originals, canonical MusicXML, previews under `scores/`)
- `NEXT_INC_CACHE_R2_BUCKET` — same R2 bucket; OpenNext writes under `incremental-cache/` (`NEXT_INC_CACHE_R2_PREFIX`)
- `ASSETS` / `WORKER_SELF_REFERENCE` — as required by OpenNext
- `BETTER_AUTH_SECRET` — Better Auth signing secret (Wrangler secret in production)
- `BETTER_AUTH_URL` — app base URL for auth callbacks

One physical bucket, two bindings. Isolate by prefix so ISR cache never shares keys with catalog files. Split into two buckets later only if lifecycle or IAM needs diverge.

## Caching

| Asset | Policy |
| --- | --- |
| R2 score / preview objects | `Cache-Control: public, max-age=31536000, immutable` (content-addressed or versioned keys) |
| Catalog HTML (list/detail) | Short cache or `revalidate` after upload |
| `/_next/static/*` | Immutable (OpenNext `public/_headers`) |

## Related docs

- [data-model.md](data-model.md) — tables and object keys
- [ingest.md](ingest.md) — upload pipeline
- [rendering.md](rendering.md) — Verovio details
- [roadmap.md](roadmap.md) — implementation order
