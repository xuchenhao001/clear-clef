# Decisions (ADRs)

Short architecture decision records. Update when a decision is reversed.

## ADR-001: MusicXML as canonical score format

- **Status:** Accepted
- **Context:** Need an interchange format that MuseScore/Dorico/Sibelius already speak, with engraving semantics (not just playback).
- **Decision:** Store and accept MusicXML 4.x partwise; prefer `.mxl` for originals on disk; keep original + canonical.
- **Consequences:** MIDI/ABC/MEI/MNX/PDF are ingest or derived formats only. See [notation.md](notation.md).

## ADR-002: Verovio over OSMD for display

- **Status:** Accepted
- **Context:** Public catalog needs publication-quality SVG; optional ABC/MEI ingest later.
- **Decision:** Use Verovio WASM in a client-only component; OSMD is the fallback if bundling is painful.
- **Consequences:** Large WASM payload; must never load on catalog list routes. See [rendering.md](rendering.md).

## ADR-003: Cloudflare (Workers + D1 + R2) over Node host + S3

- **Status:** Accepted
- **Context:** Greenfield app; zero egress R2 fits score/SVG delivery; D1 fits small catalog metadata.
- **Decision:** TanStack Start on Cloudflare Workers (`cf` CLI, `cloudflare.config.ts`); D1 + Drizzle; one R2 bucket for score objects (see ADR-007).
- **Consequences:** Worker CPU limits — no per-request full-score server engraving; public HTML cache via Workers Cache API. See [architecture.md](architecture.md).

## ADR-004: Admin-only writes for MVP

- **Status:** Accepted
- **Context:** Open upload invites spam and copyright infringement.
- **Decision:** Public read; `/admin/*` gated by Better Auth admin role (email/password; no public sign-up).
- **Consequences:** No community contributions in v1; seed with clearly licensed works. See [ingest.md](ingest.md).

## ADR-005: No per-request server engraving

- **Status:** Accepted
- **Context:** Full-score SVG is large; Verovio WASM is heavy for Worker CPU/time limits.
- **Decision:** Engrave in the browser for viewing; generate page-1 preview once at ingest and store in R2.
- **Consequences:** Preview pipeline is part of ingest (phase 5); catalog row previews stay static. See [rendering.md](rendering.md).

## ADR-006: Copyright / license metadata is mandatory

- **Status:** Accepted
- **Context:** Redistributing sheet music without rights is a legal risk.
- **Decision:** Require an explicit license on every score; prefer public-domain / Creative Commons seed content; do not scrape publisher PDFs.
- **Consequences:** Upload UX must block submit without license; filters can include license. See [ingest.md](ingest.md).

## ADR-007: Single R2 bucket with key prefixes

- **Status:** Accepted (supersedes the two-bucket split in the original ADR-003 wording)
- **Context:** Score files and previews share the same durability needs; a second bucket was only needed for the former Next.js/OpenNext ISR cache.
- **Decision:** Use one R2 bucket (`clear-clef`) with binding `SCORES_BUCKET`; all catalog objects under `scores/…`. Public HTML is cached with the Workers Cache API (`src/start.ts`), not R2.
- **Consequences:** Simpler ops. Split buckets again only if cache eviction, jurisdiction, or IAM must diverge from catalog files.

## ADR-008: Better Auth for admin access

- **Status:** Accepted
- **Context:** Admin upload needs real sessions; env-secret headers are brittle and hard to rotate.
- **Decision:** Use Better Auth with Drizzle adapter on the same D1 database; email/password only; `disableSignUp: true`; admin plugin with first-boot setup at `/admin/setup`; `owner_id` set on ingest.
- **Consequences:** Auth tables live in D1 (`user`, `session`, `account`, `verification`); `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` required; first admin is created once via `/admin/setup`; OAuth/membership can extend later without replacing the gate. When `BETTER_AUTH_URL` is a loopback origin, the common Vite dev ports (3000/3001 on `localhost` and `127.0.0.1`) are trusted as well, so a busy default port does not turn sign-in into `Invalid origin`; deployed base URLs keep the strict single-origin check.

## ADR-009: TanStack Start + native `cf` CLI (replaces Next.js / OpenNext)

- **Status:** Accepted
- **Context:** Next.js App Router + OpenNext added a second deploy model and Wrangler-centric config on top of a mostly loader-driven catalog.
- **Decision:** TanStack Start + TanStack Router; server data via `createServerFn` in `src/server/*`; `cloudflare.config.ts` + `worker-bindings.mjs` for `cf dev` / `cf build` / `cf deploy --prebuilt`; `@cloudflare/vite-plugin@2` beta reads the same config.
- **Consequences:** No `app/` directory, no ISR/RSC split, no `wrangler.jsonc`. Breaking URL or binding changes require editing `cloudflare.config.ts` and re-running `pnpm cf-typegen`.

## ADR-010: Batch upload is client-orchestrated

- **Status:** Accepted (preflight details superseded by ADR-011)
- **Context:** Admins need to ingest tens of MusicXML files without one failed file or one Worker CPU budget sinking the run. The Worker cannot run Verovio previews (ADR-005), and per-request isolation is more useful than a server job queue for a small catalog.
- **Decision:** `/admin/batch-upload` inspects files in the browser, looks up catalog matches in one JSON request, then uploads them two at a time to the existing per-file endpoint with `upload_key` (idempotency), `import_id` (grouping), and canonical XML. Previews run in a browser Web Worker. The batch manifest lives in `localStorage`; re-selecting the folder resumes it. No server batch endpoint and no import table in v1.
- **Consequences:** Batch state is browser-local; already-uploaded rows are durable, but unfinished rows require the folder again. Scores carry the import ID, so the Scores filter is the durable history. A future import table can add cross-session history without changing the score rows.

