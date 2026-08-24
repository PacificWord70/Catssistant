import { Cat, CoatColor, CoatLength, CoatPattern, EnergyLevel } from '@/types/cat'
import { BREEDS } from '@/lib/breeds'
import { BREED_TRAITS, DrawHair } from '@/lib/avatar/breedTraits'

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

/** The three drawing buckets widen back out to the stored coat lengths. */
const HAIR_TO_COAT: Record<DrawHair, CoatLength> = {
  Long: 'Long',
  Short: 'Short',
  None: 'Hairless',
}

/** The first breed listed is the one that decides, matching traitsForBreed. */
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
export function effectiveCoatLength(cat: Pick<Cat, 'breed' | 'coatLength'>): CoatLength | undefined {
  if (cat.coatLength && cat.coatLength !== 'Unknown') return cat.coatLength
  const breed = primaryBreed(cat)
  const hair = breed ? BREED_TRAITS[breed]?.hair : undefined
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
  const pattern = breed ? BREED_TRAITS[breed]?.pattern : undefined
  if (!pattern) return undefined
  switch (pattern) {
    case 'Colorpoint':
      return 'Colorpoint'
    case 'Solid':
      return 'Solid'
    // Spotted is a tabby marking; CoatPattern has no entry of its own for it
    // yet, and tabby is closer than leaving a Bengal blank.
    //
    // Ticked coats need no case here — breedTraits already records Abyssinian
    // and Singapura as Solid, because banding each hair produces no marking
    // shape to draw at any size the avatar uses.
    case 'Spotted':
      return 'Tabby'
  }
}

/**
 * Coat colour: what the owner entered, then the breed where it fixes one.
 *
 * Returns undefined when neither applies, so callers that put this on screen as
 * text can say nothing rather than invent a colour. The drawing wants a colour
 * regardless — see effectiveAppearance, which supplies the white default.
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

/**
 * Everything the avatar needs, with breed fallbacks applied in one call, so
 * drawing code does not have to remember which fields have defaults.
 *
 * Colour is left undefined when nothing settles it, rather than being forced to
 * a named coat here. The palette owns that decision: tonesFor paints an
 * undescribed cat in its unknown-coat tone, which is the tan the artwork was
 * drawn in.
 */
export function effectiveAppearance(cat: Pick<Cat, 'breed' | 'color' | 'pattern' | 'coatLength'>) {
  return {
    color: effectiveColor(cat),
    pattern: effectivePattern(cat),
    coatLength: effectiveCoatLength(cat),
  }
}
