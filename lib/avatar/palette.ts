import { CoatColor } from '@/types/cat'

/**
 * Three tones per coat colour. Flat single-colour shapes read as clip art, so
 * every drawn part picks one of these: `base` for the coat, `shade` for
 * stripes and shadowed areas, `light` for the muzzle, chest, and paws.
 */
export interface CoatPalette {
  base: string
  shade: string
  light: string
}

/**
 * Note that black is #3A3A3E rather than #000000. A true-black cat drawn flat
 * loses every feature — the ears, eyes, and stripes all disappear into one
 * silhouette. Real black cats read as very dark grey-brown in daylight, so
 * lifting the value keeps the drawing legible and is closer to life anyway.
 */
const PALETTES: Record<CoatColor, CoatPalette> = {
  Black: { base: '#3A3A3E', shade: '#26262A', light: '#55555C' },
  White: { base: '#F4F1EC', shade: '#D6D0C6', light: '#FFFFFF' },
  Gray: { base: '#9AA0A6', shade: '#6F757B', light: '#BFC4C9' },
  Orange: { base: '#E08A45', shade: '#B96A2C', light: '#F2AE72' },
  Brown: { base: '#8B5E3C', shade: '#68452B', light: '#A97A55' },
  Cream: { base: '#EBD9BE', shade: '#D0B892', light: '#F9EFDE' },
}

/** Used when a cat has no colour recorded yet — a neutral tan. */
export const UNKNOWN_PALETTE: CoatPalette = {
  base: '#C9AE93',
  shade: '#A98D71',
  light: '#E2D0BB',
}

/** Skin tones for hairless cats, which show pink rather than coat colour. */
export const HAIRLESS_PALETTE: CoatPalette = {
  base: '#E5BCA8',
  shade: '#C79684',
  light: '#F5DACE',
}

export function paletteFor(color?: CoatColor): CoatPalette {
  return color ? PALETTES[color] : UNKNOWN_PALETTE
}

/** Iris colour. Not stored on the cat, so every avatar gets the same amber. */
export const EYE_IRIS = '#C9A227'
export const EYE_PUPIL = '#241F1B'
export const NOSE_PINK = '#D98C96'
