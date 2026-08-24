---
quick_id: 260823-v5n
slug: colored-cat-tree-svg-and-fluid-site-wid
date: 2026-08-24
status: complete
commits:
  - a3218db feat(home) draw the cat tree in colour
  - c6ec467 style(layout) let the page width follow the screen
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
