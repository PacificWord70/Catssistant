import { Cat, CoatPattern } from '@/types/cat'
import { ScheduleEvent } from '@/types/scheduleEvent'

const STORAGE_KEY = 'catssistant_cats'
const SCHEDULE_KEY = 'catssistant_schedule_events'

/**
 * Coat markings that used to be stored in the single `color` field, back when
 * one dropdown held both solids and patterns.
 */
const LEGACY_PATTERN_VALUES: CoatPattern[] = ['Tabby', 'Calico', 'Tortoiseshell', 'Tuxedo', 'Colorpoint']

/**
 * Brings a stored cat up to the current shape.
 *
 * Cats saved before colour and pattern were split apart may have a pattern
 * name sitting in `color` (e.g. color: 'Tabby'). Move it to `pattern` so the
 * two fields mean what they say.
 *
 * This runs on every read rather than rewriting localStorage, which keeps
 * reads free of side effects — the new shape persists naturally the next time
 * the cat is saved. It is safe to run repeatedly: once a value has moved,
 * `color` no longer holds a pattern, so the branch simply stops matching.
 */
function migrateCat(stored: Cat): Cat {
  const legacyPattern = LEGACY_PATTERN_VALUES.find(p => p === (stored.color as unknown as CoatPattern))
  if (!legacyPattern) return stored
  return { ...stored, color: undefined, pattern: stored.pattern ?? legacyPattern }
}

export function getCats(): Cat[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Cat[]).map(migrateCat) : []
  } catch {
    return []
  }
}

export function getCatById(id: string): Cat | undefined {
  return getCats().find(c => c.id === id)
}

export function saveCat(cat: Cat): void {
  const cats = getCats()
  const idx = cats.findIndex(c => c.id === cat.id)
  if (idx >= 0) {
    cats[idx] = cat
  } else {
    cats.push(cat)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
}

export function deleteCat(id: string): void {
  const cats = getCats().filter(c => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
}

export function getScheduleEvents(): ScheduleEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveScheduleEvent(event: ScheduleEvent): void {
  const events = getScheduleEvents()
  const idx = events.findIndex(e => e.id === event.id)
  if (idx >= 0) {
    events[idx] = event
  } else {
    events.push(event)
  }
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(events))
}

export function deleteScheduleEvent(id: string): void {
  const events = getScheduleEvents().filter(e => e.id !== id)
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(events))
}
