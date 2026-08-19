import { CoatColor } from '@/types/cat'

/**
 * Coat colours the avatar's artwork gets tinted to.
 *
 * Two tones each: `base` for the body layer, `shade` for the markings layer, so
 * a pattern reads against the coat underneath it rather than disappearing into
 * it. Both are applied at runtime by artLayers.ts, which is why the hand-drawn
 * PNGs are greyscale — one body serves all six colours.
 */
export interface CoatTones {
  base: string
  shade: string
}

/**
 * Black is #3A3A3E rather than #000000. Tinting to true black flattens the
 * artwork's shading to a single silhouette, losing every feature. Real black
 * cats read as very dark grey-brown in daylight anyway, so lifting the value is
 * both more legible and closer to life.
 */
const PALETTES: Record<CoatColor, CoatTones> = {
  Black: { base: '#3A3A3E', shade: '#26262A' },
  White: { base: '#F4F1EC', shade: '#D6D0C6' },
  Gray: { base: '#9AA0A6', shade: '#6F757B' },
  Orange: { base: '#E08A45', shade: '#B96A2C' },
  Brown: { base: '#8B5E3C', shade: '#68452B' },
  Cream: { base: '#EBD9BE', shade: '#D0B892' },
}

/** Used when a cat has no colour recorded — a neutral tan. */
export const UNKNOWN_PALETTE: CoatTones = {
  base: '#C9AE93',
  shade: '#A98D71',
}

/** Hairless cats show skin rather than coat colour. */
export const HAIRLESS_PALETTE: CoatTones = {
  base: '#E5BCA8',
  shade: '#C79684',
}

export function paletteFor(color?: CoatColor): CoatTones {
  return color ? PALETTES[color] : UNKNOWN_PALETTE
}
