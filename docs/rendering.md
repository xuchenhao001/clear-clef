# Rendering

ClearClef is a **viewer** catalog, not an in-browser editor. Engraving happens in the browser with Verovio; catalog pages stay free of WASM.

## Library choice

| Library | Best for | Tradeoff |
| --- | --- | --- |
| **[Verovio](https://www.verovio.org)** (`verovio` npm, C++ → WASM) | Engraving quality; MusicXML, ABC, MEI, Humdrum; SVG | Large WASM (~several MB) — load only on score pages |
| **[OpenSheetMusicDisplay](https://opensheetmusicdisplay.github.io)** | MusicXML-only, simpler TS API, no WASM | Weaker engraving |

**Default: Verovio.** OSMD is the documented fallback if WASM bundling on Vite / Workers becomes painful.

Both are viewers, not editors. Full editing is a different product (Flat.io, MuseScore Studio, or ABC + abcjs).

## Client-only loading

1. `ScoreViewer` loads only on the client via `ScoreViewerLoader` (`React.lazy` + `Suspense`) from the score detail route.
2. Prefer ESM + modular WASM:

```ts
import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";

const module = await createVerovioModule();
const tk = new VerovioToolkit(module);
```

3. For `.mxl`: `fetch` → `arrayBuffer` → `tk.loadZipDataBuffer(buffer)`. Use `compressed` from `r2Key.endsWith(".mxl")` and/or ZIP magic (`PK`) — the `/api/scores/{id}/file` URL does not end in `.mxl`.
4. For uncompressed MusicXML: `tk.loadData(xmlString)`.
5. Render **per page**: `tk.renderToSVG(pageNumber)`; paginate with Previous/Next (embedded) or practice overlay controls.
6. **Preview options** (`VEROVIO_PREVIEW_OPTIONS`) are fixed for ingest page-1 thumbnails. **Embedded viewer** uses `embeddedLayoutOptions` (width only, `adjustPageHeight: true`). **Practice overlay** uses `practiceLayoutOptions` (width + viewport height). Both call `redoLayout()` via [`lib/viewer/layout.ts`](../lib/viewer/layout.ts). SVG is sanitized once at the cache boundary before `innerHTML`.
7. `default_visible_parts` is stored in D1 for future part filtering. v1 renders all staves; Verovio has no `partNames` option.
8. Call `destroy()` on the toolkit when `ScoreViewer` unmounts.
9. Sanitize Verovio SVG (`script`, `foreignObject`, `on*`) before `innerHTML`. See [`lib/viewer/sanitize-svg.ts`](../lib/viewer/sanitize-svg.ts).

**Do not** import Verovio on list pages or into route modules that ship to the client without lazy boundaries.

## Practice overlay

`PracticeStage` is a fixed full-screen overlay on the score detail page. It reuses the same `VerovioToolkit` instance (no second WASM load).

| Concern | Implementation |
| --- | --- |
| Layout | One page when stage width `< 1280px`; two-page spread at `>= 1280px` ([`lib/viewer/spreads.ts`](../lib/viewer/spreads.ts)) |
| Reflow | Viewport slot width + height via `practiceLayoutOptions`; debounced on resize; skip when dimensions unchanged |
| Position | Restore via first `xml:id` on the current page and `getPageWithElement` — **do not** copy raw page numbers between embedded and practice (page counts differ after reflow) |
| Turn | Tap zones (left / center chrome / right), swipe, keyboard (Arrow, PageUp/Down, Space, Home/End) |
| Wake lock | `navigator.wakeLock.request("screen")` while practice is open |
| History | `pushState` on open; device Back closes practice |
| Safe area | Root route `head` meta includes `viewport-fit=cover` |

## Serving score bytes

`GET /api/scores/{id}/file` streams the public score object from R2. Viewer never needs Worker-side WASM for full-score engraving.

## Previews (catalog rows)

- Generate **page-1 SVG** once at ingest in the **admin browser** (Verovio after upload succeeds).
- Batch review uses a separate lightweight inspection Worker (unzip/metadata/hash); previews use one Verovio Worker and toolkit, serialized. A failed preview is per-row and retryable from the original in R2.
- Store via `PUT /api/admin/scores/{id}/preview` as `scores/{id}/preview.svg` in R2.
- Catalog rows use `GET /api/scores/{id}/preview` on desktop — **do not** engrave on the server per request.

## Fonts

v1 uses Verovio default glyphs. A dedicated SMuFL webfont (e.g. Bravura) on the viewer route only is optional later.

## Accessibility

- Expose title and composer as real HTML on the detail page.
- Wrap the SVG viewer with appropriate `aria` (labeled region). Screen readers do **not** read Verovio SVG as music.
- Paginate with controls; do not dump a giant single SVG into the DOM.
- Announce page changes with a polite `aria-live` region on embedded and practice viewers.
- Embedded viewer accepts keyboard / pedal turns when focused.

## Dark mode (viewer)

Follow [design.md](design.md): the viewer **outer shell** uses edition canvas tokens; the **inner page** stays `#ffffff` (notation paper). Verovio output is never inverted or re-engraved for dark mode. R2 ingest previews remain black-on-white SVG.

## Caching engraved assets

Preview and immutable score objects: long-lived `Cache-Control` (see [architecture.md](architecture.md)). HTML detail pages use short CDN cache windows and purge on catalog writes.

Client-side: cache `renderToSVG` strings per page until the next `redoLayout()`.

## Related docs

- [architecture.md](architecture.md)
- [ingest.md](ingest.md)
- [decisions.md](decisions.md) — ADR-002, ADR-005
