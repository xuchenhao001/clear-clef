# ClearClef design system

Visual reference for ClearClef's public catalog and viewer. A **score library with edition-quality work identity**: quiet stone canvas, Geist chrome, Newsreader 300 for work titles, engraved notation as row previews.

**Dials:** `DESIGN_VARIANCE: 6` · `MOTION_INTENSITY: 4` · `VISUAL_DENSITY: 3`

**Canonical catalog layout:** credit-grouped **contents list** (see [Catalog index](#catalog-index)).

## Overview

ClearClef reads like a small score library: stone paper, hairline rows, page-1 preview thumbnails on desktop, Newsreader for work names, Geist for chrome.

**Key characteristics:**

- Off-white stone canvas `{colors.canvas}` (#f5f5f5), warm near-black ink `{colors.ink}` (#0c0a09).
- No saturated CTA color. Primary action is an ink pill at `{rounded.pill}`.
- **Newsreader 300** for catalog H1 and work titles (display only). **Geist** 400/500 for nav, filters, group labels, body. **Geist Mono** for metadata.
- Never set nav, buttons, filters, or admin forms in Newsreader.
- Page-1 preview SVG at row right on desktop. No decorative stave backgrounds in chrome.
- Soft pill geometry for CTAs; hairline dividers for catalog rows.
- Generous section rhythm (~96px between major bands).

## Colors

### Brand and action

| Token | Hex | Use |
| --- | --- | --- |
| `{colors.primary}` | #292524 | Ink pill background (primary CTA). Used scarcely. |
| `{colors.primary-active}` | #0c0a09 | Press state (light mode). |
| `{colors.primary-dark}` | #f5f5f5 | Ink pill background in dark mode. |
| `{colors.on-primary-dark}` | #0c0a09 | Text on dark-mode pill. |

### Surface

| Token | Hex | Use |
| --- | --- | --- |
| `{colors.canvas}` | #f5f5f5 | Page floor. Public catalog default. |
| `{colors.hover}` | `color-mix(ink 8%)` | Interactive hover and menu highlight on any surface. |
| `{colors.surface-card}` | #ffffff | Viewer page, preview frame, form inputs. |
| `{colors.surface-strong}` | #f0efed | Tag backgrounds, preview thumbnail matte. |

### Hairlines

| Token | Hex | Use |
| --- | --- | --- |
| `{colors.hairline}` | #e7e5e4 | Default 1px divider. |
| `{colors.hairline-soft}` | #f0efed | Lighter divider. |
| `{colors.hairline-strong}` | #d6d3d1 | Input borders, stronger outline. |

### Text

| Token | Hex | Use |
| --- | --- | --- |
| `{colors.ink}` | #0c0a09 | Primary text. |
| `{colors.body}` | #4e4e4e | Running text. |
| `{colors.body-strong}` | #292524 | Emphasis. |
| `{colors.muted}` | #777169 | Credit line, subtitles. |
| `{colors.muted-soft}` | #a8a29e | Disabled, helper text. |
| `{colors.on-primary}` | #ffffff | Text on ink pill (light mode). |

### Semantic

| Token | Hex | Use |
| --- | --- | --- |
| `{colors.semantic-success}` | #16a34a | Confirmation. |
| `{colors.semantic-error}` | #dc2626 | Validation errors. |

### Dark mode — lamp on a stand (locked)

Theme defaults to **System** (`prefers-color-scheme`). Users can override via the header **Light / Dark / System** menu ([`components/theme-menu.tsx`](../components/theme-menu.tsx)); choice persists in `localStorage` and is applied before paint ([`components/theme-init.tsx`](../components/theme-init.tsx)). Chrome darkens while **engraved notation stays ink on white paper**.

| Surface | Light | Dark (lamp) |
| --- | --- | --- |
| Catalog chrome (nav, body, filters) | `{colors.canvas}` #f5f5f5 | Charcoal `{colors.canvas}` #171412 |
| Form fields / admin plate | `{colors.surface-card}` #ffffff | Elevated `{colors.surface-card}` #1c1917 |
| Catalog text | `{colors.ink}` | `{colors.ink}` #f5f5f4 |
| Row hover | `{colors.hover}` ink mix | `{colors.hover}` ink mix |
| Preview thumbnail matte | `{colors.surface-strong}` + white page | Elevated matte + **white page unchanged** |
| Viewer stand (outer shell, toolbar) | `{colors.canvas}` | Charcoal `{colors.canvas}` |
| Viewer page (inner) | `{colors.surface-page}` #ffffff | **#ffffff unchanged** (`surface-page`, not `surface-card`) |
| Verovio SVG | Black on white (default) | **Unchanged** — no `svgCss`, no CSS `filter: invert` |
| Primary CTA pill | `{colors.primary}` on `{colors.on-primary}` | `{colors.primary}` #e7e5e4 on `{colors.on-primary}` #1c1917 |

**Rejected:** light-only public catalog, full notation inversion, sun/moon icon toggle.

R2 page-1 previews are stored once at ingest as black-on-white SVG ([`ingest.md`](ingest.md)).

## Typography

### Font families

| Role | Family | License | Load |
| --- | --- | --- | --- |
| Display | Newsreader 300 | SIL OFL | `next/font/google` in root layout |
| UI / chrome | Geist 400/500 | OFL | Root layout |
| Metadata | Geist Mono 400 | OFL | Root layout |

**Newsreader only** on catalog H1, catalog row work titles, and score-detail work title. **Never** on nav, wordmark, filters, buttons, group labels, or admin.

Use `font-variation-settings: "opsz" 72, "wght" 300` on large display sizes. Never bold display headlines.

### Hierarchy

| Token | Size | Weight | Line height | Font | Use |
| --- | --- | --- | --- | --- | --- |
| `{typography.catalog-h1}` | 44-48px | 300 | 1.08 | Newsreader | Catalog H1 |
| `{typography.work-title}` | 24px | 300 | 1.2 | Newsreader | Row work title |
| `{typography.work-title-detail}` | 32px | 300 | 1.13 | Newsreader | Detail work title |
| `{typography.page-h1}` | 32-36px | 500 | 1.15 | Geist | Admin headings, empty states, not-found |
| `{typography.group-label}` | 15px | 500 | 1.4 | Geist | Credit group heading |
| `{typography.body-md}` | 16px | 400 | 1.5 | Geist | Body |
| `{typography.body-sm}` | 15px | 400 | 1.47 | Geist | Captions, difficulty |
| `{typography.caption-mono}` | 12px | 400 | 1.5 | Geist Mono | Metadata line, rights line |
| `{typography.button}` | 15px | 500 | 1.0 | Geist | CTA pill |
| `{typography.nav-link}` | 15px | 500 | 1.4 | Geist | Top nav |

### Score header stack

Score identity on catalog rows and detail pages:

1. **Credit** (composer column) - Geist, `{typography.body-sm}`, `{colors.muted}` — group label on index only
2. **Work title** - Newsreader 300 `{typography.work-title}` or `{typography.work-title-detail}` on detail
3. **Metadata line** - Geist Mono, `{typography.caption-mono}` — catalog number, key, time (omit when empty; do not duplicate in a definition list)

Detail pages lead **credit then title**. Fallback group label: `Uncredited`.

## Layout

### Spacing

- Base unit: 4px.
- Tokens: `{spacing.xs}` 8px · `{spacing.base}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.section}` 96px.
- Catalog content max width: ~1200px (`max-w-[1200px]`).
- Public catalog index is a **contents list**: credit sections, hairline-divided rows, optional preview at desktop right.

### Catalog index

| Element | Treatment |
| --- | --- |
| Credit section | Geist `{typography.group-label}` — smaller than work titles; `px-4`, first group `pt-6` |
| Row | Work title (Newsreader `{typography.work-title}`), optional Geist Mono metadata line, Geist body for difficulty and tags |
| Divider | Hairlines on rows (`border-b` on `li`); group sections separated by hairline; no card boxes per row |
| Preview | Page-1 thumbnail at row right on `sm+`; white inner frame on `surface-strong` matte |
| Filters | `EditionSelect` hairline triggers; mono uppercase labels; auto-submit on change; no boxed panel |

**Rejected:** 2-up score plate grid, three equal marketplace cards, SaaS hero with gradient blobs.

## Elevation and depth

| Level | Treatment | Use |
| --- | --- | --- |
| Flat canvas | `{colors.canvas}` | Body, nav |
| Elevated chrome | `{colors.surface-card}` + 1px `{colors.hairline}` | Form inputs, admin plate, theme menu |
| Notation page | `{colors.surface-page}` #ffffff | Viewer inner page, preview thumbnail inner frame |
| Row hover | `{colors.hover}` ink mix | Contents list rows (no card shadow) |

No pastel gradient orbs. No neon glow.

## Shapes

| Token | Value | Use |
| --- | --- | --- |
| `{rounded.md}` | 8px | Form inputs |
| `{rounded.xl}` | 16px | Viewer shell, preview frame |
| `{rounded.pill}` | 9999px | CTAs, tag pills |

## Components

### `top-nav`

Background `{colors.canvas}`, height 64px. Geist wordmark left; **Catalog** link with current-page style; theme icon button and Admin link right. Catalog and Admin links stay visible on mobile. No decorative clef.

Maps to: [`components/site-header.tsx`](../components/site-header.tsx), [`components/site-header-nav.tsx`](../components/site-header-nav.tsx)

### `theme-switch`

Header icon button (sun / moon / monitor for Light / Dark / System). Opens a menu with matching icons and labels. Persists to `localStorage['clear-clef-theme']`. Also on admin protected header and auth shell.

Maps to: [`components/theme-menu.tsx`](../components/theme-menu.tsx), [`components/theme-icons.tsx`](../components/theme-icons.tsx), [`lib/theme.ts`](../lib/theme.ts)

### `catalog-hero`

Left-aligned Newsreader H1 ("Score catalog") + one Geist sentence (max ~20 words). No eyebrow, no CTA strip.

### `filter-bar`

Quiet row: key, difficulty, license, tag. Mono uppercase labels above hairline-underline triggers. **Auto-submit** on change (no Apply button). Options open in an edition-styled popup (Base UI Select), not the OS native list. Clear link when filters are active.

Maps to: [`components/catalog/catalog-filters.tsx`](../components/catalog/catalog-filters.tsx) (server), [`components/catalog/catalog-filters-bar.tsx`](../components/catalog/catalog-filters-bar.tsx) (client auto-submit), [`lib/catalog/filter-url.ts`](../lib/catalog/filter-url.ts) (query builder), [`lib/catalog/types.ts`](../lib/catalog/types.ts) (filter field shape)

### `edition-select`

Shared Base UI Select for catalog filters and admin form fields. Hairline trigger (`filter` label) or boxed trigger (`form` label). Controlled `value`; selected item `font-medium` in popup. Focus ring on trigger.

Maps to: [`components/ui/edition-select.tsx`](../components/ui/edition-select.tsx)

### `contents-list`

Credit-grouped catalog index. Group head in Geist `{typography.group-label}`. Each row: Newsreader work title, optional metadata line, difficulty and tags. Hairline dividers. Page-1 preview thumbnail at desktop right.

Maps to: [`app/(site)/page.tsx`](../app/(site)/page.tsx)

### `contents-row`

Single row inside `contents-list`. No card wrapper at rest. Inset rounded hover/focus wash (`{colors.hover}`) with `px-4`; row `li` drops bottom hairline on hover/focus-within so the wash is not bisected. Clickable row spans title block and optional preview.

Maps to: [`components/catalog/contents-row.tsx`](../components/catalog/contents-row.tsx)

### `back-to-catalog`

Outline pill link to `/`. Score detail, score 404, and app 404. Geist only.

Maps to: [`components/catalog/back-to-catalog.tsx`](../components/catalog/back-to-catalog.tsx)

### `score-header` (detail)

Credit line, Newsreader work title (`{typography.work-title-detail}`), Geist Mono metadata line. Difficulty as body text if present. Musical tag pills only. License **not** pill-styled here. Do not duplicate key/time in a definition list when they appear on the metadata line.

Maps to: [`app/(site)/scores/[slug]/page.tsx`](../app/(site)/scores/[slug]/page.tsx)

### `rights-line`

Below the viewer on score detail. Geist Mono: license (required), source URL if present. Functional metadata, not a plate mark.

Maps to: [`components/score/ScoreRights.tsx`](../components/score/ScoreRights.tsx)

### `viewer-stand`

**Lamp model:** outer shell `{colors.canvas}`; inner page always `{colors.surface-page}` (#ffffff). Top bar: page index in Geist Mono (`3 / 12`). Previous / Next as outline pills; **Practice** ink pill opens full-screen practice. Loading: "Preparing the score." Skeleton matches page rectangle. Never invert SVG.

Verovio **reflows on container width only** (`embeddedLayoutOptions` + `adjustPageHeight: true`); page height follows engraved content. `redoLayout()` runs on width change only (not height). Position is restored across reflow via the first `xml:id` on the current page.

Maps to: [`components/score/ScoreViewer.tsx`](../components/score/ScoreViewer.tsx), [`components/score/ScoreViewerLoader.tsx`](../components/score/ScoreViewerLoader.tsx), [`components/score/viewer-skeleton.tsx`](../components/score/viewer-skeleton.tsx)

### `practice-stage`

Full-screen practice overlay (`z-index: 50`) portaled to `document.body`. Same Verovio toolkit instance as `viewer-stand` (no second WASM load).

| Surface | Behavior |
| --- | --- |
| Floor | `{colors.canvas}` with `100dvh` and safe-area insets (`viewport-fit: cover` in root layout) |
| Pages | White `{colors.surface-page}` sheets; 8px canvas gutter in two-page spread |
| Width | `< 1280px`: one page; `>= 1280px`: consecutive two-page spread (`1-2`, `3-4`, …) |
| Reflow | `pageWidth` + viewport `pageHeight` from slot; `breaks: "auto"`; `redoLayout()` on width/height change |
| Chrome | Geist Mono page label (`3-4 / 12` in spread); Previous / Next / Close outline pills; auto-hide after ~2s (center tap toggles; sides do not) |
| Turn | Left third tap / right third tap; swipe; Arrow / PageUp / PageDown / Space / Home / End; Bluetooth pedal keys |
| Sleep | Screen Wake Lock while open |
| Back | `history.pushState` on open; device Back or Close exits practice and restores embedded layout |
| Position | Do not share raw page index between embedded and practice; restore via `getPageWithElement(xml:id)` |

Maps to: [`components/score/PracticeStage.tsx`](../components/score/PracticeStage.tsx), [`components/score/PracticeSpread.tsx`](../components/score/PracticeSpread.tsx)

### `button-primary`

Ink pill. Background `{colors.primary}` (light) or `{colors.primary-dark}` (dark), height 40px, `{rounded.pill}`.

### `button-outline`

Transparent pill, 1px `{colors.hairline-strong}` border, ink text.

### `public-shell`

Shared public chrome: skip link, site header, and `#content` main landmark. Used by the site layout and app-level not-found.

Maps to: [`components/public-shell.tsx`](../components/public-shell.tsx), [`components/skip-to-content.tsx`](../components/skip-to-content.tsx)

### `admin-shell`

Back-of-house. Geist forms (`type-page-h1` headings, shared label/input classes), required license field. License and visibility use `EditionSelect` (boxed triggers). No library ornament.

Maps to: [`components/admin/AdminAuthShell.tsx`](../components/admin/AdminAuthShell.tsx), [`components/admin/admin-form-styles.ts`](../components/admin/admin-form-styles.ts), [`components/admin/admin-nav-links.tsx`](../components/admin/admin-nav-links.tsx)

## Do's and don'ts

### Do

- Reserve ink pill for primary CTAs only.
- Use Newsreader 300 for catalog H1 and work titles only.
- Use Geist for nav, filters, group labels, and body.
- Use Geist Mono for catalog numbers, key, time, rights line.
- Group the catalog index by credited name with hairline-divided rows.
- Show page-1 preview in a white frame on catalog rows (desktop), even in dark mode.
- Use pill shape for CTAs and musical tag pills.
- Keep copy neutral: "Public catalog of licensed scores."

### Don't

- Don't set Newsreader on nav, wordmark, filters, buttons, admin, or system error pages.
- Don't bold display headlines or mix a second serif for emphasis.
- Don't use card grids on the catalog index.
- Don't pill the license next to the work title.
- Don't use edition jargon in UI copy (colophon, incipit, title page, plate).
- Don't invert or CSS-filter engraved SVG.
- Don't load Verovio on catalog list pages ([rendering.md](rendering.md)).

## Responsive behavior

| Breakpoint | Key changes |
| --- | --- |
| Mobile (< 640px) | Contents rows stack; preview hidden; filters wrap; Catalog link visible in header |
| Tablet (640-1024px) | Preview visible; nav stays single line |
| Desktop (> 1024px) | Full contents list with preview column; max width 1200px |

Touch targets: primary pill 40px height minimum.

## CSS variable mapping

Edition tokens live in [`app/globals.css`](../app/globals.css). `--edition-surface-page` stays `#ffffff` in both modes (notation paper). `--edition-surface-card` is chrome in dark mode.

```css
:root {
  color-scheme: light;
  --edition-canvas: #f5f5f5;
  --edition-ink: #0c0a09;
  --edition-surface-page: #ffffff;
  --edition-surface-card: #ffffff;
  --edition-primary: #292524;
  --edition-on-primary: #ffffff;
  --edition-hover: color-mix(in srgb, var(--edition-ink) 8%, transparent);
}

.dark {
  color-scheme: dark;
  --edition-canvas: #171412;
  --edition-ink: #f5f5f4;
  --edition-surface-page: #ffffff;
  --edition-surface-card: #1c1917;
  --edition-primary: #e7e5e4;
  --edition-on-primary: #1c1917;
  --edition-hover: color-mix(in srgb, var(--edition-ink) 8%, transparent);
}
```

Tailwind utilities: `bg-edition-canvas`, `bg-edition-hover`, `font-display`, `type-catalog-h1`, `type-page-h1`, `type-work-title`, `border-edition-hairline`, `text-edition-muted`, etc.

`--font-display` maps to `--font-newsreader` in `@theme inline`.

## Motion

Interactive hover and focus (catalog rows, outline buttons, theme menu): **200ms** `cubic-bezier(0.16, 1, 0.3, 1)` on `background-color`, `border-color`, and `color` only. Utility class: `edition-interactive-transition`. Under `prefers-reduced-motion: reduce`, duration is **0ms**.

No scroll-driven or entry animation in v1.

## Known gaps

- Pinch-zoom / pan in practice (after reflow fills the glass).
- Encoded-breaks toggle (“match the edition”) for print comparison.
- SMuFL webfont on viewer route is optional later ([rendering.md](rendering.md)).
- Form validation states beyond focus not fully specified.

## Provenance

- Token rhythm (ink pill, hairline rows, stone canvas) adapted from quiet product library patterns.
- ClearClef-specific: Newsreader display + Geist chrome, contents-list catalog, engraved SVG as row preview.
- Layout: contents list over score plate grid.
- Dark mode: lamp on a stand; full inversion rejected.
