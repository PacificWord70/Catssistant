---
quick_id: 260823-v5n
slug: colored-cat-tree-svg-and-fluid-site-wid
date: 2026-08-24
status: complete
commits:
  - a3218db feat(home) draw the cat tree in colour
  - c6ec467 style(layout) let the page width follow the screen
  - a3cb603 feat(home) colour in the cat tree drawing itself
---

# Summary

## What shipped

**The cat tree, drawn in colour on a canvas.** `lib/catTree.ts` holds the
drawing and the named anchor points; `components/CatTreeCanvas.tsx` is the
canvas element; `components/CatTree.tsx` maps buttons onto anchors.
`/images/cat-tree.png` is no longer referenced.

**Fluid shell width.** `app/layout.tsx` and `components/NavBar.tsx` moved off
`max-w-5xl` onto a container that grows with the viewport and caps near 1900px.

## Deviations from plan

**SVG → canvas.** The plan chose inline SVG. The first render was bad and Heidi
asked for canvas instead. Canvas also matches `lib/avatar/placeholder.ts`, so
the repo now has one drawing approach rather than two. The `.gitignore`
reasoning that drove the original SVG decision applies equally to a `.ts` file
of drawing calls, so nothing was lost.

## What actually went wrong, and the fix

The first attempt was bad because **it was drawn blind** — coordinates guessed
from the source image and never once looked at. Screenshots were unavailable
(the Browser pane is not displayed on Heidi's end, so the page does not
composite frames), so there was no feedback loop at all.

Two things fixed it:

1. **A preview harness** (`scratchpad/preview.js`): a mock
   `CanvasRenderingContext2D` that records calls from the *real* `drawCatTree()`
   and emits SVG, rasterised with the `sharp` already in `node_modules`. It
   previews the shipping code rather than a copy of it, so it cannot drift. This
   is worth rebuilding for any future drawing work.
2. **Rendering the anchor points on top of the drawing**, which caught `hammock`
   sitting in empty space below the sling rather than on it.

The substantive drawing lesson: the source is line art, and filling every region
with a solid colour destroys it. The lower half became one beige slab with the
sling invisible inside it. Interiors have to stay pale so the outline describes
the shape, with colour spent only on perches, sling and pom-poms.

## Verification

- `tsc --noEmit` clean; `eslint` clean except a pre-existing `<img>` warning on
  the logo
- All six nav pills land exactly on their anchor coordinates
- 1920px viewport: main and nav containers both 1760px (92% of screen), no
  horizontal overflow
- 375px viewport: canvas shrinks to 303px CSS with a 606px buffer — the
  ResizeObserver and device-pixel-ratio handling both work, no overflow

## Follow-ups

- **Button placement is provisional.** Heidi will assign which nav item sits on
  which anchor now that she can see it. That is a one-word change per button in
  `PERCHES`.
- **`public/images/cat-tree.png` is now unreferenced** but still tracked (it
  predates the no-images rule). Left in place deliberately — deleting a tracked
  file was not asked for.
- Nothing has been pushed.


## Correction — the tree was redone a third time

Heidi asked why the avatar work went well and this did not. The answer is that
**the cats were never drawn by the code.** She exported the artwork and the code
only tinted and layered her PNGs, so the geometry was always hers. The tree was
traced by eye from her image, which made it an imitation of the drawing rather
than the drawing. Canvas versus SVG was never the issue; re-deriving her
linework was.

The fix, on her instruction: keep her lines exactly, change only the colours.

**How.** Her source line art is flood-filled by enclosed region — connected
components of non-line pixels are labelled, each is assigned a brand token, and
line pixels are never written to. Anti-aliased pixels are blended toward the
fill by their own lightness rather than snapped to one side, so edges stay
smooth. Regions left open: the surround and the space under the hammock.

The region-labelling pass also numbers the spots, which is what the nav buttons
hang off (1 top perch, 2 left perch, 3 box doorway, 4 crescent shelf, 5 low
shelf, 6 hammock).

Scripts live in the session scratchpad (`regions.js`, `colorize.js`). Worth
keeping the technique in mind: for any future artwork, label the regions, look
at the numbered map, then assign colours — do not re-draw by hand.

`lib/catTree.ts` and `components/CatTreeCanvas.tsx` were deleted; the traced
drawing they held is gone.

### Also found

- `public/images/cat-tree.png` had **never been committed** — it matched the
  blanket `*.png` ignore, so the home page's main navigation image existed only
  on Heidi's machine. The replacement carries an explicit gitignore exception,
  matching the precedent set for the avatar layers and the About-page photos.
- The old (pre-replacement) tree image is backed up in the session scratchpad as
  `cat-tree-OLD-backup.png`. It was untracked, so git cannot recover it.
- Pre-existing and unrelated: `/cats` logs a hydration error for nested `<a>`
  elements — `CatCard` wraps the card in a `Link` and `BreedTag` renders another
  `Link` inside it — plus one 404. Not touched here.
