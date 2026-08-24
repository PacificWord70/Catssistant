'use client'

import { useEffect, useRef } from 'react'
import { TREE_VIEWBOX, drawCatTree } from '@/lib/catTree'

interface Props {
  /** Rendered width in CSS pixels. Height follows from the drawing's ratio. */
  width: number
  className?: string
}

/**
 * The home page cat tree, rendered on a canvas.
 *
 * Same two-stage scaling as CatAvatar: the buffer is sized in device pixels so
 * it stays sharp on retina screens, and the context is then scaled so the
 * drawing code can work in TREE_VIEWBOX coordinates at any rendered size. The
 * drawing is taller than it is wide, so the two axes scale by the same factor
 * rather than CatAvatar's single square ratio.
 */
export default function CatTreeCanvas({ width, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const height = (width * TREE_VIEWBOX.height) / TREE_VIEWBOX.width

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr

    // Reset any transform left from a previous draw before re-applying, so
    // repeated renders don't compound the scale.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(dpr, dpr)
    ctx.scale(width / TREE_VIEWBOX.width, width / TREE_VIEWBOX.width)

    drawCatTree(ctx)
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="A cat tree with perches, a box, a hammock and two dangling pom-poms"
      style={{ width: `${width}px`, height: `${height}px`, display: 'block' }}
    />
  )
}
