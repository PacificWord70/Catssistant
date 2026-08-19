import { Cat } from '@/types/cat'

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
