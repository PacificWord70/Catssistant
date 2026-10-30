'use client'

import { useEffect, useMemo, useState } from 'react'
import { Cat } from '@/types/cat'
import {
  DEFAULT_COLOR,
  portraitKey,
  portraitPlan,
  Pose,
  PortraitPlan,
  COAT_TONES,
} from '@/lib/portrait'
import { PORTRAIT_REGIONS } from '@/lib/portraitRegions'

interface Props {
  cat: Pick<Cat, 'name' | 'birthday' | 'breed' | 'energyLevel' | 'color' | 'pattern'>
  /** Rendered width and height in CSS pixels. The drawing is fitted inside. */
  size: number
  /**
   * The name is usually printed right beside the picture, in which case
   * reading it twice helps nobody; pass `true` to hide it from screen readers.
   */
  decorative?: boolean
  className?: string
}

/**
 * A portrait of a cat drawn from its own details (lib/portrait.ts): pose from
 * age and energy, colours from coat colour and pattern.
 *
 * The painting is Heidi's layers coloured in, never redrawn. For each pose
 * three PNGs are fetched once and kept decoded in module scope; each distinct
 * appearance is then painted once per session onto a canvas at the layers'
 * native resolution, exported as a blob, and shown through an <img>. An <img>
 * rather than a live canvas because a card grid can hold dozens of the same
 * picture, and one blob URL serves them all; native resolution rather than the
 * requested size because the browser's downscale keeps it crisp at any
 * devicePixelRatio, where a canvas sized to CSS pixels would not.
 */

const LAYER_DIR = '/images/portraits/'
/* Bumped whenever the layer files are regenerated. The file names never
   change, so without this a browser keeps serving the old lines from cache. */
const LAYER_VERSION = 14

interface PoseLayers {
  width: number
  height: number
  /** RGBA of the region map: R = region id, A = inside the cat. */
  regions: Uint8ClampedArray
  inner: HTMLImageElement
  outline: HTMLImageElement
}

