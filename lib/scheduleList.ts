import { ScheduleCategory, ScheduleEvent } from '@/types/scheduleEvent'
import { SCHEDULE_CATEGORIES } from '@/lib/scheduleAttributes'
import { AgendaItem, expandEvents } from '@/lib/scheduleUtils'
import { parseDateKey, toDateKey } from '@/lib/dateKeys'

/**
 * The Schedule page's list view, as pure functions.
 *
 * The list is the calendar's events seen another way, so it owns no data and no
 * expansion of its own: it picks a window of days, hands it to `expandEvents`,
 * and only then sorts and groups what comes back. If the two views ever
 * disagreed about when a recurring event falls, it would be because one of them
 * had grown a second copy of that logic.
 */

export type ListRange = 'upcoming' | 'past' | 'custom'
export type ListSort = 'date-asc' | 'date-desc' | 'category' | 'cat'

/** How far the list reaches before "show more" — a month is enough to plan against. */
export const LIST_HORIZON_DAYS = 30

export interface ListWindow {
  from: string // YYYY-MM-DD, inclusive
  to: string // YYYY-MM-DD, inclusive
}

/**
 * The day `days` after `key` (or before, when negative).
 *
 * Built from year/month/day rather than by adding milliseconds: a day that
 * crosses a daylight-saving change is 23 or 25 hours long, and where the shift
 * happens at midnight a millisecond step can land on the wrong date.
 */
export function addDaysToKey(key: string, days: number): string | null {
  const date = parseDateKey(key)
  if (!date) return null
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days))
}

/**
 * The days the list covers.
 *
 * Upcoming starts today, because something due this evening is still ahead of
 * the owner. Past therefore stops at yesterday, so no occurrence shows in both.
 * A custom range given back to front is read the way it was obviously meant
 * rather than coming back empty. Null means a custom range that isn't finished
 * yet — there is nothing honest to show for half a range.
 */
export function listWindow(
  range: ListRange,
  today: string,
  days: number = LIST_HORIZON_DAYS,
  custom: { from?: string; to?: string } = {},
): ListWindow | null {
  if (range === 'upcoming') {
    const to = addDaysToKey(today, days - 1)
    return to ? { from: today, to } : null
  }
  if (range === 'past') {
    const from = addDaysToKey(today, -days)
    const to = addDaysToKey(today, -1)
    return from && to ? { from, to } : null
  }
  const { from, to } = custom
  if (!from || !to || !parseDateKey(from) || !parseDateKey(to)) return null
  return from <= to ? { from, to } : { from: to, to: from }
}

/**
 * Case-insensitive match on title and notes, and on the category's name too:
 * "Annual checkup" is filed under Vet, and an owner typing "vet" expects to
 * find it. Whitespace-only search is no search, so clearing the box with the
 * spacebar doesn't empty the list.
 */
export function matchesSearch(event: ScheduleEvent, search: string): boolean {
  const needle = search.trim().toLocaleLowerCase()
  if (!needle) return true
  return [event.title, event.notes ?? '', event.category].some(text =>
    text.toLocaleLowerCase().includes(needle),
  )
}

/**
 * Every occurrence in the window, sorted. Search runs on the stored events
 * before expansion — every occurrence of an event shares its text, so there is
 * no point expanding a daily feed for a month only to throw it all away.
 */
export function listOccurrences(
  events: ScheduleEvent[],
  window: ListWindow,
  search: string,
  sort: ListSort,
  catLabel: (catIds: string[]) => string = () => '',
): AgendaItem[] {
  const start = parseDateKey(window.from)
  const end = parseDateKey(window.to)
  if (!start || !end) return []
  const items = expandEvents(
    events.filter(e => matchesSearch(e, search)),
    start,
    end,
  )
  return sortOccurrences(items, sort, catLabel)
}

const firstTime = (item: AgendaItem) => item.event.times[0] ?? '99:99'

function byDateThenTime(a: AgendaItem, b: AgendaItem): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  return firstTime(a).localeCompare(firstTime(b))
}

/**
 * Latest-first reverses the days but not the hours inside one. A day still
 * reads as that day's agenda, morning to night; only the order you scroll
 * through the days changes.
 */
export function sortOccurrences(
  items: AgendaItem[],
  sort: ListSort,
  catLabel: (catIds: string[]) => string = () => '',
): AgendaItem[] {
  const sorted = [...items]
  if (sort === 'date-asc') return sorted.sort(byDateThenTime)
  if (sort === 'date-desc') {
    return sorted.sort((a, b) =>
      a.date !== b.date ? (a.date < b.date ? 1 : -1) : firstTime(a).localeCompare(firstTime(b)),
    )
  }
  if (sort === 'category') {
    const rank = (c: ScheduleCategory) => SCHEDULE_CATEGORIES.indexOf(c)
    return sorted.sort(
      (a, b) => rank(a.event.category) - rank(b.event.category) || byDateThenTime(a, b),
    )
  }
  return sorted.sort(
    (a, b) =>
      catLabel(a.event.catIds).localeCompare(catLabel(b.event.catIds)) || byDateThenTime(a, b),
  )
}

export interface ListGroup {
  key: string
  /** What the heading names: a day, a category, or a set of cats. */
  kind: 'date' | 'category' | 'cat'
  items: AgendaItem[]
}

/**
 * Splits sorted occurrences under headings that match the sort, so the
 * heading always names what the order is by. Sorted by cat, an event shared by
 * two cats sits under both names together ("Miso, Pepper") rather than once
 * under each — every occurrence appears exactly once, as in the calendar.
 */
export function groupOccurrences(
  items: AgendaItem[],
  sort: ListSort,
  catLabel: (catIds: string[]) => string = () => '',
): ListGroup[] {
  const kind: ListGroup['kind'] = sort === 'category' ? 'category' : sort === 'cat' ? 'cat' : 'date'
  const keyOf = (item: AgendaItem) =>
    kind === 'date'
      ? item.date
      : kind === 'category'
        ? item.event.category
        : catLabel(item.event.catIds)

  const groups: ListGroup[] = []
  for (const item of items) {
    const key = keyOf(item)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(item)
    else groups.push({ key, kind, items: [item] })
  }
  return groups
}

/**
 * A day heading: "Today", "Tomorrow" and "Yesterday" in words, since those are
 * how the owner thinks about them, otherwise weekday and date. The year only
 * appears when it isn't this one — "Monday, Jan 4" is ambiguous only then.
 */
export function formatListDayHeading(key: string, today: string): string {
  if (key === today) return 'Today'
  if (key === addDaysToKey(today, 1)) return 'Tomorrow'
  if (key === addDaysToKey(today, -1)) return 'Yesterday'
  const date = parseDateKey(key)
  if (!date) return key
  const sameYear = key.slice(0, 4) === today.slice(0, 4)
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}
