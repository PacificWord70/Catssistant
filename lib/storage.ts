import { Cat, CoatPattern } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { CatalogProduct, HouseholdItem } from '@/types/item'
import { HEALTH_KEY } from '@/lib/healthStorage'
import { CATALOG_KEY, ITEMS_KEY } from '@/lib/itemStorage'
import { migrateProduct } from '@/lib/foodFacts'
import {
  readList,
  readListForWrite,
  stamped,
  StorageWriteError,
  upsertById,
  writeList,
} from '@/lib/storageSafety'

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
export function migrateCat(stored: Cat): Cat {
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

/**
 * Returns the cat as stored, with `updatedAt` stamped — dispatch that, not the
 * argument. Throws StorageWriteError if the cat could not be saved; see
 * lib/storageSafety.ts.
 */
export function saveCat(cat: Cat): Cat {
  const saved = stamped(cat)
  const cats = readListForWrite<Cat>(STORAGE_KEY).map(migrateCat)
  writeList(STORAGE_KEY, upsertById(cats, saved))
  return saved
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
      // Stamped because it did change: otherwise a backup taken before the
      // delete would tie with it, and the import would put the cat's id back.
      const updated = stamped({ ...e, catIds })
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

/** Returns the event as stored, with `updatedAt` stamped — dispatch that one. */
export function saveScheduleEvent(event: ScheduleEvent): ScheduleEvent {
  const saved = stamped(event)
  writeList(SCHEDULE_KEY, upsertById(readListForWrite<ScheduleEvent>(SCHEDULE_KEY), saved))
  return saved
}

export function deleteScheduleEvent(id: string): void {
  const remaining = readListForWrite<ScheduleEvent>(SCHEDULE_KEY).filter(e => e.id !== id)
  writeList(SCHEDULE_KEY, remaining)
}

// ─── Every collection at once ─────────────────────────────────────────────────

/** Everything the app persists, one array per localStorage key. */
export interface StoredCollections {
  cats: Cat[]
  scheduleEvents: ScheduleEvent[]
  healthRecords: HealthRecord[]
  catalogProducts: CatalogProduct[]
  householdItems: HouseholdItem[]
}

/**
 * Write order for `writeAllCollections`. Each collection is written before the
 * ones that point at it (cats before events and readings, products before
 * items), so a write that stops partway never leaves a reference to a record
 * that is not there yet.
 */
const COLLECTION_KEYS: [keyof StoredCollections, string][] = [
  ['cats', STORAGE_KEY],
  ['catalogProducts', CATALOG_KEY],
  ['scheduleEvents', SCHEDULE_KEY],
  ['healthRecords', HEALTH_KEY],
  ['householdItems', ITEMS_KEY],
]

/**
 * Reads every collection, throwing StorageWriteError if any one of them is
 * unreadable. Export and import both start here: a backup missing a collection
 * that merely failed to parse would look complete and not be, and an import
 * must not write anything until it knows it can read everything — the same
 * rule `deleteCat` follows.
 */
export function readAllCollections(): StoredCollections {
  return {
    cats: readListForWrite<Cat>(STORAGE_KEY).map(migrateCat),
    scheduleEvents: readListForWrite<ScheduleEvent>(SCHEDULE_KEY),
    healthRecords: readListForWrite<HealthRecord>(HEALTH_KEY),
    catalogProducts: readListForWrite<CatalogProduct>(CATALOG_KEY).map(migrateProduct),
    householdItems: readListForWrite<HouseholdItem>(ITEMS_KEY),
  }
}

/**
 * Some collections were written, and putting them back failed too. Its message
 * is safe to show as-is; it leans on the fact that an import only ever adds or
 * replaces with newer, so running the same import again finishes the job.
 */
export class PartialWriteError extends StorageWriteError {
  constructor(options?: { cause?: unknown }) {
    super('unknown', options)
    this.name = 'PartialWriteError'
    this.message =
      'Only part of your backup could be added, and we couldn’t undo that part. Nothing was removed — importing the same file again once there is more room will finish the job.'
  }
}

/**
 * Writes each collection in `next` that is a different array from the one in
 * `previous`, which must be what `readAllCollections` returned just before.
 * Records are written exactly as given and nothing is re-stamped, because an
 * import carries the times the records were really changed.
 *
 * Five keys cannot be written atomically. If one write fails, the ones already
 * written are put back to `previous` and the original error is rethrown, so
 * "nothing was saved" is true when the owner reads it. Only if putting them
 * back fails as well does this throw PartialWriteError instead.
 */
export function writeAllCollections(next: StoredCollections, previous: StoredCollections): void {
  const written: [keyof StoredCollections, string][] = []
  try {
    for (const entry of COLLECTION_KEYS) {
      const [name, key] = entry
      if (next[name] === previous[name]) continue
      writeList<unknown>(key, next[name])
      written.push(entry)
    }
  } catch (err) {
    try {
      for (const [name, key] of written) writeList<unknown>(key, previous[name])
    } catch (restoreErr) {
      throw new PartialWriteError({ cause: restoreErr })
    }
    throw err
  }
}
