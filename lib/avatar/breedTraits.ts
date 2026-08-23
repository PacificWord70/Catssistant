import { CoatLength } from '@/types/cat'

/**
 * What each breed looks like, reduced to the three things an avatar can show.
 *
 * The avatar draws a head at 28px in the nav and 128px in a card. At those
 * sizes most breed detail is invisible — coat sheen, body length, tail set all
 * vanish. Three traits survive, so those are the only ones recorded: face
 * shape, hair length, and pattern.
 *
 * Every category holds at least two breeds. A category of one is not worth a
 * drawing, so single breeds are approximated into the closest group and the
 * compromise is noted on the entry. Losing a Scottish Fold's ears costs less
 * than a whole drawing used once.
 */

/**
 * Head silhouettes, chosen for what reads at icon size rather than for how
 * breeders classify cats.
 *
 * Cat fanciers group breeds by *body* type — cobby, foreign, oriental. That is
 * the wrong axis here, because the avatar never draws a body. Ear size and
 * muzzle length are what survive being shrunk to 28px.
 */
export type FaceShape = 'Round' | 'Wedge' | 'Flat' | 'BigEars'

/**
 * Hair as the artwork treats it: an overlay on top of a face, not part of it.
 *
 * Three buckets rather than the five in CoatLength, because 'Medium' and
 * 'Unknown' have no drawing of their own — a medium coat reads as short once
 * shrunk, so it borrows that overlay. Keeping this separate from CoatLength
 * means the stored data stays as precise as the owner entered it, and only the
 * drawing rounds off.
 */
export type DrawHair = 'Long' | 'Short' | 'None'

/**
 * Pattern groups that get their own artwork.
 *
 * 'Ticked' is deliberately absent. An Abyssinian's coat is banded hair by hair
 * with no marking shape at all, so at icon size it reads as a plain warm cat —
 * 'Solid' draws it correctly by drawing nothing.
 */
export type DrawPattern = 'Solid' | 'Tabby' | 'Spotted' | 'Colorpoint'

export interface BreedTraits {
  face: FaceShape
  hair: DrawHair
  /**
   * The pattern the breed always carries. Undefined means it varies by cat, so
   * whatever the owner picked is used instead.
   */
  pattern?: DrawPattern
  /** Records what was given up when a breed was approximated into a group. */
  note?: string
}

/**
 * Keyed by the exact `name` strings in lib/breeds.ts, so a typo here fails to
 * match rather than silently mis-drawing a cat. Every breed in BREEDS has an
 * entry.
 */
export const BREED_TRAITS: Record<string, BreedTraits> = {
  // ─── Round ──────────────────────────────────────────────────────────────
  'American Shorthair': { face: 'Round', hair: 'Short' },
  Birman: { face: 'Round', hair: 'Long', pattern: 'Colorpoint' },
  Bombay: { face: 'Round', hair: 'Short', pattern: 'Solid' },
  'British Shorthair': { face: 'Round', hair: 'Short' },
  Burmese: { face: 'Round', hair: 'Short', pattern: 'Solid' },
  Chartreux: { face: 'Round', hair: 'Short', pattern: 'Solid' },
  'Domestic Shorthair': { face: 'Round', hair: 'Short' },
  'Domestic Longhair': { face: 'Round', hair: 'Long' },
  Manx: {
    face: 'Round',
    hair: 'Short',
    note: 'Defined by taillessness, which a head-only avatar cannot show.',
  },
  Ragdoll: { face: 'Round', hair: 'Long', pattern: 'Colorpoint' },
  'Scottish Fold': {
    face: 'Round',
    hair: 'Short',
    note: 'Folded ears are its signature and are lost here. Its face is otherwise round, and one breed did not justify a drawing of its own.',
  },
  Siberian: { face: 'Round', hair: 'Long' },
  Singapura: {
    face: 'Round',
    hair: 'Short',
    pattern: 'Solid',
    note: 'Ticked coat has no marking shape, so Solid draws it correctly.',
  },

  // ─── Wedge ──────────────────────────────────────────────────────────────
  Abyssinian: {
    face: 'Wedge',
    hair: 'Short',
    pattern: 'Solid',
    note: 'Ticked coat has no marking shape, so Solid draws it correctly.',
  },
  Balinese: { face: 'Wedge', hair: 'Long', pattern: 'Colorpoint' },
  Bengal: { face: 'Wedge', hair: 'Short', pattern: 'Spotted' },
  'Egyptian Mau': { face: 'Wedge', hair: 'Short', pattern: 'Spotted' },
  'Maine Coon': {
    face: 'Wedge',
    hair: 'Long',
    note: 'Squarer muzzle than a true wedge, but the long ruff is what reads at icon size.',
  },
  'Oriental Shorthair': { face: 'Wedge', hair: 'Short' },
  'Russian Blue': { face: 'Wedge', hair: 'Short', pattern: 'Solid' },
  Savannah: { face: 'Wedge', hair: 'Short', pattern: 'Spotted' },
  Siamese: { face: 'Wedge', hair: 'Short', pattern: 'Colorpoint' },
  Tonkinese: { face: 'Wedge', hair: 'Short', pattern: 'Colorpoint' },
  'Turkish Angora': { face: 'Wedge', hair: 'Long' },

  // ─── Flat ───────────────────────────────────────────────────────────────
  Himalayan: { face: 'Flat', hair: 'Long', pattern: 'Colorpoint' },
  Persian: { face: 'Flat', hair: 'Long' },

  // ─── BigEars ────────────────────────────────────────────────────────────
  'Cornish Rex': {
    face: 'BigEars',
    hair: 'None',
    note: 'Has a fine curly coat, but it reads as bare skin at icon size and shares the Sphynx silhouette.',
  },
  'Devon Rex': {
    face: 'BigEars',
    hair: 'None',
    note: 'Same approximation as the Cornish Rex — sparse curls read as bare.',
  },
  Sphynx: { face: 'BigEars', hair: 'None' },
}

/** Used when a cat has no breed recorded, or a breed with no entry above. */
export const DEFAULT_TRAITS: BreedTraits = { face: 'Round', hair: 'Short' }

/**
 * Collapses the five stored coat lengths onto the three that have artwork.
 *
 * A cat's own coat length wins over its breed's, since an owner recording
 * 'Long' for a moggie knows better than the default does.
 */
export function drawHairFor(coatLength: CoatLength | undefined, fallback: DrawHair): DrawHair {
  switch (coatLength) {
    case 'Hairless':
      return 'None'
    case 'Long':
      return 'Long'
    case 'Short':
    case 'Medium':
      return 'Short'
    default:
      return fallback
  }
}

/**
 * Traits for a cat, resolved from the first breed listed.
 *
 * Cats carry `breed` as an array, so a mixed cat can name several. Drawing a
 * blend is not possible with fixed artwork, so the first entry wins — it is the
 * one the owner reached for first, and it keeps the result predictable.
 */
export function traitsForBreed(breeds: string[] | undefined): BreedTraits {
  const first = breeds?.[0]
  return (first && BREED_TRAITS[first]) || DEFAULT_TRAITS
}
