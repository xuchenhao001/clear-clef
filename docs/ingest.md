# Ingest

Public catalog is **read-only** for visitors. Writes go through a protected admin upload path so the catalog is not an open spam or copyright dump.

## Endpoints

| Action | UI | API |
| --- | --- | --- |
| Overview | `/admin` | — |
| Create | `/admin/upload` | `POST /api/admin/upload` |
| Inspect a batch | `/admin/batch-upload` | browser Web Worker (no file sent) |
| Look up batch matches | `/admin/batch-upload` | `POST /api/admin/uploads/preflight` (JSON) |
| Create from a batch | `/admin/batch-upload` | `POST /api/admin/upload` (one request per file) |
| Publish a batch | `/admin/batch-upload` / Scores filter | `POST /api/admin/imports/{importId}/publish` |
| Assign composer credits | `/admin/composers` | `POST /api/admin/composers/assign` |
| Merge authorities | `/admin/composers?view=authority` | `POST /api/admin/composers/merge` |
| List / edit | `/admin/scores`, `/admin/scores/{id}` | `PATCH /api/admin/scores/{id}` |
| Delete | edit form | `DELETE /api/admin/scores/{id}` |
| Download original | list / edit | `GET /api/admin/scores/{id}/file` (`Content-Disposition: attachment`) |
| Preview (ingest / replace) | browser after upload or file replace | `PUT /api/admin/scores/{id}/preview` |

Auth: **Better Auth** on D1 (email/password; public sign-up disabled; first admin via `/admin/setup`). Optional later: Turnstile on upload.

Anyone can *read* the public catalog. Admins *write*.

**Batch upload** is a client-orchestrated session at `/admin/batch-upload`, not one large Worker request:

1. The admin chooses a folder (up to 200 files / 100 MB; 8 MB per file). Nothing is written.
2. A browser **Web Worker** reads each `.mxl`: it unzips, decodes, sanitizes, extracts metadata/credits, and hashes the canonical XML. No score file is sent to the server Worker during review. This keeps the Cloudflare Worker CPU budget out of the batch review loop.
3. The browser sends one small JSON lookup to `POST /api/admin/uploads/preflight` with `{ key, filename, size, contentHash, title, composer }` per file. The server performs one exact-hash query and one normalized-title query, then compares composer authority keys before offering similar matches. Two settings of the same title by different composers are not treated as duplicates.
4. The admin reviews titles, credits, license, visibility, tags, duplicates, and missing-composer rows. Composer is chosen from the authority picker, not typed free-hand; raw file credit remains visible as evidence. The license is intentionally blank until chosen.
5. The browser uploads included files to the existing `POST /api/admin/upload` two at a time, with a per-file `uploadKey` (idempotency) and one `importId` for the batch. It sends the original file plus the canonical MusicXML as a **File part** (not a text field, so multipart line-ending normalization cannot change the hashed bytes). The server sanitizes and re-hashes the canonical text and stores both; it does not unzip or parse the full original on the fast path. Client metadata is a suggestion only.
6. Page-1 previews render in a Web Worker and are written through the existing preview route. If the tab closes, the batch manifest remains in `localStorage`; re-selecting the folder matches files by path, size, and modified time, and already-uploaded rows are not sent again.
7. `/admin/scores?import={importId}` is the durable handoff. “Publish” moves that import's private scores to public and purges their pages.

Batch limits are UI limits; the server preserves the 8 MB per-file cap and an 8 MB canonical cap. A preview failure is a row state, not an upload rollback. The import ID groups the scores; there is no separate import table in v1.

**Why the browser reads first:** Workers Free allows only **10 ms CPU per request**. A full MusicXML parse of a 227 KB score already takes ~13 ms, and a 2.36 MB score ~127 ms. Preflight used to hit `exceededCpu` (HTTP 503) for larger files. The browser worker removes that cost from the server; the upload fast path only sanitizes, hashes, and stores canonical text.

If a future deployment enables Workers Paid, `limits.cpuMs` can raise the per-request budget (see [cloudflare.md](cloudflare.md)), but the browser-first path remains the default so the app works on Free.

**Edit:** metadata (title, composer authority, license, visibility, tags, etc.) is saved via `PATCH`. The composer field sends `composerId`; free text is only used for an explicit “create authority record” choice. Slug is stable after create. Optional file replace re-ingests MusicXML into the same `scores/{id}/` prefix (XXE-hardened path) and regenerates page-1 preview in the admin browser. **Delete** removes the D1 row (cascade `score_tags`) and all R2 objects under `scores/{id}/`.

**Credit review:** after upload, a score with no usable credit has `composer_id = NULL` and `composer_raw` preserved. It appears at `/admin/composers?view=unassigned`, where one or many works can be assigned to an existing authority record, a newly created one, or explicitly kept `Uncredited`. If an older row lost its raw credit, **Read credit from file** downloads the original through the admin route, inspects it in the browser and stores the credit as evidence; it never assigns. This queue is the only bulk composer workflow; the merge tool refuses `Uncredited`.

