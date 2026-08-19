import { Cat, CoatLength, CoatPattern } from '@/types/cat'
import { CoatPalette, EYE_IRIS, EYE_PUPIL, HAIRLESS_PALETTE, NOSE_PINK, paletteFor } from '@/lib/avatar/palette'

/**
 * Code-drawn stand-in cat, built entirely from Canvas 2D primitives so the
 * repo carries no image files. Real hand-drawn layers replace this later
 * without touching the component that calls it (see artLayers.ts).
 *
 * Everything here draws inside a 100x100 box. The caller scales that box to
 * whatever pixel size it needs, which is why no function below mentions the
 * rendered size — the drawing is resolution independent, and one code path
 * serves the 28px icon and the 220px profile portrait alike.
 */
export const AVATAR_VIEWBOX = 100

/** Head geometry, shared by the silhouette, the fur ruff, and the clip path. */
const HEAD = { cx: 50, cy: 56, rx: 31, ry: 28 }

/**
 * Builds the head outline as a reusable Path2D.
 *
 * Returning a path rather than drawing immediately means the same shape can be
 * filled once and then reused as a *clipping region*, so markings drawn
 * afterwards get trimmed to the head instead of spilling past the edge. That
 * saves working out where each stripe should stop.
 */
function headPath(): Path2D {
  const p = new Path2D()
  p.ellipse(HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, 0, 0, Math.PI * 2)
  return p
}

/** One ear as a rounded triangle, mirrored by passing a negative direction. */
function drawEar(ctx: CanvasRenderingContext2D, palette: CoatPalette, dir: 1 | -1) {
  const baseX = HEAD.cx + dir * 19
  ctx.beginPath()
  ctx.moveTo(baseX - dir * 12, HEAD.cy - 18)
  ctx.quadraticCurveTo(baseX + dir * 4, HEAD.cy - 42, baseX + dir * 11, HEAD.cy - 16)
  ctx.closePath()
  ctx.fillStyle = palette.base
  ctx.fill()

  // Inner ear, inset and warmer.
  ctx.beginPath()
  ctx.moveTo(baseX - dir * 7, HEAD.cy - 19)
  ctx.quadraticCurveTo(baseX + dir * 3, HEAD.cy - 34, baseX + dir * 6, HEAD.cy - 18)
  ctx.closePath()
  ctx.fillStyle = NOSE_PINK
  ctx.fill()
}

/**
 * Fur along the silhouette. Long coats get a visible ruff of spikes, medium a
 * subtler one, short and hairless none — this is the main way coat length
 * shows up in the drawing.
 *
 * The spikes are placed with trigonometry around the head ellipse rather than
 * hand-positioned, so they stay evenly spaced and follow the outline.
 */
function drawFurRuff(ctx: CanvasRenderingContext2D, palette: CoatPalette, coatLength?: CoatLength) {
  const spikeLength = coatLength === 'Long' ? 7 : coatLength === 'Medium' ? 3.5 : 0
  if (spikeLength === 0) return

  const spikes = 34
  ctx.beginPath()
  for (let i = 0; i < spikes; i++) {
    // Two angles per spike: one at the base, one at the tip between them.
    const a1 = (i / spikes) * Math.PI * 2
    const a2 = ((i + 0.5) / spikes) * Math.PI * 2
    const outer = 1 + spikeLength / 26

    const x1 = HEAD.cx + Math.cos(a1) * HEAD.rx
    const y1 = HEAD.cy + Math.sin(a1) * HEAD.ry
    const x2 = HEAD.cx + Math.cos(a2) * HEAD.rx * outer
    const y2 = HEAD.cy + Math.sin(a2) * HEAD.ry * outer

    if (i === 0) ctx.moveTo(x1, y1)
    else ctx.lineTo(x1, y1)
    ctx.lineTo(x2, y2)
  }
  ctx.closePath()
  ctx.fillStyle = palette.shade
  ctx.fill()
}

/**
 * Coat markings, drawn inside a clip of the head so nothing escapes the
 * outline. Each pattern is a few shapes — enough to be recognisable at card
 * size without pretending to be real art.
 */
