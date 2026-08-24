'use client'

import { useEffect, useRef, useState } from 'react'
import { Cat } from '@/types/cat'
import { AVATAR_VIEWBOX, drawPlaceholderSlot } from '@/lib/avatar/placeholder'
import { drawArtLayers, loadArtLayers } from '@/lib/avatar/artLayers'
import { effectiveAppearance } from '@/lib/breedDefaults'
import { coatLabel } from '@/lib/utils'

interface Props {
  /**
   * Only the fields that affect the drawing, so any cat-shaped object works.
   * `breed` is included because it supplies the fallbacks for the other three.
   */
  cat: Pick<Cat, 'name' | 'breed' | 'color' | 'pattern' | 'coatLength' | 'energyLevel'>
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
 * Draws an empty placeholder slot first, then swaps in hand-drawn artwork if any
 * is installed in public/art-assets, tinted to the cat's coat colour. That
 * folder is gitignored, so with no art present every cat shows the placeholder —
 * intentionally, since inventing cat art would make a stand-in look like a
 * design decision.
 */
export default function CatAvatar({ cat, size = 96, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [artLoaded, setArtLoaded] = useState(false)

  // Breed fills in whatever the owner left blank — a Russian Blue with no
  // colour recorded still draws grey. Resolved here rather than in the effect so
  // the dependency list below sees the values actually used.
  //
  // Pulled out so the effect can depend on the three values that actually
  // change the drawing. Depending on `cat` itself would redraw on every parent
  // render, because callers build cat objects inline and object identity
  // changes each time even when the contents are the same.
  const { color, pattern, coatLength } = effectiveAppearance(cat)
  const breed = cat.breed
  const energyLevel = cat.energyLevel

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas, size)
    if (!ctx) return

    // Draw the empty slot synchronously so there is never a blank frame, then
    // upgrade to hand-drawn art if any is installed. With no art present this
    // first draw is the final one.
    drawPlaceholderSlot(ctx)
    setArtLoaded(false)

    let cancelled = false
    loadArtLayers({ breed, color, pattern, coatLength, energyLevel }).then(layers => {
      // Guards a race: if the cat or size changed while the images were
      // loading, this effect has already been cleaned up and painting now
      // would put stale art on a canvas that has moved on.
      if (cancelled || !layers) return
      const artCtx = setupCanvas(canvas, size)
      if (artCtx) drawArtLayers(artCtx, layers, { breed, color, pattern, coatLength, energyLevel })
      setArtLoaded(true)
    })

    return () => { cancelled = true }
  }, [breed, color, pattern, coatLength, energyLevel, size])

  // A canvas is invisible to screen readers, so it needs describing — and the
  // description has to match whichever of the two things actually rendered.
  // With art installed that is a drawing of the cat, so it gets described. With
  // none, an empty slot is on screen and claiming a coat would be a lie.
  const coat = coatLabel({ color, pattern })
  const label = artLoaded
    ? `${cat.name} — drawing of a ${coat ? `${coat.toLowerCase()} ` : ''}cat`
    : `${cat.name} — no photo`

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={className}
    />
  )
}
