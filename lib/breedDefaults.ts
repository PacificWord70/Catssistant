import { Cat, CoatColor, CoatLength, CoatPattern, EnergyLevel } from '@/types/cat'
import { BREEDS } from '@/lib/breeds'

/**
 * Fills in what the owner left blank, using the breed they picked.
 *
 * Nothing here is written back to the cat. These are read-time fallbacks, the
 * same way LifeStage is derived from the birthday rather than stored — saving a
 * guess would mean the app holds data the owner never entered, which the privacy
 * rules in CLAUDE.md rule out. An owner who disagrees with a default just fills
 * the field in, and their answer wins.
 *
 * Every function takes the whole cat rather than the field, because a fallback
 * needs the breed to look anything up.
 */

const BREED_MAP = new Map(BREEDS.map(b => [b.name, b]))

/**
 * Coats that come with the breed rather than varying cat to cat. Deliberately
 * short: a Persian can be any colour, so Persian is not in here. Only breeds
 * defined by their colour belong.
 */
const BREED_COLOR: Record<string, CoatColor> = {
  Bombay: 'Black',
  'Russian Blue': 'Gray',
  Chartreux: 'Gray',
}

/**
 * The coat each breed comes with, where the breed settles it.
 *
 * Keyed by the exact `name` strings in lib/breeds.ts, so a typo here fails to
 * match rather than silently mis-describing a cat. `hair` is in three steps
 * rather than the five of CoatLength because that is all a breed standard
 * fixes: an owner can still record 'Medium' for their own cat. `pattern` is
 * only set for breeds defined by their markings; a Maine Coon can be
 * anything, so it has none.
 *
 * 'Ticked' is deliberately absent. An Abyssinian's coat is banded hair by
 * hair with no marking shape, so Solid is the nearest description.
 */
interface BreedCoat {
  hair: 'Long' | 'Short' | 'None'
  pattern?: 'Solid' | 'Tabby' | 'Spotted' | 'Colorpoint'
}

const BREED_COAT: Record<string, BreedCoat> = {
  Abyssinian: { hair: 'Short', pattern: 'Solid' },
  'American Shorthair': { hair: 'Short' },
  Balinese: { hair: 'Long', pattern: 'Colorpoint' },
  Bengal: { hair: 'Short', pattern: 'Spotted' },
  Birman: { hair: 'Long', pattern: 'Colorpoint' },
  Bombay: { hair: 'Short', pattern: 'Solid' },
  'British Shorthair': { hair: 'Short' },
  Burmese: { hair: 'Short', pattern: 'Solid' },
  Chartreux: { hair: 'Short', pattern: 'Solid' },
  'Cornish Rex': { hair: 'None' },
  'Devon Rex': { hair: 'None' },
  'Domestic Longhair': { hair: 'Long' },
  'Domestic Shorthair': { hair: 'Short' },
  'Egyptian Mau': { hair: 'Short', pattern: 'Spotted' },
  Himalayan: { hair: 'Long', pattern: 'Colorpoint' },
  'Maine Coon': { hair: 'Long' },
  Manx: { hair: 'Short' },
  'Oriental Shorthair': { hair: 'Short' },
  Persian: { hair: 'Long' },
  Ragdoll: { hair: 'Long', pattern: 'Colorpoint' },
  'Russian Blue': { hair: 'Short', pattern: 'Solid' },
  Savannah: { hair: 'Short', pattern: 'Spotted' },
  'Scottish Fold': { hair: 'Short' },
  Siamese: { hair: 'Short', pattern: 'Colorpoint' },
  Siberian: { hair: 'Long' },
  Singapura: { hair: 'Short', pattern: 'Solid' },
  Sphynx: { hair: 'None' },
  Tonkinese: { hair: 'Short', pattern: 'Colorpoint' },
  'Turkish Angora': { hair: 'Long' },
}

/** The three breed-standard steps widen back out to the stored coat lengths. */
const HAIR_TO_COAT: Record<BreedCoat['hair'], CoatLength> = {
  Long: 'Long',
  Short: 'Short',
  None: 'Hairless',
}