function drawPattern(ctx: CanvasRenderingContext2D, pattern: CoatPattern | undefined, palette: CoatPalette) {
  if (!pattern || pattern === 'Solid') return

  ctx.save()
  ctx.clip(headPath())

  switch (pattern) {
    case 'Tabby': {
      // The forehead 'M' every tabby has, plus a few cheek bars.
      ctx.strokeStyle = palette.shade
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(42, 38); ctx.lineTo(45, 32); ctx.lineTo(48, 38)
      ctx.moveTo(52, 38); ctx.lineTo(55, 32); ctx.lineTo(58, 38)
      ctx.moveTo(24, 52); ctx.lineTo(15, 49)
      ctx.moveTo(24, 60); ctx.lineTo(15, 59)
      ctx.moveTo(76, 52); ctx.lineTo(85, 49)
      ctx.moveTo(76, 60); ctx.lineTo(85, 59)
      ctx.stroke()
      break
    }
    case 'Tuxedo': {
      // White muzzle and chest over the darker base.
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.ellipse(50, 70, 17, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'Calico': {
      // Distinct orange and black patches on a lighter ground.
      ctx.fillStyle = '#E08A45'
      ctx.beginPath()
      ctx.ellipse(33, 42, 15, 13, -0.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3A3A3E'
      ctx.beginPath()
      ctx.ellipse(70, 46, 13, 15, 0.5, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'Tortoiseshell': {
      // Mottled rather than patched — more, smaller, overlapping blotches.
      const blotches: [number, number, number][] = [
        [34, 40, 11], [66, 38, 9], [30, 66, 8], [70, 68, 10], [50, 34, 7],
      ]
      ctx.fillStyle = '#3A3A3E'
      for (const [x, y, r] of blotches) {
        ctx.beginPath()
        ctx.ellipse(x, y, r, r * 0.85, 0.3, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'Colorpoint': {
      // Dark mask around the muzzle, the giveaway of a pointed cat.
      ctx.fillStyle = palette.shade
      ctx.beginPath()
      ctx.ellipse(50, 66, 20, 16, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }
  }

  ctx.restore()
}

/** Eyes, nose, mouth, whiskers — identical for every cat. */
function drawFace(ctx: CanvasRenderingContext2D, palette: CoatPalette) {
  for (const dir of [-1, 1] as const) {
    const ex = HEAD.cx + dir * 12

    ctx.fillStyle = EYE_IRIS
    ctx.beginPath()
    ctx.ellipse(ex, 52, 6.5, 7.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Vertical slit pupil, the detail that reads as "cat" more than any other.
    ctx.fillStyle = EYE_PUPIL
    ctx.beginPath()
    ctx.ellipse(ex, 52, 2.2, 6.4, 0, 0, Math.PI * 2)
    ctx.fill()

    // Catchlight, offset up and left so both eyes look lit from one source.
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.ellipse(ex - 2.2, 49, 1.6, 1.8, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = NOSE_PINK
  ctx.beginPath()
  ctx.moveTo(50, 64)
  ctx.lineTo(46.5, 60.5)
  ctx.lineTo(53.5, 60.5)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = palette.shade
  ctx.lineWidth = 1.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(50, 64); ctx.quadraticCurveTo(45, 69, 41, 65)
  ctx.moveTo(50, 64); ctx.quadraticCurveTo(55, 69, 59, 65)
  ctx.stroke()

  ctx.lineWidth = 0.9
  ctx.globalAlpha = 0.65
  ctx.beginPath()
  for (const dir of [-1, 1] as const) {
    for (const dy of [-3, 0, 3]) {
      ctx.moveTo(HEAD.cx + dir * 15, 63 + dy)
      ctx.lineTo(HEAD.cx + dir * 34, 60 + dy * 1.8)
    }
  }
  ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * Draws the whole cat. Assumes the context has already been scaled so that
 * 0..100 covers the visible area — see setupCanvas in CatAvatar.
 *
 * Order matters: ruff sits behind the head so only the spike tips show, ears
 * go behind too so the head overlaps their bases, then markings are clipped
 * to the head, and the face lands on top.
 */
export function drawPlaceholderCat(
  ctx: CanvasRenderingContext2D,
  cat: Pick<Cat, 'color' | 'pattern' | 'coatLength'>,
) {
  // Hairless cats show skin, so coat colour doesn't apply to them.
  const palette = cat.coatLength === 'Hairless' ? HAIRLESS_PALETTE : paletteFor(cat.color)

  drawFurRuff(ctx, palette, cat.coatLength)
  drawEar(ctx, palette, -1)
  drawEar(ctx, palette, 1)

  ctx.fillStyle = palette.base
  ctx.fill(headPath())

  drawPattern(ctx, cat.pattern, palette)
  drawFace(ctx, palette)
}
