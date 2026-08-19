'use client'

import { useEffect, useRef } from 'react'
import { Cat } from '@/types/cat'
import { AVATAR_VIEWBOX, drawPlaceholderCat } from '@/lib/avatar/placeholder'
import { coatLabel } from '@/lib/utils'

interface Props {
  /** Only the fields that affect the drawing, so any cat-shaped object works. */
  cat: Pick<Cat, 'name' | 'color' | 'pattern' | 'coatLength'>
  /** Rendered width and height in CSS pixels. The drawing scales to fit. */
  size?: number
  className?: string
}

/**
 * Prepares a canvas for drawing and returns its context.
 *
 * Two scaling problems get solved here, and they compound:
 *
 * 1. Device pixel ratio. A canvas has a drawing buffer (`width`/`height`) and
 *    a display size (CSS width/height). Set only the CSS size and the browser
 *    stretches a 96x96 buffer across 192 physical pixels on a retina screen,
 *    which looks blurry. So the buffer is sized in *device* pixels and the
 *    context scaled by the same ratio, leaving drawing code in CSS pixels.
 *
 * 2. Design size vs render size. On top of that, the context is scaled so the
 *    100x100 space the drawing code uses maps onto whatever `size` was asked
 *    for. That is what lets one set of drawing functions serve a 28px icon and
 *    a 220px portrait with no branching.
 */
function setupCanvas(canvas: HTMLCanvasElement, size: number): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const dpr = window.devicePixelRatio || 1
  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`

  // Reset any transform left from a previous draw before re-applying, so
  // repeated renders don't compound the scale.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.scale(dpr, dpr)
  ctx.scale(size / AVATAR_VIEWBOX, size / AVATAR_VIEWBOX)

  return ctx
}

/**
 * Per-cat avatar rendered on a canvas.
 *
 * Currently always draws the code-drawn placeholder. Hand-drawn art layers get
 * layered in next, and the swap happens inside this effect — nothing that
 * renders a CatAvatar has to change.
 */
export default function CatAvatar({ cat, size = 96, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Pulled out so the effect can depend on the three values that actually
  // change the drawing. Depending on `cat` itself would redraw on every parent
  // render, because callers build cat objects inline and object identity
  // changes each time even when the contents are the same.
  const { color, pattern, coatLength } = cat

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, size)
    if (!ctx) return
    drawPlaceholderCat(ctx, { color, pattern, coatLength })
  }, [color, pattern, coatLength, size])

  // A canvas is invisible to screen readers, so describe what was drawn.
  const description = [coatLabel(cat), cat.coatLength && `${cat.coatLength.toLowerCase()} coat`]
    .filter(Boolean)
    .join(', ')

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={description ? `${cat.name}: ${description}` : `${cat.name}`}
      className={className}
    />
  )
}