const layerCache = new Map<Pose, Promise<PoseLayers>>()
const urlCache = new Map<string, Promise<string>>()

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${src}`))
    img.src = src
  })
}

function loadLayers(pose: Pose): Promise<PoseLayers> {
  let pending = layerCache.get(pose)
  if (!pending) {
    pending = (async () => {
      const [regionsImg, inner, outline] = await Promise.all([
        loadImage(`${LAYER_DIR}${pose}-regions.png?v=${LAYER_VERSION}`),
        loadImage(`${LAYER_DIR}${pose}-inner.png?v=${LAYER_VERSION}`),
        loadImage(`${LAYER_DIR}${pose}-outline.png?v=${LAYER_VERSION}`),
      ])
      const { naturalWidth: width, naturalHeight: height } = regionsImg
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      // willReadFrequently keeps the map in CPU memory, where getImageData is
      // cheap; the default GPU-backed canvas would copy it back every read.
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('No 2d context')
      ctx.drawImage(regionsImg, 0, 0)
      const regions = ctx.getImageData(0, 0, width, height).data
      return { width, height, regions, inner, outline }
    })()
    // A failed fetch should be retried on the next mount, not remembered.
    pending.catch(() => layerCache.delete(pose))
    layerCache.set(pose, pending)
  }
  return pending
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

async function paint(plan: PortraitPlan): Promise<string> {
  const layers = await loadLayers(plan.pose)
  const { width, height, regions } = layers
  const parts = PORTRAIT_REGIONS[plan.pose]
  const fallback = hexToRgb(plan.colours.body ?? COAT_TONES[DEFAULT_COLOR].base)

  // Colour per region id, resolved once rather than per pixel. A region the
  // map knows but portraitRegions does not name gets the body colour, so an
  // unnamed sliver is never a hole.
  const byId: [number, number, number][] = []
  for (const [id, part] of Object.entries(parts)) byId[Number(id)] = hexToRgb(plan.colours[part])

  const fill = new ImageData(width, height)
  const out = fill.data
  for (let i = 0; i < regions.length; i += 4) {
    const alpha = regions[i + 3]
    if (alpha === 0) continue
    const [r, g, b] = byId[regions[i]] ?? fallback
    out[i] = r
    out[i + 1] = g
    out[i + 2] = b
    // Solid, always. The lines are hard-edged and sit on top, so any softness
    // here would only let the page show through as a pale rim beside them.
    out[i + 3] = 255
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2d context')
  ctx.putImageData(fill, 0, 0)
  // Her lines go on whole, on top, at full alpha: never masked, clipped or
  // thinned. The one thing that changes is their single colour — black on a
  // dark coat, cocoa otherwise — applied to the whole layer at once.
  if (plan.showInner) ctx.drawImage(tintLines(layers.inner, plan.line), 0, 0)
  ctx.drawImage(tintLines(layers.outline, plan.line), 0, 0)

  // Trim the transparent margin so the drawing's own edges are the image's
  // edges. The cards sit every cat on the same floor, which only works if the
  // feet are at the bottom of the picture and not above a margin that differs
  // from pose to pose.
  const trimmed = trimToContent(canvas)

  const blob = await new Promise<Blob | null>(resolve => trimmed.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not export portrait')
  return URL.createObjectURL(blob)
}

/** The line layer in one flat colour, its alpha untouched. */
function tintLines(layer: HTMLImageElement, colour: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = layer.naturalWidth
  c.height = layer.naturalHeight
  const ctx = c.getContext('2d')
  if (!ctx) return c
  ctx.drawImage(layer, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = colour
  ctx.fillRect(0, 0, c.width, c.height)
  return c
}

/** A copy cropped to the painted pixels, with a small even margin. */
function trimToContent(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let x0 = canvas.width, y0 = canvas.height, x1 = -1, y1 = -1
  for (let y = 0; y < canvas.height; y++)
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] === 0) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  if (x1 < 0) return canvas
  const m = 2
  const out = document.createElement('canvas')
  out.width = x1 - x0 + 1 + m * 2
  out.height = y1 - y0 + 1 + m * 2
  out.getContext('2d')?.drawImage(canvas, x0 - m, y0 - m, out.width, out.height, 0, 0, out.width, out.height)
  return out
}

/**
 * The blob URL for an appearance, painted on first request and shared after.
 * URLs are never revoked: there are at most a few dozen distinct appearances
 * in a household, and revoking one while another card still shows it would
 * blank that card.
 */
function portraitUrl(plan: PortraitPlan): Promise<string> {
  const key = portraitKey(plan)
  let pending = urlCache.get(key)
  if (!pending) {
    pending = paint(plan)
    pending.catch(() => urlCache.delete(key))
    urlCache.set(key, pending)
  }
  return pending
}

export default function CatPortrait({ cat, size, decorative = false, className = '' }: Props) {
  const plan = useMemo(
    () => portraitPlan(cat),
    // The plan depends only on these fields; the cat object itself changes
    // identity on every store update, which would repaint for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cat.birthday, cat.breed, cat.energyLevel, cat.color, cat.pattern],
  )
  const key = portraitKey(plan)
  const [state, setState] = useState<{ key: string; url?: string; failed?: boolean }>({ key })

  useEffect(() => {
    let cancelled = false
    portraitUrl(plan)
      .then(url => {
        if (!cancelled) setState({ key, url })
      })
      .catch(() => {
        if (!cancelled) setState({ key, failed: true })
      })
    return () => {
      cancelled = true
    }
    // `key` is the plan's identity; the plan object is derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const ready = state.key === key
  // The empty box is the same size as the finished picture so nothing shifts
  // when it arrives; the cream circle is for a layer that will not load,
  // which should look like a missing picture rather than a broken one.
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {ready && state.url && (
        <img
          src={state.url}
          alt={decorative ? '' : cat.name}
          aria-hidden={decorative || undefined}
          width={size}
          height={size}
          decoding="async"
          // object-contain, never cover: the whole layer fits the square so no
          // pose loses an ear or a tail tip to the frame. A kitten sits in the
          // bottom of a wider margin, so beside an adult's card she is small —
          // the size difference says "kitten" before the age does.
          // Every cat stands on the same floor — the bottom edge of the
          // padded box — rather than floating at the centre of its frame.
          // A kitten gets a taller top margin, so she is smaller on that
          // same floor; the size difference says "kitten" before the age does.
          className={`w-full h-full object-contain object-bottom ${
            plan.pose === 'kitten' ? 'px-[20%] pt-[36%] pb-[9%]' : 'px-[8%] pt-[8%] pb-[9%]'
          }`}
        />
      )}
      {ready && state.failed && (
        <span
          role={decorative ? undefined : 'img'}
          aria-label={decorative ? undefined : cat.name}
          aria-hidden={decorative || undefined}
          className="block w-[70%] h-[70%] rounded-full bg-brand-cream border border-brand-tan/40"
        />
      )}
    </span>
  )
}
