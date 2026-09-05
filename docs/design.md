# ClearClef design system

Visual reference for ClearClef's public catalog and viewer. A **genre-neutral score library**: quiet stone canvas, Geist typography, engraved notation as row previews. Not a classical publisher edition and not a generic SaaS marketing site.

**Dials:** `DESIGN_VARIANCE: 6` · `MOTION_INTENSITY: 3` · `VISUAL_DENSITY: 3`

**Canonical catalog layout:** credit-grouped **contents list** (see [Catalog index](#catalog-index)).

## Overview

ClearClef reads like a small score library: stone paper, hairline rows, page-1 preview thumbnails on desktop, and Geist throughout.

**Key characteristics:**

- Off-white stone canvas `{colors.canvas}` (#f5f5f5), warm near-black ink `{colors.ink}` (#0c0a09).
- No saturated CTA color. Primary action is an ink pill at `{rounded.pill}`.
- **Geist** 400/500 for chrome, titles, and group labels. **Geist Mono** for metadata (key, time, optional catalog number, page index, rights line).
- No display serif. Genre-neutral means the same chrome for any credited name or work title.
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
| `{colors.canvas-soft}` | #fafafa | Row hover, subtle band. |
| `{colors.surface-card}` | #ffffff | Viewer page, preview frame, form inputs. |
| `{colors.surface-strong}` | #f0efed | Disabled plates, tag backgrounds. |

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
| Row hover | `{colors.canvas-soft}` #fafafa | `{colors.canvas-soft}` #1c1917 |
| Preview thumbnail matte | `{colors.canvas-soft}` + white page | Charcoal matte + **white page unchanged** |
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
| UI / titles | Geist 400/500 | OFL | Root layout |
| Metadata | Geist Mono 400 | OFL | Root layout |

**Do not** load Newsreader or other display serifs for public catalog surfaces. **Never** mix a second serif for emphasis.

### Hierarchy

| Token | Size | Weight | Line height | Font | Use |
| --- | --- | --- | --- | --- | --- |
| `{typography.catalog-h1}` | 32-40px | 500 | 1.15 | Geist | Catalog H1 |
| `{typography.work-title}` | 18-20px | 500 | 1.35 | Geist | Row and detail work title |
| `{typography.group-label}` | 15px | 500 | 1.4 | Geist | Credit group heading (smaller than work title) |
| `{typography.body-md}` | 16px | 400 | 1.5 | Geist | Body |
| `{typography.body-sm}` | 15px | 400 | 1.47 | Geist | Captions, difficulty |
| `{typography.caption-mono}` | 12px | 400 | 1.5 | Geist Mono | Metadata line, rights line |
| `{typography.button}` | 15px | 500 | 1.0 | Geist | CTA pill |
| `{typography.nav-link}` | 15px | 500 | 1.4 | Geist | Top nav |

### Score header stack

Score identity on catalog rows and detail pages:

1. **Credit** (composer column) - Geist, `{typography.body-sm}`, `{colors.muted}` — group label on index only
2. **Work title** - Geist `{typography.work-title}`
3. **Metadata line** - Geist Mono, `{typography.caption-mono}` — optional; catalog number, key, time (omit when empty)

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
| Credit section | Geist `{typography.group-label}` — smaller than work titles |
| Row | Work title (Geist `{typography.work-title}`), optional Geist Mono metadata line, Geist body for difficulty and tags |
| Divider | `border-y` + `divide-y` on `{colors.hairline}`; no card boxes per row |
| Preview | Page-1 thumbnail at row right on `sm+`; hidden on narrow mobile |
| Filters | Quiet `filter-bar` above the list; not a heavy bordered panel |

**Rejected:** 2-up score plate grid, three equal marketplace cards, SaaS hero with gradient blobs.

## Elevation and depth

| Level | Treatment | Use |
| --- | --- | --- |
| Flat canvas | `{colors.canvas}` | Body, nav |
| Elevated chrome | `{colors.surface-card}` + 1px `{colors.hairline}` | Form inputs, admin plate, theme menu |
| Notation page | `{colors.surface-page}` #ffffff | Viewer inner page, preview thumbnail inner frame |
| Row hover | `{colors.canvas-soft}` tint | Contents list rows (no card shadow) |

No pastel gradient orbs. No neon glow.

## Shapes

| Token | Value | Use |
| --- | --- | --- |
| `{rounded.md}` | 8px | Form inputs |
| `{rounded.xl}` | 16px | Viewer shell, preview frame |
| `{rounded.pill}` | 9999px | CTAs, tag pills |

## Components

### `top-nav`

Background `{colors.canvas}`, height 64px. Geist wordmark left; optional `Catalog` label; **Appearance** menu (Light / Dark / System) and Admin link right. No decorative clef.

Maps to: [`components/site-header.tsx`](../components/site-header.tsx)

### `theme-switch`

Header text menu (not a sun/moon icon). Trigger shows current choice (`Light`, `Dark`, or `System`). Persists to `localStorage['clear-clef-theme']`. Also on admin protected header and auth shell.

Maps to: [`components/theme-menu.tsx`](../components/theme-menu.tsx), [`lib/theme.ts`](../lib/theme.ts)

### `catalog-hero`

Left-aligned Geist H1 ("Score catalog") + one sentence (max ~20 words). No eyebrow, no CTA strip.

### `filter-bar`

Quiet row: key, difficulty, license, tag. Labels above selects. No heavy bordered panel.

Maps to: [`components/catalog/catalog-filters.tsx`](../components/catalog/catalog-filters.tsx)

### `contents-list`

Credit-grouped catalog index. Group head in Geist `{typography.group-label}`. Each row: work title, optional metadata line, difficulty and tags. Hairline dividers. Page-1 preview thumbnail at desktop right.

Maps to: [`app/(site)/page.tsx`](../app/(site)/page.tsx)

### `contents-row`

Single row inside `contents-list`. No card wrapper. Clickable row spans title block and optional preview.

### `score-header` (detail)

Credit line, Geist work title, metadata dl (key, time, difficulty). Musical tag pills only. License **not** pill-styled here.

Maps to: [`app/(site)/scores/[slug]/page.tsx`](../app/(site)/scores/[slug]/page.tsx)

### `rights-line`

Below the viewer on score detail. Geist Mono: license (required), source URL if present. Functional metadata, not a plate mark.

Maps to: [`components/score/ScoreRights.tsx`](../components/score/ScoreRights.tsx)

### `viewer-stand`

**Lamp model:** outer shell `{colors.canvas}`; inner page always `{colors.surface-page}` (#ffffff). Top bar: page index in Geist Mono (`3 / 12`). Previous / Next as outline pills. Loading: "Preparing the score." Skeleton matches page rectangle. Never invert SVG.

Maps to: [`components/score/ScoreViewer.tsx`](../components/score/ScoreViewer.tsx)

### `button-primary`

Ink pill. Background `{colors.primary}` (light) or `{colors.primary-dark}` (dark), height 40px, `{rounded.pill}`.

### `button-outline`

Transparent pill, 1px `{colors.hairline-strong}` border, ink text.

### `admin-shell`

Back-of-house. Geist forms, required license field. No library ornament.

## Do's and don'ts

### Do

- Reserve ink pill for primary CTAs only.
- Use Geist for all public titles and group labels.
- Use Geist Mono for catalog numbers, key, time, rights line.
- Group the catalog index by credited name with hairline-divided rows.
- Show page-1 preview in a white frame on catalog rows (desktop), even in dark mode.
- Use pill shape for CTAs and musical tag pills.
- Keep copy neutral: "Public catalog of licensed scores."

### Don't

- Don't load display serifs on public catalog surfaces.
- Don't use oversized group headings that read like collected-works chapter titles.
- Don't use card grids on the catalog index.
- Don't pill the license next to the work title.
- Don't use edition jargon in UI copy (colophon, incipit, title page, plate).
- Don't invert or CSS-filter engraved SVG.
- Don't load Verovio on catalog list pages ([rendering.md](rendering.md)).

## Responsive behavior

| Breakpoint | Key changes |
| --- | --- |
| Mobile (< 640px) | Contents rows stack; preview hidden; filters wrap |
| Tablet (640-1024px) | Preview visible; nav stays single line |
| Desktop (> 1024px) | Full contents list with preview column; max width 1200px |

Touch targets: primary pill 40px height minimum.

## CSS variable mapping

Edition tokens live in [`app/globals.css`](../app/globals.css). `--edition-surface-page` stays `#ffffff` in both modes (notation paper). `--edition-surface-card` is chrome in dark mode.

```css
:root {
  color-scheme: light;
  --edition-canvas: #f5f5f5;
  --edition-canvas-soft: #fafafa;
  --edition-ink: #0c0a09;
  --edition-surface-page: #ffffff;
  --edition-surface-card: #ffffff;
  --edition-primary: #292524;
  --edition-on-primary: #ffffff;
}

.dark {
  color-scheme: dark;
  --edition-canvas: #171412;
  --edition-canvas-soft: #1c1917;
  --edition-ink: #f5f5f4;
  --edition-surface-page: #ffffff;
  --edition-surface-card: #1c1917;
  --edition-primary: #e7e5e4;
  --edition-on-primary: #1c1917;
}
```

Tailwind utilities: `bg-edition-canvas`, `bg-edition-surface-page`, `border-edition-hairline`, `text-edition-muted`, etc.

## Known gaps

- Motion timings (row hover, page turn) out of scope for v1.
- SMuFL webfont on viewer route is optional later ([rendering.md](rendering.md)).
- Form validation states beyond focus not fully specified.
- Admin metadata edit is a follow-up.

## Provenance

- Token rhythm (ink pill, hairline rows, stone canvas) adapted from quiet product library patterns.
- ClearClef-specific: Geist-only public type, contents-list catalog, engraved SVG as row preview.
- Layout: contents list over score plate grid.
- Dark mode: lamp on a stand; full inversion rejected.