/** The first breed listed is the one that decides. */
function primaryBreed(cat: Pick<Cat, 'breed'>): string | undefined {
  return cat.breed?.[0]
}

/**
 * Energy level, falling back to the breed's own.
 *
 * 'Unknown' is treated as unanswered rather than as an answer — it is what the
 * dropdown shows when someone actively does not know, and a breed default is
 * more use than nothing.
 */
export function effectiveEnergy(cat: Pick<Cat, 'breed' | 'energyLevel'>): EnergyLevel {
  if (cat.energyLevel && cat.energyLevel !== 'Unknown') return cat.energyLevel
  const breed = primaryBreed(cat)
  const traits = breed ? BREED_MAP.get(breed)?.traits : undefined
  return traits?.energy ?? cat.energyLevel ?? 'Unknown'
}

/** Coat length, falling back to the breed's. */
export function effectiveCoatLength(
  cat: Pick<Cat, 'breed' | 'coatLength'>,
): CoatLength | undefined {
  if (cat.coatLength && cat.coatLength !== 'Unknown') return cat.coatLength
  const breed = primaryBreed(cat)
  const hair = breed ? BREED_COAT[breed]?.hair : undefined
  return hair ? HAIR_TO_COAT[hair] : cat.coatLength
}

/**
 * Pattern, falling back to the breed's — but only for breeds actually defined by
 * their markings. Most breeds leave this undefined because a Maine Coon can be
 * anything, and guessing would be worse than showing nothing.
 */
export function effectivePattern(cat: Pick<Cat, 'breed' | 'pattern'>): CoatPattern | undefined {
  if (cat.pattern) return cat.pattern
  const breed = primaryBreed(cat)
  const pattern = breed ? BREED_COAT[breed]?.pattern : undefined
  if (!pattern) return undefined
  switch (pattern) {
    case 'Colorpoint':
      return 'Colorpoint'
    case 'Solid':
      return 'Solid'
    // Spotted is a tabby marking; CoatPattern has no entry of its own for it
    // yet, and tabby is closer than leaving a Bengal blank.
    case 'Spotted':
      return 'Tabby'
  }
}

/**
 * Coat colour: what the owner entered, then the breed where it fixes one.
 *
 * Returns undefined when neither applies, so callers that put this on screen as
 * text can say nothing rather than invent a colour.
 */
export function effectiveColor(cat: Pick<Cat, 'breed' | 'color'>): CoatColor | undefined {
  if (cat.color) return cat.color
  const breed = primaryBreed(cat)
  return breed ? BREED_COLOR[breed] : undefined
}

/**
 * Values to drop into a blank form field when a breed is chosen.
 *
 * Unlike the effective* readers, these are meant to be *written* — the owner
 * sees them in the form and can change anything wrong before saving, so what
 * ends up stored is something they looked at and accepted rather than a guess
 * the app made behind their back.
 *
 * Only fields the breed actually settles are returned, and only where the owner
 * has not already answered. A Persian gets a coat length and nothing else,
 * because Persians come in every colour and marking.
 */
export function breedFillIns(
  cat: Pick<Cat, 'breed' | 'color' | 'pattern' | 'coatLength' | 'energyLevel'>,
): Partial<Pick<Cat, 'color' | 'pattern' | 'coatLength' | 'energyLevel'>> {
  const blank = <T>(v: T | undefined) => v === undefined || v === ('Unknown' as unknown as T)
  const fills: Partial<Pick<Cat, 'color' | 'pattern' | 'coatLength' | 'energyLevel'>> = {}

  if (blank(cat.color)) {
    const color = effectiveColor(cat)
    if (color) fills.color = color
  }
  if (blank(cat.pattern)) {
    const pattern = effectivePattern(cat)
    if (pattern) fills.pattern = pattern
  }
  if (blank(cat.coatLength)) {
    const coatLength = effectiveCoatLength(cat)
    if (coatLength) fills.coatLength = coatLength
  }
  if (blank(cat.energyLevel)) {
    const energy = effectiveEnergy(cat)
    // 'Unknown' means the breed had nothing to say, so leave the field alone.
    if (energy !== 'Unknown') fills.energyLevel = energy
  }
  return fills
}
