# ClearClef design system

Visual reference for the public catalog, the score, and the register. Taken from the Red Dead Redemption menus: type sits on a near-black ground, the current item is brass, and paper appears only when the content is a document.

Tokens live in `app/globals.css`. If this document and the stylesheet disagree, the stylesheet wins. Update this file in the same change.

## The rule

Three surfaces, and nothing else.

| Surface | Class | Holds |
| --- | --- | --- |
| Ground | `surface-ground` | Navigation, indexes, chapter heads, hints, empty states |
| Folio | `surface-folio` + `on-folio` | The engraved score, and only that |
| Plate | `Plate` / `surface-board` | Forms: sign-in, upload, edit |

Do not put a list, a title, or an empty state on a plate. Do not put navigation on paper. Do not wrap a plate in a second mat.

`surface-paper`, `MarbledPanel`, tag pills, and visibility chips are retired. Do not reintroduce them.

## Type

Capitals are Bitter. Sentence case is EB Garamond. Geist Mono is for identifiers and file sizes, not for page counts or dates.

| Class | Use |
| --- | --- |
| `type-masthead`, `type-masthead-sm` | The name of a screen or a work |
| `type-eyebrow`, `type-running-head`, `type-nav-link` | Section names and index entries |
| `type-row-title` | A work title in a list |
| `type-label`, `type-value` | A register row |
| `type-shelf`, `type-extent` | Secondary facts |
| `type-hint` | An action: Back, Practice, Edit, Sign out |

Hints are words. A filled button is only for submitting a form.

## Color

Both themes are dark. Lamp (`:root`) is a warm brown-black. Night (`.dark`) is colder and nearer black. The folio paper does not change between them. Notation inside the folio is `#ffffff`.

| Role | Use | Do not use for |
| --- | --- | --- |
| Gilt | The current index entry (`nav-current`), the one brass rule under a masthead, the live hint | Large fills, body type |
| Vermilion | The bar on the wordmark | Selection, tags, a second accent |
| Warm muted | Secondary facts | A cool gray. `edition-slate` is the same warm brown |

## Layout

- One rail: `Wordmark` (bone slab, vermilion bar), site or account links, Lamp / Night / System.
- One index: a left column, about 14rem, sticky under the rail. Entries are `type-nav-link`. The current entry is `nav-current`.
- The work list starts on the same line as the index. The masthead is left-aligned over the list, not centered above the page.
- A list row is a title, a dotted leader, and the facts on the right.
- A register is `stat-row`: label left, value right, hairline underneath.
- The page container is `max-w-[1200px]`.

The catalog index filters by linking, one value at a time. Choosing the active value again clears it. Admin sections (Overview, Scores, Upload) use the same index, not a second top navigation.

## Viewer

The score controls and the page label sit on the ground. The sheet sits on the folio. Practice is the gilt hint on the score; Next is the gilt hint in practice. Previous, Close, and Retry are the same hint style. Loading uses the same frame as the loaded page.

## What stays a plate

Sign-in, upload, and edit. Popups that must float (a select menu) use `surface-board`. Everything else is type on the ground.
