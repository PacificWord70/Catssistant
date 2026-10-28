'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * Heidi's horizontal logo recoloured to a single cream, for sitting directly
 * on the orange nav bar.
 *
 * The file is orange linework beside a brown wordmark. Neither colour has
 * anything to push against on brand-orange, and a cream chip behind it reads
 * as pasted on, so instead the file is recoloured at runtime: every pixel the
 * drawing covers becomes cream, and its coverage (the alpha) is kept exactly,
 * so the anti-aliased edges stay smooth. Nothing is redrawn — the geometry is
 * hers, only the colour changes, the same rule as lib/avatar/artLayers.ts.
 *
 * The PNG as exported has a transparent background, so the alpha channel is
 * the coverage and is used as it stands. Should it ever be re-exported on
 * opaque white, the same thing is recovered from darkness instead: a white
 * pixel is empty, a fully dark one is solid, and the partly-dark edge pixels
 * fall in between. The check is on the file's actual pixels, not its
 * declared channels, because an RGBA file can still be solid white.
 *
 * The result is kept at the file's own resolution (927x366) and only scaled
 * down by the browser, so it stays crisp at any devicePixelRatio.
 */

const SRC = '/images/logo-horizontal.png'
const CREAM = '#FFFBF6'

/** width / height of the file, so the placeholder reserves the same box. */
const ASPECT = 927 / 366

export type TintedLogoState =
  { status: 'pending' } | { status: 'ready'; url: string } | { status: 'failed' }

/**
 * One tint per session. The blob URL is cached in module scope so navigating
 * between pages, where the bar remounts, does not recolour the file again —
 * and because it is shared, it is never revoked: a later mount would be
 * handed a dead URL. The only mount that would own a URL outright is one
 * that unmounted before the tint finished, and it leaves the result in the
 * cache for the next one rather than throwing it away.
 */
let cachedUrl: string | null = null
let pending: Promise<string | null> | null = null

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`could not load ${src}`))
    img.src = src
  })
}

function tint(img: HTMLImageElement): Promise<string | null> {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return Promise.resolve(null)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  ctx.drawImage(img, 0, 0, w, h)
  const image = ctx.getImageData(0, 0, w, h)
  const px = image.data

  // Any clearly see-through pixel means the file carries its own coverage.
  let transparent = false
  for (let i = 3; i < px.length; i += 4) {
    if (px[i] < 128) {
      transparent = true
      break
    }
  }

  if (transparent) {
    // Alpha already says how much of each pixel the drawing covers. Keep it,
    // and swap the colour underneath for cream.
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = CREAM
    ctx.fillRect(0, 0, w, h)
  } else {
    // Opaque export: coverage has to come from how dark each pixel is. The
    // lines are solid colour, the ground is white, and the edge pixels the
    // exporter blended between them land in between, which is exactly the
    // alpha they should get.
    for (let i = 0; i < px.length; i += 4) {
      const lightness = (px[i] + px[i + 1] + px[i + 2]) / 3
      px[i] = 0xff
      px[i + 1] = 0xfb
      px[i + 2] = 0xf6
      px[i + 3] = 255 - lightness
    }
    ctx.putImageData(image, 0, 0)
  }

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png')
  })
}

function getTintedLogo(): Promise<string | null> {
  if (cachedUrl) return Promise.resolve(cachedUrl)
  if (pending) return pending

  pending = loadImage(SRC)
    .then(tint)
    .catch(() => null)
    .then(url => {
      cachedUrl = url
      // A failure is not cached: the next mount tries again, in case it was
      // a passing network problem rather than something wrong with the file.
      if (!url) pending = null
      return url
    })
  return pending
}

export function useTintedLogo(): TintedLogoState {
  const [state, setState] = useState<TintedLogoState>(() =>
    cachedUrl ? { status: 'ready', url: cachedUrl } : { status: 'pending' },
  )

  useEffect(() => {
    if (cachedUrl) return
    let live = true
    getTintedLogo().then(url => {
      if (!live) return
      setState(url ? { status: 'ready', url } : { status: 'failed' })
    })
    return () => {
      live = false
    }
  }, [])

  return state
}

interface Props {
  /** Rendered height in px; width follows the file's own proportions. */
  height: number
  className?: string
  /** Shown if the tint cannot be made — the untouched logo, usually. */
  fallback?: ReactNode
}

export default function TintedLogo({ height, className = '', fallback = null }: Props) {
  const state = useTintedLogo()

  if (state.status === 'failed') return <>{fallback}</>

  if (state.status === 'pending') {
    // Same box as the finished logo, so nothing beside it shifts when the
    // image arrives.
    return (
      <span
        aria-hidden="true"
        className={`inline-block ${className}`}
        style={{ height: `${height}px`, width: `${Math.round(height * ASPECT)}px` }}
      />
    )
  }

  return (
    // A blob URL from a canvas, not a file next/image could optimise.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={state.url}
      alt="Catssistant"
      height={height}
      style={{ height: `${height}px`, width: 'auto' }}
      className={className}
    />
  )
}
