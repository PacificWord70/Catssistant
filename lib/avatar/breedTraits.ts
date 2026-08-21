import { CoatLength } from '@/types/cat'

/**
 * What each breed looks like, reduced to the three things an avatar can show.
 *
 * The avatar draws a head at 28px in the nav and 128px in a card. At those
 * sizes most breed detail is invisible — coat sheen, body length, tail set all
 * vanish. Three traits survive, so those are the only ones recorded here:
 * face shape, hair length, and pattern.
 *
 * Face and hair are properties of the *breed* — every Persian has a flat face.
 * Pattern mostly is not: a Maine Coon can be any colour or marking. The
 * exception is breeds defined by their coat, like Siamese or Bengal, where the
 * pattern is part of what makes it that breed. Those carry a `pattern`; the
 * rest leave it undefined, meaning "whatever the owner picked".
 */

/**
 * Head silhouettes, chosen for what reads at icon size rather than for how
 * breeders classify cats.
 *
 * Cat fanciers group breeds by *body* type — cobby, foreign, oriental. That is
 * the wrong axis here, because the avatar never draws a body. Ear shape and
 * muzzle length are what survive being shrunk to 28px.
 */
export type FaceShape = 'Round' | 'Wedge' | 'Flat' | 'BigEars' | 'Folded'

/**
 * Patterns a breed is defined by. Kept as its own list rather than reusing
 * CoatPattern, because these describe the *breed* while CoatPattern describes
 * an individual cat, and the two lists only partly overlap.
 *
 * 'Ticked' and 'Spotted' have no CoatPattern equivalent yet — adding them there
 * is a separate decision, since it changes the options in the cat form.
 */
export type BreedPattern = 'Colorpoint' | 'Spotted' | 'Ticked' | 'Solid'

export interface BreedTraits {
  face: FaceShape
  hair: CoatLength
  /** Only set when the breed is defined by its coat. Undefined means it varies. */
  pattern?: BreedPattern
  /** Why this breed sits where it does, when the placement is not obvious. */
  note?: string
}

/**
 * Keyed by the exact `name` strings in lib/breeds.ts, so a typo here fails to
 * match rather than silently mis-drawing a cat. Every breed in BREEDS has an
 * entry.
 */
export const BREED_TRAITS: Record<string, BreedTraits> = {
  Abyssinian: { face: 'Wedge', hair: 'Short', pattern: 'Ticked' },
  'American Shorthair': { face: 'Round', hair: 'Short' },
  Balinese: { face: 'Wedge', hair: 'Long', pattern: 'Colorpoint' },
  Bengal: { face: 'Wedge', hair: 'Short', pattern: 'Spotted' },
  Bombay: { face: 'Round', hair: 'Short', pattern: 'Solid' },
  Burmese: { face: 'Round', hair: 'Short', pattern: 'Solid' },
  Birman: { face: 'Round', hair: 'Long', pattern: 'Colorpoint' },
  Chartreux: { face: 'Round', hair: 'Short', pattern: 'Solid' },
  'Cornish Rex': { face: 'BigEars', hair: 'Short' },
  'Devon Rex': { face: 'BigEars', hair: 'Short' },
  'British Shorthair': { face: 'Round', hair: 'Short' },
  'Domestic Shorthair': { face: 'Round', hair: 'Short' },
  'Domestic Longhair': { face: 'Round', hair: 'Long' },
  'Egyptian Mau': { face: 'Wedge', hair: 'Short', pattern: 'Spotted' },
  Himalayan: { face: 'Flat', hair: 'Long', pattern: 'Colorpoint' },
  'Maine Coon': {
    face: 'Wedge',
    hair: 'Long',
    note: 'Squarer muzzle than a true wedge, but the long-hair ruff is what reads at icon size.',
  },
  Persian: { face: 'Flat', hair: 'Long' },
  Ragdoll: { face: 'Round', hair: 'Long', pattern: 'Colorpoint' },
  Manx: {
    face: 'Round',
    hair: 'Short',
    note: 'Defined by taillessness, which a head-only avatar cannot show.',
  },
  'Oriental Shorthair': { face: 'Wedge', hair: 'Short' },
  'Russian Blue': { face: 'Wedge', hair: 'Short', pattern: 'Solid' },
  'Scottish Fold': {
    face: 'Folded',
    hair: 'Short',
    note: 'Long-haired folds exist, but the ears are the recognisable part.',
  },
  Siamese: { face: 'Wedge', hair: 'Short', pattern: 'Colorpoint' },
  Siberian: { face: 'Round', hair: 'Long' },
  Savannah: { face: 'Wedge', hair: 'Short', pattern: 'Spotted' },
  Singapura: { face: 'Round', hair: 'Short', pattern: 'Ticked' },
  Sphynx: { face: 'BigEars', hair: 'Hairless' },
  Tonkinese: { face: 'Wedge', hair: 'Short', pattern: 'Colorpoint' },
  'Turkish Angora': { face: 'Wedge', hair: 'Long' },
}

/** Used when a cat has no breed recorded, or a breed with no entry above. */
export const DEFAULT_TRAITS: BreedTraits = { face: 'Round', hair: 'Short' }

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