## ADR-011: Browser-first batch inspection and canonical handoff

- **Status:** Accepted
- **Context:** Workers Free has a 10 ms CPU limit. Full MusicXML metadata parsing and hashing in the preflight route caused deterministic `exceededCpu` 503s for ordinary scores (227 KB XML ≈ 13 ms; 2.36 MB ≈ 127 ms). Retrying those 503s multiplied the failures.
- **Decision:** Read and inspect batch files in a browser Web Worker (unzip, decode, sanitize, targeted header metadata, hash). Send one JSON catalog lookup per batch; the server never receives score files during review. Uploads carry the original file plus canonical XML as a binary File part; the server sanitizes, re-hashes, extracts metadata from the header, and stores both without a full parse. The server-side reader remains the fallback for clients that do not send canonical XML.
- **Consequences:** Batch review works within the Free CPU budget; the server still treats canonical XML as hostile and rejects DOCTYPE/ENTITY/internal subsets. The client hash is advisory for review and is verified against the server hash on upload. Full-document fallback parsing is limited to small/unusual inputs, and canonical XML has an 8 MB cap.

## ADR-012: Composer authority and edition labels

- **Status:** Accepted
- **Context:** The public catalog had 81 score rows under 38 free-text credit headings. The same composer appeared as `Chopin`, `Fredrik Chopin`, `Frédéric Chopin`, `J.S. Bach` and `J. S. Bach`; arrangers were mixed into composer names; repeated titles were indistinguishable.
- **Decision:** Add a `composers` authority table with canonical display/sort names, dates and aliases. Scores reference `composer_id` as the only authority link; the old `scores.composer` display cache is dropped. Arranger is separate. `work_key` clusters editions and `edition_label` distinguishes them. Known aliases resolve automatically on write; admins can merge records at `/admin/composers?view=authority`.
- **Consequences:** Composer grouping, search and future composer pages use one identity. A full work/edition table is deferred until work-level pages are needed. Migration `0006` canonicalizes known legacy spellings and labels duplicate editions; migration `0007` adds normalised names, the alias table, raw-credit provenance and the review queue. Ambiguous names are merged by an admin, and the search index is rebuilt from Maintenance.

## ADR-013: SQLite FTS5 search in D1

- **Status:** Accepted
- **Context:** The catalog needs title, composer, catalogue-number, key, tag and CJK search with ranking, without adding an external search service. D1 caps bound parameters at 100 and LIKE patterns at 50 bytes.
- **Decision:** Maintain a `catalog_search` FTS5 table from application writes. Query with `bm25` weights, prefix tokens, escaped syntax and CJK character spacing. Fall back to normalized `search_text` for CJK or unusual queries. Rebuild through a CLI/admin action.
- **Consequences:** Search stays inside D1 and Workers. The index must be refreshed after score/tag/composer writes; a stale index is repaired with the rebuild action. No external vendor, no per-request full-document parse.

## ADR-014: Pagination, URL state and indexability

- **Status:** Accepted
- **Context:** The catalog loaded every score and every preview, and filter state was a one-value-at-a-time link. Search, pagination and shareable filtered URLs need one typed state.
- **Decision:** Catalog state is `q`, repeatable facet slugs, `sort` and `page`, parsed by `lib/catalog/url-state.ts` and serialized with standard query strings. Page size is 30; offset pagination now, keyset later if the catalog passes ~10k. Default browse is indexable; search/facet pages are `noindex,follow`; page 2+ is self-canonical with `rel=prev/next`.
- **Consequences:** Old JSON-array query URLs and display-string facets remain readable. Deep pages are cheap at current scale; count queries are cached by the page render.

## ADR-015: Versioned public media URLs

- **Status:** Accepted
- **Context:** Preview and score URLs returned `immutable` while admin preview `PUT` and file replacement overwrote the same R2 key. Browsers and the edge could serve the old score for a year.
- **Decision:** Build public media URLs with `?v=contentHash` or `?v=previewVersion`. Serve `immutable` only when the token matches; redirect unversioned/stale tokens to the current URL. Store a 320×452 WebP thumbnail for catalog rows and keep the SVG as fallback.
- **Consequences:** File replacement changes the URL. HTML pages are purged as before. Cached old URLs redirect instead of leaking stale notation.

## ADR-016: Composer credit queue and null-means-review

- **Status:** Accepted
- **Context:** `Uncredited` was both the unresolved queue and a real composer record. It could never empty, intentionally anonymous works kept resurfacing, and a merge of `Uncredited` into a real composer would bulk-assign unrelated works. Raw file credits and filenames were discarded during canonicalisation.
- **Decision:** `scores.composer_id IS NULL` means **needs review**. The `Uncredited` authority record means **reviewed anonymous** and is assigned only through the explicit **Keep uncredited** action. Preserve `composer_raw` and `source_filename`; resolve authorities through `normalized_name` plus a unique alias table; expose `/admin/composers` as Unassigned works / Authority file / Maintenance. Assignment is a chunked service with an audit row, FTS refresh and page purge. Merge rejects `Uncredited`.
- **Consequences:** The queue is genuinely emptyable and every assignment is auditable. Legacy rows parked under `Uncredited` move to `NULL` in `0007`, so existing catalogs get one review pass. The raw credit is evidence, never an automatic assignment. A future work/edition model can build on the same `composer_id` link.
