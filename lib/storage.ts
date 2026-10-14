import { Cat, CoatPattern } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { HEALTH_KEY } from '@/lib/healthStorage'
import { readList, readListForWrite, upsertById, writeList } from '@/lib/storageSafety'

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
  return readList<Cat>(STORAGE_KEY).map(migrateCat)
}

export function getCatById(id: string): Cat | undefined {
  return getCats().find(c => c.id === id)
}

/** Throws StorageWriteError if the cat could not be saved; see lib/storageSafety.ts. */
export function saveCat(cat: Cat): void {
  const cats = readListForWrite<Cat>(STORAGE_KEY).map(migrateCat)
  writeList(STORAGE_KEY, upsertById(cats, cat))
}

/** What else changed when a cat was deleted, so the store can mirror it exactly. */
export interface CatDeletion {
  /** Shared events that lost this cat but still belong to another one. */
  updatedEvents: ScheduleEvent[]
  /** Events that were only for this cat, now gone. */
  deletedEventIds: string[]
  deletedHealthRecordIds: string[]
}

/**
 * Deletes a cat along with everything that only made sense with it.
 *
 * A shared event (breakfast for two cats) keeps going for the cat that is
 * left; an event with no cats remaining is deleted, since nothing would ever
 * show it again. Health records belong to exactly one cat, so they all go.
 *
 * All three collections are read before anything is written. An unreadable
 * one therefore stops the delete before it starts, rather than leaving the cat
 * gone and its events half-cleaned. The cat is written first after that: if a
 * later write did fail, the leftovers are orphans that nothing displays, which
 * is the same harmless state this used to leave behind every time.
 */
export function deleteCat(id: string): CatDeletion {
  const cats = readListForWrite<Cat>(STORAGE_KEY)
  const events = readListForWrite<ScheduleEvent>(SCHEDULE_KEY)
  const records = readListForWrite<HealthRecord>(HEALTH_KEY)

  const updatedEvents: ScheduleEvent[] = []
  const deletedEventIds: string[] = []
  const keptEvents: ScheduleEvent[] = []
  for (const e of events) {
    if (!e.catIds.includes(id)) {
      keptEvents.push(e)
      continue
    }
    const catIds = e.catIds.filter(c => c !== id)
    if (catIds.length === 0) {
      deletedEventIds.push(e.id)
    } else {
      const updated = { ...e, catIds }
      updatedEvents.push(updated)
      keptEvents.push(updated)
    }
  }
  const keptCats = cats.filter(c => c.id !== id)
  const keptRecords = records.filter(r => r.catId !== id)
  const deletedHealthRecordIds = records.filter(r => r.catId === id).map(r => r.id)

  writeList(STORAGE_KEY, keptCats)
  if (updatedEvents.length || deletedEventIds.length) writeList(SCHEDULE_KEY, keptEvents)
  if (deletedHealthRecordIds.length) writeList(HEALTH_KEY, keptRecords)
  return { updatedEvents, deletedEventIds, deletedHealthRecordIds }
}

export function getScheduleEvents(): ScheduleEvent[] {
  return readList<ScheduleEvent>(SCHEDULE_KEY)
}

export function saveScheduleEvent(event: ScheduleEvent): void {
  writeList(SCHEDULE_KEY, upsertById(readListForWrite<ScheduleEvent>(SCHEDULE_KEY), event))
}

export function deleteScheduleEvent(id: string): void {
  const remaining = readListForWrite<ScheduleEvent>(SCHEDULE_KEY).filter(e => e.id !== id)
  writeList(SCHEDULE_KEY, remaining)
}