After a successful **single upload** (and client-side page-1 preview), the admin UI redirects to `/admin/scores/{id}?uploaded=1` so metadata can be reviewed before publishing. Batch upload stays on `/admin/batch-upload` and hands off through the import filter.

## Accepted inputs

| Extension | Handling |
| --- | --- |
| `.mxl` | Preferred; store as `original.mxl`; extract / normalize canonical MusicXML |
| `.musicxml` / `.xml` | Accept; store original; write canonical MusicXML |
| `.abc` | Optional later: convert once to MusicXML on ingest — not required for v1 |

**Size cap:** 8 MB (enforced in [`lib/ingest/constants.ts`](../lib/ingest/constants.ts)). Reject oversized uploads early.

## Security: XXE and untrusted XML

MusicXML files are XML. Treat uploads as hostile.

- Strip external MusicXML `<!DOCTYPE>` declarations; never resolve DTDs or external entities.
- Reject `<!ENTITY>` declarations and DOCTYPE internal subsets before parsing.
- Decompress `.mxl` with **declared size/file-count limits applied before extraction** and reject zip-slip paths. The reader extracts only `META-INF/container.xml` and the rootfile; images and other entries are not expanded.
- Decode XML from the BOM or declaration (UTF-8, UTF-16 with BOM, ISO-8859-1/Windows-1252); reject unknown or malformed encodings.
- Parse metadata with `fast-xml-parser` (`processEntities: false`) against the score header and first-measure fragment only — no DTD resolution and no full-document object tree.
- Never use browser `DOMParser` on untrusted uploads.

Canonical MusicXML stored at ingest is the sanitized original (DOCTYPE stripped, BOM removed) — not a full rewrite to MusicXML 4.x partwise. Batch/admin uploads prepare that canonical text in the browser, but the server re-runs `sanitizeMusicXml` and re-hashes it before storing anything. The original file is stored unchanged; the canonical is the document served to the viewer.

Catalog metadata is normalized at write time: composer credits resolve to the `composers` authority file (known variants and `arr.` suffixes included), keys use the canonical key list, difficulty uses the four-level scale, licenses use `LICENSE_OPTIONS`, and `title_sort`/`work_key`/`search_text` are refreshed with the FTS row. `scores.composer_raw` and `scores.source_filename` keep the original evidence; they are never overwritten by canonicalisation.

Implementation: [`lib/ingest/mxl.ts`](../lib/ingest/mxl.ts), [`lib/ingest/xml.ts`](../lib/ingest/xml.ts), [`lib/ingest/metadata.ts`](../lib/ingest/metadata.ts), [`lib/ingest/inspect.ts`](../lib/ingest/inspect.ts), [`lib/ingest/inspect-client.ts`](../lib/ingest/inspect-client.ts).

## Metadata extraction

Parse **metadata only** at upload time (server path; not shipped to public catalog pages).

Typical MusicXML sources:

- `<work>` — title, optional `work-number` (catalog number)
- `<identification>` — creator / rights
- `<credit>` — displayed credits
- Part list, key, time signature from score header / first attributes

`extractScoreMetadata` reads only the header (`work`, `identification`, credits, `part-list`) and the first `<measure>`; it counts measures in the first part with a linear scan. It also accepts UTF-16/Latin-1 input and falls back to a full parse only for small, unusual documents. Composer is optional: many MuseScore exports have no `<creator>`, so the admin UI labels those rows “No composer in file (optional)” rather than treating them as read failures.

Key is emitted only when the file declares `<mode>` or the title says “Major”/“Minor”; a bare key signature is ambiguous (C major and A minor share one), so it is left null rather than guessed as major.

Extract title, composer, optional catalog number (`work-number`), lyricist, key, time, parts → D1. Admin upload may override catalog number when the file is blank or wrong. Do **not** import ingest parsers into public catalog route loaders.

## License (required)

The upload form **must** require a license field, for example:

- Public Domain
- CC0
- CC-BY
- CC-BY-SA
- All rights reserved

Prefer IMSLP / MuseScore public-domain works for seed content. Do **not** scrape publisher PDFs.

## On successful ingest

1. Write R2: `scores/{id}/original.*` + `scores/{id}/canonical.musicxml` (the fast path receives canonical from the admin browser and re-sanitizes it; API clients without canonical use the server-side reader)
2. Insert D1 `scores` row (+ optional tags via `score_tags`)
3. Set `format = 'musicxml'`, `visibility`, `owner_id` (admin user id)
4. Admin browser generates page-1 SVG preview → `PUT /api/admin/scores/{id}/preview` → `scores/{id}/preview.svg`
5. Revalidate catalog list/detail pages

See [data-model.md](data-model.md) for keys and columns.

## Related docs

- [architecture.md](architecture.md)
- [notation.md](notation.md)
- [rendering.md](rendering.md) — preview generation
