/**
 * Empty-slot placeholder for the avatar.
 *
 * Deliberately not a drawing of a cat. Until real hand-drawn art exists, this
 * marks where art *will* go without inventing any — a generated cat face would
 * read as a finished design decision and quietly become the app's look.
 *
 * So it uses the standard missing-image convention: a bordered box with a cross
 * through it. Obviously a gap, not a picture.
 *
 * Everything draws inside a 100x100 box; the caller scales that to whatever
 * pixel size it needs, so no function here mentions the rendered size.
 */
export const AVATAR_VIEWBOX = 100

const BORDER = '#E7C9A9' // brand-tan
const CROSS = '#E7C9A9'
const FILL = 'rgba(231, 201, 169, 0.14)'

const INSET = 12
const SIZE = AVATAR_VIEWBOX - INSET * 2
const RADIUS = 12

/**
 * Draws the placeholder slot. Takes no cat, because it deliberately reflects
 * nothing about the individual cat — there is no art to tint yet.
 */
export function drawPlaceholderSlot(ctx: CanvasRenderingContext2D) {
  ctx.save()

  const box = new Path2D()
  box.roundRect(INSET, INSET, SIZE, SIZE, RADIUS)

  ctx.fillStyle = FILL
  ctx.fill(box)

  ctx.strokeStyle = BORDER
  ctx.lineWidth = 2
  ctx.stroke(box)

  // Cross corner to corner, pulled in so the strokes don't collide with the
  // rounded corners.
  const pad = INSET + RADIUS * 0.8
  const far = AVATAR_VIEWBOX - pad

  ctx.strokeStyle = CROSS
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.globalAlpha = 0.55
  ctx.beginPath()
  ctx.moveTo(pad, pad)
  ctx.lineTo(far, far)
  ctx.moveTo(far, pad)
  ctx.lineTo(pad, far)
  ctx.stroke()

  ctx.restore()
}
