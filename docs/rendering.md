# Rendering

ClearClef is a **viewer** catalog, not an in-browser editor. Engraving happens in the browser with Verovio; catalog pages stay free of WASM.

## Library choice

| Library | Best for | Tradeoff |
| --- | --- | --- |
| **[Verovio](https://www.verovio.org)** (`verovio` npm, C++ → WASM) | Engraving quality; MusicXML, ABC, MEI, Humdrum; SVG | Large WASM (~several MB) — load only on score pages |
| **[OpenSheetMusicDisplay](https://opensheetmusicdisplay.github.io)** | MusicXML-only, simpler TS API, no WASM | Weaker engraving |

**Default: Verovio.** OSMD is the documented fallback if WASM bundling on OpenNext / Next becomes painful.

Both are viewers, not editors. Full editing is a different product (Flat.io, MuseScore Studio, or ABC + abcjs).

## Client-only loading

1. `ScoreViewer` is a Client Component loaded via `ScoreViewerLoader` (`next/dynamic` + `ssr: false`) from the score detail page.
2. Prefer ESM + modular WASM:

```ts
import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";

const module = await createVerovioModule();
const tk = new VerovioToolkit(module);
```

3. For `.mxl`: `fetch` → `arrayBuffer` → `tk.loadZipDataBuffer(buffer)`. Use `compressed` from `r2Key.endsWith(".mxl")` and/or ZIP magic (`PK`) — the `/api/scores/{id}/file` URL does not end in `.mxl`.
4. For uncompressed MusicXML: `tk.loadData(xmlString)`.
5. Render **per page**: `tk.renderToSVG(pageNumber)`; v1 uses Previous/Next buttons (not scroll lazy-load).
6. Shared toolkit options (`scale`, `footer`, `header`) live in [`lib/verovio/options.ts`](../lib/verovio/options.ts) for viewer and admin ingest preview.
7. `default_visible_parts` is stored in D1 for future part filtering. v1 renders all staves; Verovio has no `partNames` option.

**Do not** import Verovio on list pages or into shared Server Component trees.

## Serving score bytes

`GET /api/scores/{id}/file` streams the public score object from R2. Viewer never needs Worker-side WASM for full-score engraving.

## Previews (catalog rows)

- Generate **page-1 SVG** once at ingest in the **admin browser** (Verovio after upload succeeds).
- Store via `PUT /api/admin/scores/{id}/preview` as `scores/{id}/preview.svg` in R2.
- Catalog rows use `GET /api/scores/{id}/preview` on desktop — **do not** engrave on the server per request.

## Fonts

v1 uses Verovio default glyphs. A dedicated SMuFL webfont (e.g. Bravura) on the viewer route only is optional later.

## Accessibility

- Expose title and composer as real HTML on the detail page.
- Wrap the SVG viewer with appropriate `aria` (labeled region). Screen readers do **not** read Verovio SVG as music.
- Paginate with controls; do not dump a giant single SVG into the DOM.

## Dark mode (viewer)

Follow [design.md](design.md): **lamp on a stand**. The viewer outer shell uses edition canvas tokens; the inner page stays white. Verovio output is never inverted or re-engraved for dark mode. R2 ingest previews remain black-on-white SVG.

## Caching engraved assets

Preview and immutable score objects: long-lived `Cache-Control` (see [architecture.md](architecture.md)). HTML detail pages remain short-cached so metadata updates show up after revalidation.

## Related docs

- [architecture.md](architecture.md)
- [ingest.md](ingest.md)
- [decisions.md](decisions.md) — ADR-002, ADR-005
