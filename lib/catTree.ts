/**
 * The cat tree on the home page, drawn with Canvas 2D primitives.
 *
 * Traced from Heidi's drawing and coloured in brand tokens. It is drawn in code
 * rather than committed as a PNG, per the no-images rule in CLAUDE.md, and on a
 * canvas rather than as SVG to match how `lib/avatar/placeholder.ts` already
 * draws the cats.
 *
 * The original is line art, and it stays line art here: interiors are kept pale
 * so the outline does the describing, and colour is spent only on the perches,
 * the sling and the pom-poms. Filling every region solid turns the lower half
 * into one beige slab and loses the drawing.
 *
 * All coordinates below are in TREE_VIEWBOX space. The caller scales the
 * context, so nothing here needs to know the rendered size.
 */

export const TREE_VIEWBOX = { width: 800, height: 1264 }

// ─── Palette ────────────────────────────────────────────────────────────────
const INK = '#6B4A34' // brand-brown
const SISAL = '#E7C9A9' // brand-tan
const ACCENT = '#F26A1B' // brand-orange
const SLATE = '#7FA6BE' // brand-slate, lightened so the box does not dominate
const PANEL = '#FBF1E6' // barely off-white, so the cubby reads as open
const HOLLOW = '#4A3527' // openings — dark enough to read as depth

/**
 * Named spots on the drawing, for the nav pills to hang off. Exported so the
 * component positions buttons against the same coordinates the artwork uses
 * instead of a second set of magic numbers that can drift out of step.
 */
export const TREE_ANCHORS = {
  topPerch: { x: 526, y: 44 },
  leftPerch: { x: 264, y: 228 },
  boxDoor: { x: 527, y: 460 },
  crescent: { x: 140, y: 610 },
  lowShelf: { x: 194, y: 806 },
  hammock: { x: 452, y: 928 },
} as const

export type TreeAnchor = keyof typeof TREE_ANCHORS

/** Trace a path, optionally fill it, then ink the outline. */
function shape(ctx: CanvasRenderingContext2D, trace: () => void, fill?: string) {
  ctx.beginPath()
  trace()
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  ctx.stroke()
}

/** A four-cornered slab — posts and perches are all this shape. */
function slab(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fill: string,
) {
  shape(ctx, () => {
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y1)
    ctx.lineTo(x2, y2)
    ctx.lineTo(x1, y2)
    ctx.closePath()
  }, fill)
}

export function drawCatTree(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = INK
  ctx.lineWidth = 7
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // ─── Post up to the top perch ────────────────────────────────────────────
  // Drawn before the box so the box hides where it lands.
  slab(ctx, 512, 58, 562, 318, SISAL)

  // ─── Box ─────────────────────────────────────────────────────────────────
  slab(ctx, 352, 310, 702, 578, SLATE)
  // Porthole and arched door, both dark so they read as ways in. They need
  // daylight between them or the circle looks stuck to the arch.
  shape(ctx, () => ctx.arc(418, 382, 32, 0, Math.PI * 2), HOLLOW)
  shape(ctx, () => {
    ctx.moveTo(478, 578)
    ctx.lineTo(478, 452)
    ctx.quadraticCurveTo(478, 402, 532, 402)
    ctx.quadraticCurveTo(586, 402, 586, 452)
    ctx.lineTo(586, 578)
  }, HOLLOW)

  // ─── Cubby ───────────────────────────────────────────────────────────────
  // Butt-jointed to the two posts rather than overlapping them; an overlap puts
  // a seam straight down the middle of it.
  shape(ctx, () => {
    ctx.moveTo(290, 578)
    ctx.lineTo(615, 578)
    ctx.lineTo(615, 866)
    ctx.quadraticCurveTo(615, 1028, 452, 1030)
    ctx.quadraticCurveTo(290, 1028, 290, 866)
    ctx.closePath()
  }, PANEL)

  // ─── Crescent shelf, left ────────────────────────────────────────────────
  // A scoop with some belly to it. Drawn thinner it reads as a blade sticking
  // out of the post rather than as something a cat could sit in.
  shape(ctx, () => {
    ctx.moveTo(34, 578)
    ctx.quadraticCurveTo(78, 664, 172, 660)
    ctx.quadraticCurveTo(240, 654, 250, 588)
    ctx.lineTo(250, 578)
    ctx.closePath()
  }, SISAL)

  // ─── Posts carrying down to the floor ────────────────────────────────────
  slab(ctx, 240, 240, 290, 1180, SISAL)
  slab(ctx, 615, 580, 665, 1180, SISAL)
  // Side ledge. A bare line here just reads as a stray dash.
  slab(ctx, 665, 752, 786, 774, SISAL)

  // ─── Shelf line the box and crescent sit on ──────────────────────────────
  shape(ctx, () => {
    ctx.moveTo(30, 576)
    ctx.lineTo(702, 578)
  })

  // ─── Perches ─────────────────────────────────────────────────────────────
  slab(ctx, 390, 26, 662, 62, ACCENT)
  slab(ctx, 126, 210, 402, 246, ACCENT)
  slab(ctx, 130, 795, 258, 817, ACCENT)

  // ─── Hammock sling ───────────────────────────────────────────────────────
  // Nested into the base of the cubby. Slung higher it floats in the middle of
  // a pale empty box.
  shape(ctx, () => {
    ctx.moveTo(292, 862)
    ctx.quadraticCurveTo(452, 1012, 613, 862)
    ctx.quadraticCurveTo(452, 946, 292, 862)
    ctx.closePath()
  }, ACCENT)

  // ─── Dangling pom-poms ───────────────────────────────────────────────────
  shape(ctx, () => {
    ctx.moveTo(648, 62)
    ctx.lineTo(650, 163)
  })
  shape(ctx, () => ctx.arc(650, 197, 33, 0, Math.PI * 2), ACCENT)
  shape(ctx, () => {
    ctx.moveTo(135, 817)
    ctx.lineTo(132, 905)
  })
  shape(ctx, () => ctx.arc(132, 940, 33, 0, Math.PI * 2), SLATE)

  // ─── Floor ───────────────────────────────────────────────────────────────
  ctx.lineWidth = 10
  shape(ctx, () => {
    ctx.moveTo(175, 1182)
    ctx.lineTo(690, 1180)
  })
  ctx.lineWidth = 7
}
