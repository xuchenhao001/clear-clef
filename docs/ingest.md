# Ingest

Public catalog is **read-only** for visitors. Writes go through a protected admin upload path so the catalog is not an open spam or copyright dump.

## Endpoint

- Route: `/admin/upload` (UI) + corresponding route handler(s)
- MVP auth: shared **env secret** (e.g. `ADMIN_UPLOAD_SECRET`) or Cloudflare Access
- Phase 2: Better Auth / Clerk against D1; Turnstile optional on the form

Anyone can *read*. You (and later members) *write*.

## Accepted inputs

| Extension | Handling |
| --- | --- |
| `.mxl` | Preferred; store as `original.mxl`; extract / normalize canonical MusicXML |
| `.musicxml` / `.xml` | Accept; store original; write canonical MusicXML |
| `.abc` | Optional later: convert once to MusicXML on ingest — not required for v1 |

**Size cap:** 5–10 MB for `.mxl` (enforce in the route handler). Reject oversized uploads early.

## Security: XXE and untrusted XML

MusicXML files are XML. Treat uploads as hostile.

- Reject or strip DTDs and external entities.
- Parse with a **non-validating** XML approach that never resolves external entities.
- Never use browser `DOMParser` (or equivalent) on untrusted XML with DTD resolution enabled.
- **Do not assume** a convenience library is XXE-safe. Hardening must wrap or precede libraries such as `musicxml-io` — audit and constrain input (e.g. decompress `.mxl` carefully, then parse with a hardened path).

## Metadata extraction

Parse **metadata only** at upload time (server or admin client path that does not ship into every public page).

Typical MusicXML sources:

- `<work>` — title
- `<identification>` — creator / rights
- `<credit>` — displayed credits
- Part list, key, time signature from score header / first attributes

Suggested library for structure: [`musicxml-io`](https://www.npmjs.com/package/musicxml-io) (upload-time only). Alternatives for header-only parse (e.g. `musicxml-interfaces` `parseScoreHeader`) may be lighter — choose during implementation, keep the boundary the same:

- Extract title, composer, lyricist, key, time, parts
- Persist to D1
- Do **not** import the parser into list/detail RSC pages

## License (required)

A public catalog of copyrighted sheet music is a **legal** problem, not a tech one. The upload form **must** require a license field, for example:

- Public Domain
- CC0
- CC-BY
- All rights reserved / do not redistribute (may still allow private/unlisted later; do not feature as redistributable public catalog content)

Prefer IMSLP / MuseScore public-domain works for seed content. Do **not** scrape publisher PDFs.

## On successful ingest

1. Write R2: original + `canonical.musicxml` (+ `preview.svg` when preview generation is wired)
2. Insert D1 `scores` (+ tags)
3. Set `format = 'musicxml'`, `visibility` (default `public` for admin catalog seeds), nullable `owner_id`
4. Revalidate / short-cache bust catalog list pages

See [data-model.md](data-model.md) for keys and columns.

## Related docs

- [architecture.md](architecture.md)
- [notation.md](notation.md)
- [rendering.md](rendering.md) — preview generation
