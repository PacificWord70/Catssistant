import { Cat, CoatLength } from '@/types/cat'
import { AVATAR_VIEWBOX } from '@/lib/avatar/placeholder'
import { tonesFor } from '@/lib/avatar/palette'
import { drawHairFor, traitsForBreed } from '@/lib/avatar/breedTraits'
import { effectiveEnergy } from '@/lib/breedDefaults'

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

type CatArtInput = Pick<Cat, 'breed' | 'color' | 'pattern' | 'coatLength' | 'energyLevel'>

/**
 * Which set of eyes to draw.
 *
 * A cat's pupils widen when it is roused — stalking, playing, startled — and
 * narrow to slits when it is settled in ordinary light. Drawing convention
 * agrees: wide eyes read as alert, narrow ones as relaxed. So the high-energy
 * cat gets the big pupils and the low-energy cat the slits, not the other way
 * round.
 *
 * The owner's own answer wins; where they left it blank effectiveEnergy falls
 * back to the breed's typical level.
 */
function eyeVariant(cat: CatArtInput): string {
  switch (effectiveEnergy(cat)) {
    case 'Low': return 'calm'
    case 'High': return 'active'
    // Medium and Unknown both land on the neutral pair.
    default: return 'normal'
  }
}

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

/**
 * Names to try for a cat's body art, best fit first.
 *
 * Breed decides the face and coat length decides the hair, so a Siamese gets a
 * wedge and a Persian a flat face rather than both getting whatever the coat
 * length happened to map to. Three shapes of name are tried in turn:
 *
 *   base-wedge-short-calm   face, hair and eyes — the fullest set
 *   base-wedge-short        face and hair, for art drawn with one pair of eyes
 *   base-wedge              face only, for art drawn as a face plus a separate ruff
 *   base-short              coat length only, the original naming
 *
 * Falling through rather than demanding an exact match means partial sets work:
 * draw two faces and every other breed still resolves to something.
 */
function baseCandidates(cat: CatArtInput): string[] {
  const traits = traitsForBreed(cat.breed)
  const face = traits.face.toLowerCase()
  const hair = drawHairFor(cat.coatLength, traits.hair).toLowerCase()
  const breedHair = traits.hair.toLowerCase()
  const eyes = eyeVariant(cat)

  const names = [`base-${face}-${hair}-${eyes}`, `base-${face}-${hair}`]

  // Owners can record a coat length the breed never comes in — a hairless
  // Siamese, a short-haired Persian — and there is no drawing for those. Rather
  // than dropping to the placeholder, keep the face and borrow the breed's own
  // hair: the face is what identifies the cat, and a wedge with the wrong coat
  // beats no cat at all.
  if (breedHair !== hair) {
    names.push(`base-${face}-${breedHair}-${eyes}`, `base-${face}-${breedHair}`)
  }

  names.push(`base-${face}`, `base-${baseVariant(cat.coatLength)}`)
  return names
}

/** First name that resolves to an image, or null when none of them do. */
async function loadFirst(names: string[]): Promise<HTMLImageElement | null> {
  for (const name of names) {
    const img = await loadLayer(name)
    if (img) return img
  }
  return null
}

export interface ArtLayers {
  base: HTMLImageElement
  pattern?: HTMLImageElement
  /** Drawn in its own colours and never tinted. See drawArtLayers. */
  features?: HTMLImageElement
}

/**
 * Resolves to null when there is no base artwork, which tells the caller to
 * fall back to the placeholder. The pattern and features layers are optional on
 * their own — a base with no matching pattern art still renders as a plain
 * coloured cat.
 */
export async function loadArtLayers(cat: CatArtInput): Promise<ArtLayers | null> {
  const candidates = baseCandidates(cat)
  const base = await loadFirst(candidates)
  if (!base) return null

  const wantsPattern = cat.pattern && cat.pattern !== 'Solid'
  const pattern = wantsPattern ? await loadLayer(`pattern-${cat.pattern!.toLowerCase()}`) : null

  // Features follow whichever base won, so the eyes line up with the face that
  // actually loaded rather than one that was only the second choice.
  const features = await loadFirst(candidates.map(n => n.replace(/^base-/, 'features-')))

  return { base, pattern: pattern ?? undefined, features: features ?? undefined }
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
  const tones = tonesFor(cat.color, cat.pattern, cat.coatLength)

  // Keyed on the image that actually loaded, not on a name derived from the
  // cat. Two cats can share a coat length and still resolve to different faces,
  // and keying on the coat length alone would hand the second one the first
  // one's tinted canvas — the wrong face in the right colour.
  const body = tintLayer(layers.base, tones.base, `${layers.base.src}:${tones.base}`)
  ctx.drawImage(body, 0, 0, AVATAR_VIEWBOX, AVATAR_VIEWBOX)

  if (layers.pattern) {
    // `marking` already accounts for the pattern: a darker tone of the coat for
    // tonal patterns like tabby, and a second hue for the two-colour ones, so
    // a tuxedo's bib comes out white instead of near-invisible dark grey.
    const markings = tintLayer(layers.pattern, tones.marking, `pattern-${cat.pattern}:${tones.marking}`)
    ctx.drawImage(markings, 0, 0, AVATAR_VIEWBOX, AVATAR_VIEWBOX)
  }

  if (layers.features) {
    // Drawn last and deliberately untinted. Multiply only ever darkens, so
    // anything left in the tinted layers takes the coat colour with it — a
    // white eye on a black cat comes out black, which is exactly wrong. Eyes,
    // nose and inner ears keep their own colours by staying out of the tint.
    ctx.drawImage(layers.features, 0, 0, AVATAR_VIEWBOX, AVATAR_VIEWBOX)
  }
}
