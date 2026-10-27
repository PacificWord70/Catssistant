import { ScheduleEvent } from '@/types/scheduleEvent'
import { parseDateKey, toDateKey } from '@/lib/dateKeys'
import { expandEvents } from '@/lib/scheduleUtils'

/**
 * Things that happened to a cat, drawn on its weight chart so a change in the
 * line can be read against what caused it: the vet visit, the new food, the
 * medicine starting.
 */
export type MarkerKind = 'vet' | 'diet' | 'medication'

export interface ChartMarker {
  date: string
  kind: MarkerKind
  /** The cats it applies to, among the ones asked about. */
  catIds: string[]
  /** One line per event that day, e.g. "Pepper: Thyroid diagnosis". */
  lines: string[]
}

export const MARKER_KINDS: { kind: MarkerKind; label: string; emoji: string }[] = [
  { kind: 'vet', label: 'Vet visits', emoji: '🩺' },
  { kind: 'diet', label: 'Diet changes', emoji: '🍽️' },
  { kind: 'medication', label: 'Medication', emoji: '💊' },
]

/**
 * Markers for `catIds` between `from` and `to` (date keys, inclusive).
 *
 * - Vet: every vet visit, recurring ones expanded.
 * - Diet: a feeding event starting after the cat's first one — the point the
 *   food or the amount changed — and any "Changed food" care-routine entry.
 *   The very first feeding event is just when records began, not a change.
 * - Medication: the day a medicine was started or stopped. The daily doses in
 *   between would be a line on every day and say nothing.
 *
 * Markers of the same kind on the same day are merged, so two cats seen at one
 * visit draw one line, not two on top of each other.
 */
export function chartMarkers(
  events: ScheduleEvent[],
  catNames: Map<string, string>,
  catIds: string[],
  from: string,
  to: string,
): ChartMarker[] {
  const wanted = new Set(catIds)
  const raw: { date: string; kind: MarkerKind; catIds: string[]; line: string }[] = []
  const forCats = (e: ScheduleEvent) => e.catIds.filter(id => wanted.has(id))
  const names = (ids: string[]) => ids.map(id => catNames.get(id) ?? '').filter(Boolean).join(', ')
  const add = (date: string, kind: MarkerKind, ids: string[], what: string) => {
    if (ids.length === 0 || date < from || date > to) return
    raw.push({ date, kind, catIds: ids, line: `${names(ids)}: ${what}` })
  }

  const start = parseDateKey(from)
  const end = parseDateKey(to)
  if (start && end) {
    for (const item of expandEvents(events.filter(e => e.category === 'Vet'), start, end)) {
      add(item.date, 'vet', forCats(item.event), item.event.title)
    }
  }

  // The first day each cat has any feeding recorded; starts after it are changes.
  const firstFeeding = new Map<string, string>()
  for (const e of events) {
    if (e.category !== 'Feeding') continue
    for (const id of e.catIds) {
      const seen = firstFeeding.get(id)
      if (!seen || e.date < seen) firstFeeding.set(id, e.date)
    }
  }
  for (const e of events) {
    if (e.category === 'Feeding') {
      const changed = forCats(e).filter(
        id => e.date > (firstFeeding.get(id) ?? e.date) && !continuesSameMeal(events, e, id),
      )
      const food = [e.foodBrand, e.foodName].filter(Boolean).join(' ')
      add(e.date, 'diet', changed, food ? `${e.title} (${food})` : e.title)
    } else if (e.category === 'Care Routine' && e.routineType === 'Changed food') {
      add(e.date, 'diet', forCats(e), e.title)
    } else if (e.category === 'Medication' && e.medicationStatus) {
      add(e.date, 'medication', forCats(e), `${e.medicationStatus} ${e.title}`)
    }
  }

  const merged = new Map<string, ChartMarker>()
  for (const r of raw) {
    const key = `${r.date}|${r.kind}`
    const existing = merged.get(key)
    if (existing) {
      for (const id of r.catIds) if (!existing.catIds.includes(id)) existing.catIds.push(id)
      if (!existing.lines.includes(r.line)) existing.lines.push(r.line)
    } else {
      merged.set(key, { date: r.date, kind: r.kind, catIds: [...r.catIds], lines: [r.line] })
    }
  }
  return [...merged.values()].sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind))
}

/**
 * Whether a feeding event that starts today simply carries on what this cat was
 * already getting — the same food and amount from a meal that ended yesterday.
 * That happens when a shared meal is split up because one cat's food changed:
 * the others get a "new" event with nothing new in it, and flagging them as a
 * diet change would point at a cause that isn't there.
 */
function continuesSameMeal(events: ScheduleEvent[], next: ScheduleEvent, catId: string): boolean {
  const start = parseDateKey(next.date)
  if (!start) return false
  const yesterday = toDateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1))
  const portion = (e: ScheduleEvent) => {
    const a = e.feedingAmounts?.find(f => f.catId === catId)
    return `${e.foodBrand ?? ''}|${e.foodName ?? ''}|${a?.amount ?? ''}|${a?.unit ?? ''}`
  }
  return events.some(
    prev =>
      prev.category === 'Feeding' &&
      prev.id !== next.id &&
      prev.catIds.includes(catId) &&
      prev.recurrenceEndDate === yesterday &&
      portion(prev) === portion(next),
  )
}
