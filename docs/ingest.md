# Ingest

Public catalog is **read-only** for visitors. Writes go through a protected admin upload path so the catalog is not an open spam or copyright dump.

## Endpoints

| Action | UI | API |
| --- | --- | --- |
| Overview | `/admin` | — |
| Create | `/admin/upload` | `POST /api/admin/upload` |
| List / edit | `/admin/scores`, `/admin/scores/{id}` | `PATCH /api/admin/scores/{id}` |
| Delete | edit form | `DELETE /api/admin/scores/{id}` |
| Download original | list / edit | `GET /api/admin/scores/{id}/file` (`Content-Disposition: attachment`) |
| Preview (ingest / replace) | browser after upload or file replace | `PUT /api/admin/scores/{id}/preview` |

Auth: **Better Auth** on D1 (email/password; public sign-up disabled; first admin via `/admin/setup`). Optional later: Turnstile on upload.

Anyone can *read* the public catalog. Admins *write*.

**Edit:** metadata (title, composer, license, visibility, tags, etc.) is saved via `PATCH`. Slug is stable after create. Optional file replace re-ingests MusicXML into the same `scores/{id}/` prefix (XXE-hardened path) and regenerates page-1 preview in the admin browser. **Delete** removes the D1 row (cascade `score_tags`) and all R2 objects under `scores/{id}/`.

After a successful **upload** (and client-side page-1 preview), the admin UI redirects to `/admin/scores/{id}?uploaded=1` so metadata can be reviewed before publishing.

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
- Decompress `.mxl` with size/file-count limits and reject zip-slip paths.
- Parse metadata with `fast-xml-parser` (`processEntities: false`) — no DTD resolution.
- Never use browser `DOMParser` on untrusted uploads.

Canonical MusicXML stored at ingest is the sanitized original (DOCTYPE stripped, BOM removed) — not a full rewrite to MusicXML 4.x partwise.

Implementation: [`lib/ingest/mxl.ts`](../lib/ingest/mxl.ts), [`lib/ingest/xml.ts`](../lib/ingest/xml.ts), [`lib/ingest/metadata.ts`](../lib/ingest/metadata.ts).

## Metadata extraction

Parse **metadata only** at upload time (server path; not shipped to public catalog pages).

Typical MusicXML sources:

- `<work>` — title, optional `work-number` (catalog number)
- `<identification>` — creator / rights
- `<credit>` — displayed credits
- Part list, key, time signature from score header / first attributes

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

1. Write R2: `scores/{id}/original.*` + `scores/{id}/canonical.musicxml`
2. Insert D1 `scores` row (+ optional tags via `score_tags`)
3. Set `format = 'musicxml'`, `visibility`, `owner_id` (admin user id)
4. Admin browser generates page-1 SVG preview → `PUT /api/admin/scores/{id}/preview` → `scores/{id}/preview.svg`
5. Revalidate catalog list/detail pages

See [data-model.md](data-model.md) for keys and columns.

## Related docs

- [architecture.md](architecture.md)
- [notation.md](notation.md)
- [rendering.md](rendering.md) — preview generation
