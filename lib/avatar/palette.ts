import { CoatColor, CoatLength, CoatPattern } from '@/types/cat'

/**
 * Every colour the avatar can be tinted to, and the rule for which two are
 * combined when a pattern needs more than one hue.
 *
 * This file is the single place colour is decided. Artwork is drawn greyscale
 * and tinted at runtime, so changing a value here restyles every cat without
 * touching a PNG.
 */

export interface CoatTones {
  /** The body layer. */
  base: string
  /** Shading inside the body's own hue — used where a pattern stays tonal. */
  shade: string
  /**
   * What the markings layer is actually tinted with. Equal to `shade` for
   * tonal patterns, and a genuinely different hue for the two-colour ones.
   * Callers should use this rather than picking between base and shade.
   */
  marking: string
}

/**
 * Base and shade for each coat.
 *
 * Edit these freely — they are the app's whole colour identity for cats. The
 * only constraint is that `shade` stays readable against `base`, since markings
 * drawn in shade have to show up against the body.
 *
 * Black is #3A3A3E rather than #000000. Tinting to true black flattens the
 * artwork's shading to a single silhouette, losing every feature. Real black
 * cats read as very dark grey-brown in daylight anyway, so lifting the value is
 * both more legible and closer to life.
 *
 * Cat fanciers call grey "blue" and orange "red". The plain words are used here
 * because owners pick from this list, and they do not think in show terms.
 */
const PALETTES: Record<CoatColor, { base: string; shade: string }> = {
  Black: { base: '#3A3A3E', shade: '#26262A' },
  White: { base: '#F4F1EC', shade: '#D6D0C6' },
  Gray: { base: '#9AA0A6', shade: '#6F757B' },
  Orange: { base: '#E08A45', shade: '#B96A2C' },
  Brown: { base: '#8B5E3C', shade: '#68452B' },
  Cream: { base: '#EBD9BE', shade: '#D0B892' },
  Silver: { base: '#C7CBD0', shade: '#9AA1A9' },
  Chocolate: { base: '#6B4630', shade: '#4E3222' },
  Lilac: { base: '#B9A8A8', shade: '#968484' },
}

/** Used when a cat has no colour recorded — a neutral tan. */
const UNKNOWN = { base: '#C9AE93', shade: '#A98D71' }

/** Hairless cats show skin rather than coat colour. */
const HAIRLESS = { base: '#E5BCA8', shade: '#C79684' }

/**
 * Patterns that need a second, genuinely different hue rather than a darker
 * version of the coat.
 *
 * A tuxedo's bib is white, not dark grey; a tortoiseshell is black *and*
 * orange. Tinting those with `shade` renders them invisible, which is what
 * happened before this table existed. Patterns absent from this list are tonal
 * and use `shade` as before.
 */
const PATTERN_PARTNER: Partial<Record<CoatPattern, CoatColor>> = {
  Tortoiseshell: 'Orange',
  Calico: 'Orange',
  Tuxedo: 'White',
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

/**
 * Roughly how different two colours look, on a scale where 0 is identical and
 * about 765 is black against white.
 *
 * Comparing brightness alone is not enough: grey and orange sit at almost the
 * same brightness, yet an orange patch on a grey cat is obvious because the
 * hues differ. This weighted distance — the standard "redmean" approximation —
 * accounts for hue as well, which is why a grey calico keeps its orange while a
 * cream tuxedo does not keep its white.
 */
function distance(a: string, b: string): number {
  const [r1, g1, b1] = rgb(a)
  const [r2, g2, b2] = rgb(b)
  const rmean = (r1 + r2) / 2
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt(
    (2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db,
  )
}

/** Below this the markings are too close to the body to make out at icon size. */
const MIN_CONTRAST = 120

/**
 * Keeps markings visible when the partner colour is too close to the coat.
 *
 * Catches an orange tortie, where the two are identical, and also the subtler
 * case of a cream tuxedo, where a white bib is a different colour but still
 * disappears. A very pale tuxedo ends up with dark markings rather than white,
 * which is less literal but is the only version that reads — and pale tuxedos
 * barely exist in real cats, since a tuxedo is a dark cat wearing white.
 */
function resolvePartner(partner: CoatColor, base: CoatColor): CoatColor {
  if (distance(PALETTES[partner].base, PALETTES[base].base) >= MIN_CONTRAST) return partner
  return distance(PALETTES[base].base, '#FFFFFF') < distance(PALETTES[base].base, '#000000')
    ? 'Black'
    : 'White'
}

/**
 * The tones an avatar should be drawn with.
 *
 * Pattern is taken into account because the markings colour depends on it —
 * the same grey cat needs dark-grey stripes as a tabby and a white bib as a
 * tuxedo. Coat length is checked first, since a hairless cat shows skin
 * whatever colour is recorded.
 *
 * Known limitation: a true calico is three colours — white, orange, and black.
 * With one markings layer this renders as two, which reads as a tortie with the
 * coat colour showing through. Fixing it properly needs a second markings PNG.
 */
export function tonesFor(
  color?: CoatColor,
  pattern?: CoatPattern,
  coatLength?: CoatLength,
): CoatTones {
  const tones = coatLength === 'Hairless' ? HAIRLESS : color ? PALETTES[color] : UNKNOWN

  const partner = pattern && PATTERN_PARTNER[pattern]
  if (!partner || !color) return { ...tones, marking: tones.shade }

  return { ...tones, marking: PALETTES[resolvePartner(partner, color)].base }
}
