import { Cat, CoatLength } from '@/types/cat'
import { AVATAR_VIEWBOX } from '@/lib/avatar/placeholder'
import { HAIRLESS_PALETTE, paletteFor } from '@/lib/avatar/palette'

/**
 * Optional hand-drawn artwork for the avatar.
 *
 * Layers are PNGs in public/art-assets/, which is gitignored — a fresh clone
 * has none, every load fails, and CatAvatar keeps using its code-drawn
 * placeholder. Dropping real files in switches the avatar over with no code
 * change. See public/art-assets/README.md for the filenames expected.
 *
 * Art is drawn greyscale so a single base body can be tinted to any coat
 * colour, rather than needing one file per colour.
 */

type CatArtInput = Pick<Cat, 'color' | 'pattern' | 'coatLength'>

/**
 * Loaded images, keyed by layer name. Promises are cached rather than images,
 * so two avatars mounting at once share one request instead of racing.
 * A cached `null` also stops a missing layer being re-requested on every
 * render — the normal case when no art is installed.
 */
const layerCache = new Map<string, Promise<HTMLImageElement | null>>()

/** Tinted canvases, keyed by layer plus colour, so recolouring happens once. */
const tintCache = new Map<string, HTMLCanvasElement>()

function loadLayer(name: string): Promise<HTMLImageElement | null> {
  const cached = layerCache.get(name)
  if (cached) return cached

  const pending = new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    // A missing layer is the expected state, not an error worth surfacing.
    img.onerror = () => resolve(null)
    img.src = `/art-assets/${name}.png`
  })

  layerCache.set(name, pending)
  return pending
}

/**
 * Coat lengths share body art where the silhouette wouldn't differ much.
 * Unknown falls back to medium, the least distinctive option.
 */
function baseVariant(coatLength?: CoatLength): string {
  switch (coatLength) {
    case 'Hairless': return 'hairless'
    case 'Short': return 'short'
    case 'Long': return 'long'
    default: return 'medium'
  }
}

export interface ArtLayers {
  base: HTMLImageElement
  pattern?: HTMLImageElement
}

/**
 * Resolves to null when there is no base artwork, which tells the caller to
 * fall back to the placeholder. The pattern layer is optional on its own — a
 * base with no matching pattern art still renders as a plain coloured cat.
 */
export async function loadArtLayers(cat: CatArtInput): Promise<ArtLayers | null> {
  const base = await loadLayer(`base-${baseVariant(cat.coatLength)}`)
  if (!base) return null

  const wantsPattern = cat.pattern && cat.pattern !== 'Solid'
  const pattern = wantsPattern ? await loadLayer(`pattern-${cat.pattern!.toLowerCase()}`) : null

  return { base, pattern: pattern ?? undefined }
}

/**
 * Recolours a greyscale layer, on an offscreen canvas so the tint touches only
 * this image and not whatever is already on the visible canvas.
 *
 * Two composite steps are needed. `multiply` applies the colour while keeping
 * the shading in the artwork — a plain fill would flatten it — but it also
 * paints the fully transparent pixels around the drawing. `destination-in`
 * then keeps only the pixels the original image already covered, restoring the
 * alpha mask and cutting the surrounding block back out.
 */
function tintLayer(img: HTMLImageElement, color: string, cacheKey: string): HTMLCanvasElement {
  const cached = tintCache.get(cacheKey)
  if (cached) return cached

  const w = img.naturalWidth || AVATAR_VIEWBOX
  const h = img.naturalHeight || AVATAR_VIEWBOX

  const off = document.createElement('canvas')
  off.width = w
  off.height = h

  const octx = off.getContext('2d')
  if (!octx) return off

  octx.drawImage(img, 0, 0, w, h)
  octx.globalCompositeOperation = 'multiply'
  octx.fillStyle = color
  octx.fillRect(0, 0, w, h)
  octx.globalCompositeOperation = 'destination-in'
  octx.drawImage(img, 0, 0, w, h)

  tintCache.set(cacheKey, off)
  return off
}

/**
 * Composites the layers into the 100x100 space the context is already scaled
 * to, so this lines up with the placeholder it replaces.
 */
export function drawArtLayers(ctx: CanvasRenderingContext2D, layers: ArtLayers, cat: CatArtInput) {
  const palette = cat.coatLength === 'Hairless' ? HAIRLESS_PALETTE : paletteFor(cat.color)
  const variant = baseVariant(cat.coatLength)

  const body = tintLayer(layers.base, palette.base, `base-${variant}:${palette.base}`)
  ctx.drawImage(body, 0, 0, AVATAR_VIEWBOX, AVATAR_VIEWBOX)

  if (layers.pattern) {
    // Markings use the shade tone so they read against the body colour.
    const markings = tintLayer(layers.pattern, palette.shade, `pattern-${cat.pattern}:${palette.shade}`)
    ctx.drawImage(markings, 0, 0, AVATAR_VIEWBOX, AVATAR_VIEWBOX)
  }
}
