import { ScheduleEvent } from '@/types/scheduleEvent'
import { parseDateKey, toDateKey } from '@/lib/dateKeys'
import { expandEvents } from '@/lib/scheduleUtils'

/**
 * Things that happened to a cat, drawn on its weight chart so a change in the
 * line can be read against what caused it: the vet visit, the new food, the
 * medicine starting.
 */
export type MarkerKind = 'vet' | 'diet' | 'medication' | 'activity' | 'life'

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
  { kind: 'activity', label: 'Activity changes', emoji: '🧶' },
  { kind: 'life', label: 'Life events', emoji: '📌' },
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
 * - Activity: a play event starting after the cat's first one, read the same
 *   way as a feeding change — more play, or a different kind, can move a
 *   weight line as surely as the food can.
 * - Life: a one-off "Other" event, such as coming home or a stay at a
 *   boarding cattery. A recurring one is a chore (washing the beds every
 *   month), and a node on every month would bury the moments that matter.
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

  // The first day each cat has any feeding, or any play, recorded; starts
  // after it are changes.
  const firstFeeding = firstDates(events, 'Feeding')
  const firstPlay = firstDates(events, 'Play')
  for (const e of events) {
    if (e.category === 'Feeding') {
      const changed = forCats(e).filter(
        id => e.date > (firstFeeding.get(id) ?? e.date) && !carriesOn(events, e, id, mealOf),
      )
      const food = [e.foodBrand, e.foodName].filter(Boolean).join(' ')
      add(e.date, 'diet', changed, food ? `${e.title} (${food})` : e.title)
    } else if (e.category === 'Play') {
      const changed = forCats(e).filter(
        id => e.date > (firstPlay.get(id) ?? e.date) && !carriesOn(events, e, id, playOf),
      )
      const detail = e.playDetail || e.playActivityType
      add(e.date, 'activity', changed, detail ? `${e.title} (${detail})` : e.title)
    } else if (e.category === 'Care Routine' && e.routineType === 'Changed food') {
      add(e.date, 'diet', forCats(e), e.title)
    } else if (e.category === 'Medication' && e.medicationStatus) {
      add(e.date, 'medication', forCats(e), `${e.medicationStatus} ${e.title}`)
    } else if (e.category === 'Other' && e.recurrence === 'none') {
      add(e.date, 'life', forCats(e), e.title)
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

/** The earliest date each cat appears in an event of `category`. */
function firstDates(events: ScheduleEvent[], category: ScheduleEvent['category']): Map<string, string> {
  const first = new Map<string, string>()
  for (const e of events) {
    if (e.category !== category) continue
    for (const id of e.catIds) {
      const seen = first.get(id)
      if (!seen || e.date < seen) first.set(id, e.date)
    }
  }
  return first
}

/** What a cat is fed by one feeding event: the food, and its own portion. */
function mealOf(e: ScheduleEvent, catId: string): string {
  const a = e.feedingAmounts?.find(f => f.catId === catId)
  return `${e.foodBrand ?? ''}|${e.foodName ?? ''}|${a?.amount ?? ''}|${a?.unit ?? ''}`
}

/** What one play event asks of a cat: the activity, how long, how often. */
function playOf(e: ScheduleEvent): string {
  return `${e.playActivityType ?? ''}|${e.playDetail ?? ''}|${e.durationMinutes ?? ''}|${e.recurrence}|${e.times.length}`
}

/**
 * Whether an event that starts today simply carries on what this cat already
 * had — the same thing, in the same amount, from an event of the same kind
 * that ended yesterday. That happens when a shared event is split up because
 * one cat's part changed: the others get a "new" event with nothing new in
 * it, and flagging them would point at a cause that isn't there.
 */
function carriesOn(
  events: ScheduleEvent[],
  next: ScheduleEvent,
  catId: string,
  signature: (e: ScheduleEvent, catId: string) => string,
): boolean {
  const start = parseDateKey(next.date)
  if (!start) return false
  const yesterday = toDateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1))
  return events.some(
    prev =>
      prev.category === next.category &&
      prev.id !== next.id &&
      prev.catIds.includes(catId) &&
      prev.recurrenceEndDate === yesterday &&
      signature(prev, catId) === signature(next, catId),
  )
}
