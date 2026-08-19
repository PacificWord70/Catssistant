import { Cat, LifeStage } from '@/types/cat'

/** Pounds per kilogram, for normalising weights to a single unit. */
const LBS_PER_KG = 2.20462

/** Normalises a cat's weight to pounds so comparisons don't mix units. */
export function catWeightLbs(cat: Pick<Cat, 'weight' | 'weightUnit'>): number | undefined {
  if (cat.weight === undefined) return undefined
  return cat.weightUnit === 'kg' ? cat.weight * LBS_PER_KG : cat.weight
}

/**
 * Life stage from birthday, using the common veterinary split: under a year is
 * a kitten, ten and over is senior. Returns undefined when no birthday is set,
 * so callers can tell "unknown age" apart from "adult".
 */
export function catLifeStage(birthday?: string): LifeStage | undefined {
  if (!birthday) return undefined
  const birth = new Date(birthday)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  // Subtract a year if this year's birthday hasn't come round yet.
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  if (!hasHadBirthdayThisYear) years--

  if (years < 1) return 'Kitten'
  if (years >= 10) return 'Senior'
  return 'Adult'
}

/**
 * Human-readable coat description, e.g. "Black Tabby", "Calico", "Gray".
 * 'Solid' is left implicit — "Black" reads better than "Black Solid".
 * Returns '' when neither field is set, so callers can skip rendering.
 */
export function coatLabel(cat: Pick<Cat, 'color' | 'pattern'>): string {
  const pattern = cat.pattern === 'Solid' ? undefined : cat.pattern
  return [cat.color, pattern].filter(Boolean).join(' ')
}

export function catHumanAge(birthday: string): string {
  const birth = new Date(birthday)
  const now = new Date()
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())

  if (totalMonths <= 0) return '< 1'

  const catYears = totalMonths / 12
  let humanYears: number

  if (catYears <= 1) {
    humanYears = catYears * 15
  } else if (catYears <= 2) {
    humanYears = 15 + (catYears - 1) * 9
  } else {
    humanYears = 24 + (catYears - 2) * 4
  }

  return Math.round(humanYears).toString()
}

export function catAgeShort(birthday: string): string {
  const birth = new Date(birthday)
  const now = new Date()
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())

  if (totalMonths < 1) return '< 1 mo'
  if (totalMonths < 12) return `${totalMonths} mo`
  const years = Math.floor(totalMonths / 12)
  return `${years} yr${years !== 1 ? 's' : ''}`
}

export function catAgeLabel(birthday: string): string {
  const birth = new Date(birthday)
  const now = new Date()
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())

  if (totalMonths < 1) return 'Less than a month old'
  if (totalMonths < 12) return `${totalMonths} month${totalMonths !== 1 ? 's' : ''} old`

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''} old`
  return `${years} yr${years !== 1 ? 's' : ''}, ${months} mo${months !== 1 ? 's' : ''} old`
}
