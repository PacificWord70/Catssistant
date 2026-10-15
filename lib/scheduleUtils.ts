import { ScheduleEvent, ScheduleCategory } from '@/types/scheduleEvent'

export interface AgendaItem {
  event: ScheduleEvent
  date: string // YYYY-MM-DD
  adjustedFromDay?: number // set when a monthly occurrence fell back to the last day of a shorter month
}

export const CATEGORY_EMOJI: Record<ScheduleCategory, string> = {
  Feeding: '🍽️',
  Medication: '💊',
  Vet: '🩺',
  'Care Routine': '🔄',
  Grooming: '✂️',
  Play: '🧶',
  Other: '📌',
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export interface DayCell {
  dateKey: string
  dayNumber: number
  inCurrentMonth: boolean
  isToday: boolean
  items: AgendaItem[]
}

/**
 * The month's days padded out to whole weeks, Sunday first.
 *
 * Every cell is built from a day count rather than by stepping a Date and
 * comparing it to an end Date. Where daylight saving starts at midnight (Chile,
 * for one), that day's `new Date(y, m, d)` lands on 01:00; a stepped cursor
 * carries the extra hour forward and ends up "after" a midnight end date, so
 * the grid used to stop a day short. Constructing each day from its own
 * year/month/day keeps every cell on the right date whatever the clock does.
 */
export function buildMonthGrid(monthStart: Date, events: ScheduleEvent[]): DayCell[] {
  const year = monthStart.getFullYear()
  const month = monthStart.getMonth()
  const leadingDays = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const trailingDays = 6 - new Date(year, month, daysInMonth).getDay()
  const cellCount = leadingDays + daysInMonth + trailingDays

  const dayAt = (i: number) => new Date(year, month, 1 - leadingDays + i)
  const gridStart = dayAt(0)
  const gridEnd = dayAt(cellCount - 1)

  const itemsByDate = new Map<string, AgendaItem[]>()
  for (const { date, items } of groupByDate(expandEvents(events, gridStart, gridEnd))) {
    itemsByDate.set(date, items)
  }

  const todayKey = toDateKey(new Date())
  const cells: DayCell[] = []
  for (let i = 0; i < cellCount; i++) {
    const day = dayAt(i)
    const dateKey = toDateKey(day)
    cells.push({
      dateKey,
      dayNumber: day.getDate(),
      inCurrentMonth: day.getMonth() === month,
      isToday: dateKey === todayKey,
      items: itemsByDate.get(dateKey) ?? [],
    })
  }
  return cells
}

function ordinal(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return `${n}st`
  if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`
  if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`
  return `${n}th`
}

export function adjustedDateNote(item: AgendaItem): string | null {
  if (!item.adjustedFromDay) return null
  const actualDay = Number(item.date.slice(-2))
  return `Normally the ${ordinal(item.adjustedFromDay)} — this month has no ${ordinal(item.adjustedFromDay)}, so it's on the ${ordinal(actualDay)} instead`
}

export function expandEvents(events: ScheduleEvent[], rangeStart: Date, rangeEnd: Date): AgendaItem[] {
  const startKey = toDateKey(rangeStart)
  const endKey = toDateKey(rangeEnd)
  const items: AgendaItem[] = []

  for (const event of events) {
    if (event.date > endKey) continue

    if (event.recurrence === 'none') {
      if (event.date >= startKey && event.date <= endKey) items.push({ event, date: event.date })
      continue
    }

    const anchor = parseDateKey(event.date)
    const recurEndKey = event.recurrenceEndDate && event.recurrenceEndDate < endKey ? event.recurrenceEndDate : endKey

    if (event.recurrence === 'monthly') {
      // Recompute each occurrence from the original day-of-month rather than drifting the
      // cursor forward — a short month (e.g. Feb has no 31st) falls back to that month's
      // last day instead of silently overflowing into the following month.
      const originalDay = anchor.getDate()
      for (let n = 0; ; n++) {
        const targetIndex = anchor.getMonth() + n
        const targetYear = anchor.getFullYear() + Math.floor(targetIndex / 12)
        const targetMonth = ((targetIndex % 12) + 12) % 12
        let occurrence = new Date(targetYear, targetMonth, originalDay)
        let adjusted = false
        if (occurrence.getMonth() !== targetMonth) {
          occurrence = new Date(targetYear, targetMonth + 1, 0) // last day of the target month
          adjusted = true
        }
        const key = toDateKey(occurrence)
        if (key > recurEndKey) break
        if (key >= startKey) items.push({ event, date: key, adjustedFromDay: adjusted ? originalDay : undefined })
      }
      continue
    }

    const cursor = new Date(anchor)
    while (toDateKey(cursor) <= recurEndKey) {
      const key = toDateKey(cursor)
      if (key >= startKey) items.push({ event, date: key })
      if (event.recurrence === 'daily') cursor.setDate(cursor.getDate() + 1)
      else cursor.setDate(cursor.getDate() + 7) // weekly
    }
  }

  return items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return (a.event.times[0] ?? '99:99').localeCompare(b.event.times[0] ?? '99:99')
  })
}

export function groupByDate(items: AgendaItem[]): { date: string; items: AgendaItem[] }[] {
  const map = new Map<string, AgendaItem[]>()
  for (const item of items) {
    if (!map.has(item.date)) map.set(item.date, [])
    map.get(item.date)!.push(item)
  }
  return Array.from(map.entries()).map(([date, dateItems]) => ({ date, items: dateItems }))
}

export function formatDateLabel(dateKey: string): string {
  const date = parseDateKey(dateKey)
  const today = toDateKey(new Date())
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateKey === today) return 'Today'
  if (dateKey === toDateKey(tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatTimeLabel(time?: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export function formatDurationLabel(minutes?: number): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

export function formatTimesLabel(times: string[], durationMinutes?: number): string {
  const label = times.map(t => formatTimeLabel(t)).join(', ')
  const duration = formatDurationLabel(durationMinutes)
  if (label && duration) return `${label} (${duration})`
  return label || duration
}
