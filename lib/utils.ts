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
