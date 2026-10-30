/**
 * Backing up everything the owner has entered to one file, and bringing a
 * file like that back in.
 *
 * Everything here is pure: it takes collections and returns collections or a
 * plan. Reading and writing localStorage stays in lib/storage.ts
 * (`readAllCollections`, `writeAllCollections`), so these rules can be tested
 * without a browser and the page only has to join the two up.
 *
 * Import merges rather than replaces — the rule the owner approved:
 *
 * - a record only in the file is added;
 * - a record only on this device is kept;
 * - a record in both (same id) that differs: the more recently changed one
 *   wins, by `updatedAt`, falling back to `createdAt`. If the times are equal,
 *   or neither has a usable one, the file wins — importing is an explicit ask
 *   to use what is in it.
 *
 * So an import can never duplicate a record or delete one. The one thing it can
 * do that may surprise is bring back a cat deleted since the backup was made:
 * from the file's point of view that cat is simply "only in the file".
 */

import { Cat } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { CatalogProduct, HouseholdItem } from '@/types/item'
import { migrateProduct } from '@/lib/foodFacts'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { todayKey } from '@/lib/dateKeys'
import { safeImageSrc } from '@/lib/safeUrl'
import { migrateCat, StoredCollections } from '@/lib/storage'

export const BACKUP_APP = 'Catssistant'
/**
 * Bump when the file's shape changes in a way an older reader would get wrong,
 * and teach `parseBackup` to read the old number too. A file with a higher
 * number than this is refused rather than half-understood.
 */
export const BACKUP_SCHEMA_VERSION = 1

export interface BackupFile {
  app: typeof BACKUP_APP
  schemaVersion: typeof BACKUP_SCHEMA_VERSION
  /** ISO timestamp of when the file was made. Informational; merging ignores it. */
  exportedAt: string
  data: StoredCollections
}

export type CollectionName = keyof StoredCollections

/** In the order the summary lists them, which is roughly how much each one matters. */
export const COLLECTION_NAMES: CollectionName[] = [
  'cats',
  'scheduleEvents',
  'healthRecords',
  'householdItems',
  'catalogProducts',
]

const NOUNS: Record<CollectionName, { one: string; many: string; title: string }> = {
  cats: { one: 'cat', many: 'cats', title: 'Cats' },
  scheduleEvents: { one: 'schedule event', many: 'schedule events', title: 'Schedule' },
  healthRecords: { one: 'health reading', many: 'health readings', title: 'Health readings' },
  householdItems: { one: 'household item', many: 'household items', title: 'Household items' },
  catalogProducts: { one: 'product', many: 'products', title: 'Products' },
}

const noun = (name: CollectionName, n: number) => (n === 1 ? NOUNS[name].one : NOUNS[name].many)

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Wraps the collections in the file's envelope. Photos travel inside their
 * cats — they are already downscaled JPEG data URLs (lib/photo.ts), so there is
 * nothing separate to bundle.
 */
export function buildBackup(collections: StoredCollections, now: Date = new Date()): BackupFile {
  return {
    app: BACKUP_APP,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data: {
      cats: collections.cats,
      scheduleEvents: collections.scheduleEvents,
      healthRecords: collections.healthRecords,
      householdItems: collections.householdItems,
      catalogProducts: collections.catalogProducts,
    },
  }
}

/** Named by the owner's local day, not the UTC one — see lib/dateKeys.ts. */
export function backupFileName(now: Date = new Date()): string {
  return `catssistant-backup-${todayKey(now)}.json`
}

// ─── Reading a file ───────────────────────────────────────────────────────────

/** A file that cannot be imported. Its `message` is written for the owner and safe to show as-is. */
export class BackupFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackupFileError'
  }
}

const NOT_A_BACKUP =
  'This file isn’t a Catssistant backup. Choose the .json file you downloaded from this page.'

type Fields = Record<string, unknown>

const isObject = (v: unknown): v is Fields =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string'
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString)
const optional = (v: unknown, check: (v: unknown) => boolean) => v === undefined || check(v)

/**
 * What each record needs before the app can show it without crashing: the
 * arrays it maps over and the text it prints. Deliberately not a full schema —
 * optional fields an older version did not write must not get a whole backup
 * refused — but everything listed here is something a page reads unguarded.
 */
const RECORD_CHECKS: Record<CollectionName, (r: Fields) => boolean> = {
  cats: r => isString(r.name) && isStringArray(r.breed),
  scheduleEvents: r =>
    isStringArray(r.catIds) &&
    isString(r.category) &&
    isString(r.title) &&
    isString(r.date) &&
    isStringArray(r.times) &&
    isString(r.recurrence),
  healthRecords: r =>
    isString(r.catId) && isString(r.date) && optional(r.weightLbs, v => typeof v === 'number'),
  catalogProducts: r => isString(r.name) && isString(r.category),
  householdItems: r =>
    isString(r.productId) &&
    isStringArray(r.catIds) &&
    (r.status === 'current' || r.status === 'past'),
}

/**
 * Copies a record out of the file. Only cats need more than a copy: their
 * photo ends up in an <img src>, so it goes through the same guard as one read
 * from storage, and an unsafe one is dropped rather than refusing the backup —
 * the cat falls back to its drawn avatar. Cats also take the same on-read
 * migration storage applies, so an old backup arrives in today's shape.
 */
function cleanRecord(name: CollectionName, record: Fields): Fields {
  const copy = { ...record }
  // Label facts feed arithmetic, so a hand-edited or damaged file must not be
  // able to smuggle in a zero can weight or a string of calories.
  if (name === 'catalogProducts') return migrateProduct(copy as unknown as CatalogProduct) as unknown as Fields
  if (name !== 'cats') return copy
  const photo = safeImageSrc(copy.photoUrl)
  if (photo === undefined) delete copy.photoUrl
  return migrateCat(copy as unknown as Cat) as unknown as Fields
}

function readCollection(name: CollectionName, value: unknown): Fields[] {
  if (!Array.isArray(value)) {
    throw new BackupFileError(
      `This backup looks incomplete or damaged — its ${NOUNS[name].many} couldn’t be read. Nothing was imported.`,
    )
  }
  const seen = new Set<string>()
  return value.map((record: unknown, index) => {
    const valid =
      isObject(record) &&
      isString(record.id) &&
      record.id !== '' &&
      isString(record.createdAt) &&
      optional(record.updatedAt, isString) &&
      RECORD_CHECKS[name](record)
    if (!valid) {
      throw new BackupFileError(
        `${NOUNS[name].title} entry ${index + 1} in this backup is missing details it needs, so the file may be damaged. Nothing was imported.`,
      )
    }
    // Two copies of one id would turn into a duplicate on merge.
    if (seen.has(record.id as string)) {
      throw new BackupFileError(
        `This backup lists the same ${NOUNS[name].one} twice, so the file may be damaged. Nothing was imported.`,
      )
    }
    seen.add(record.id as string)
    return cleanRecord(name, record)
  })
}

/**
 * Reads the text of a backup file into collections, or throws BackupFileError
 * saying what is wrong with it. Any problem refuses the whole file: importing
 * the parts that looked fine would leave the owner with a restore they think
 * is complete.
 *
 * Only the five known collections are taken from the file. Any other key, at
 * the top level or inside `data`, is ignored, so a hand-edited file cannot
 * slip something new into storage.
 */
export function parseBackup(text: string): StoredCollections {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new BackupFileError(NOT_A_BACKUP)
  }
  if (!isObject(parsed) || parsed.app !== BACKUP_APP) throw new BackupFileError(NOT_A_BACKUP)

  const version = parsed.schemaVersion
  if (typeof version === 'number' && Number.isInteger(version) && version > BACKUP_SCHEMA_VERSION) {
    throw new BackupFileError(
      'This backup was made by a newer version of Catssistant, so this version can’t read it safely. Nothing was imported.',
    )
  }
  if (version !== BACKUP_SCHEMA_VERSION) {
    throw new BackupFileError(
      'This backup’s format isn’t one Catssistant recognises. Nothing was imported.',
    )
  }
  if (!isObject(parsed.data)) {
    throw new BackupFileError('This backup looks incomplete or damaged. Nothing was imported.')
  }

  const data = parsed.data
  return {
    cats: readCollection('cats', data.cats) as unknown as Cat[],
    scheduleEvents: readCollection(
      'scheduleEvents',
      data.scheduleEvents,
    ) as unknown as ScheduleEvent[],
    healthRecords: readCollection('healthRecords', data.healthRecords) as unknown as HealthRecord[],
    catalogProducts: readCollection(
      'catalogProducts',
      data.catalogProducts,
    ) as unknown as CatalogProduct[],
    householdItems: readCollection(
      'householdItems',
      data.householdItems,
    ) as unknown as HouseholdItem[],
  }
}

// ─── Merging ──────────────────────────────────────────────────────────────────

interface Timed {
  id: string
  createdAt?: unknown
  updatedAt?: unknown
}

/**
 * When a record last changed, in ms, or null if it carries no usable time.
 *
 * Records saved before `updatedAt` existed have none, and for them `createdAt`
 * is the honest answer: nothing has stamped a change since. Reading it here,
 * rather than writing a made-up `updatedAt` into old records on read, keeps
 * reads free of side effects and leaves no invented times in storage.
 */
export function lastChanged(record: { createdAt?: unknown; updatedAt?: unknown }): number | null {
  for (const value of [record.updatedAt, record.createdAt]) {
    if (typeof value !== 'string') continue
    const time = Date.parse(value)
    if (!Number.isNaN(time)) return time
  }
  return null
}

/**
 * Whether the file's copy replaces this device's. Ties go to the file (see the
 * module comment). When only one side has a usable time, that side counts as
 * newer: a record with no time at all can only be older than anything stamped.
 */
export function importedWins(device: Timed, imported: Timed): boolean {
  const deviceTime = lastChanged(device)
  const importedTime = lastChanged(imported)
  if (deviceTime !== null && importedTime !== null) return importedTime >= deviceTime
  if (deviceTime === null && importedTime === null) return true
  return importedTime !== null
}

/**
 * JSON with object keys sorted, so two records with the same content compare
 * equal however their keys happened to be ordered. Undefined fields drop out,
 * as they do when stored.
 */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    isObject(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map(k => [k, v[k]]),
        )
      : v,
  )
}

export interface CollectionCounts {
  /** Only in the file — will be added. */
  added: number
  /** In both, different, and the file's copy is newer (or tied) — will replace this device's. */
  updated: number
  /** In both and identical. */
  unchanged: number
  /** In both, different, and this device's copy is newer — stays. */
  keptNewer: number
  /** Only on this device — stays. */
  keptOnlyHere: number
}

export interface MergePlan {
  /** What each collection will be after the import. Untouched collections are the same array as before. */
  next: StoredCollections
  counts: Record<CollectionName, CollectionCounts>
  /** False when importing would change nothing at all. */
  hasChanges: boolean
}

function mergeCollection<T extends Timed>(device: T[], imported: T[]) {
  const fromFile = new Map(imported.map(r => [r.id, r]))
  const counts: CollectionCounts = {
    added: 0,
    updated: 0,
    unchanged: 0,
    keptNewer: 0,
    keptOnlyHere: 0,
  }

  const merged = device.map(mine => {
    const theirs = fromFile.get(mine.id)
    if (!theirs) {
      counts.keptOnlyHere++
      return mine
    }
    if (canonical(mine) === canonical(theirs)) {
      counts.unchanged++
      return mine
    }
    if (importedWins(mine, theirs)) {
      counts.updated++
      return theirs
    }
    counts.keptNewer++
    return mine
  })

  const onDevice = new Set(device.map(r => r.id))
  const additions = imported.filter(r => !onDevice.has(r.id))
  counts.added = additions.length

  // Returning the original array when nothing changed lets writeAllCollections
  // skip that key entirely.
  const list = counts.added || counts.updated ? [...merged, ...additions] : device
  return { list, counts }
}

/**
 * Works out what an import would do, without doing it. The page shows the
 * counts and asks before anything is written; applying is then just writing
 * `next`. Device order is kept, with additions after, in the file's order.
 */
export function planMerge(device: StoredCollections, imported: StoredCollections): MergePlan {
  const cats = mergeCollection(device.cats, imported.cats)
  const scheduleEvents = mergeCollection(device.scheduleEvents, imported.scheduleEvents)
  const healthRecords = mergeCollection(device.healthRecords, imported.healthRecords)
  const catalogProducts = mergeCollection(device.catalogProducts, imported.catalogProducts)
  const householdItems = mergeCollection(device.householdItems, imported.householdItems)

  const counts = {
    cats: cats.counts,
    scheduleEvents: scheduleEvents.counts,
    healthRecords: healthRecords.counts,
    catalogProducts: catalogProducts.counts,
    householdItems: householdItems.counts,
  }
  return {
    next: {
      cats: cats.list,
      scheduleEvents: scheduleEvents.list,
      healthRecords: healthRecords.list,
      catalogProducts: catalogProducts.list,
      householdItems: householdItems.list,
    },
    counts,
    hasChanges: COLLECTION_NAMES.some(n => counts[n].added > 0 || counts[n].updated > 0),
  }
}

/**
 * The plan in plain words, one group per collection that the file or this
 * device has anything in. Kept here rather than in the page so the wording of
 * every count is tested along with the counts themselves.
 */
export function describePlan(plan: MergePlan): { title: string; lines: string[] }[] {
  return COLLECTION_NAMES.flatMap(name => {
    const c = plan.counts[name]
    const lines: string[] = []
    if (c.added) lines.push(`${c.added} new ${noun(name, c.added)} will be added`)
    if (c.updated) {
      lines.push(
        `${c.updated} ${noun(name, c.updated)} will be updated to the backup’s more recent version`,
      )
    }
    if (c.keptNewer) {
      lines.push(
        `${c.keptNewer} ${noun(name, c.keptNewer)} ${c.keptNewer === 1 ? 'was' : 'were'} changed here more recently and will stay as ${c.keptNewer === 1 ? 'it is' : 'they are'}`,
      )
    }
    if (c.unchanged) {
      lines.push(
        `${c.unchanged} ${noun(name, c.unchanged)} already match${c.unchanged === 1 ? 'es' : ''} the backup`,
      )
    }
    if (c.keptOnlyHere) {
      lines.push(
        `${c.keptOnlyHere} ${noun(name, c.keptOnlyHere)} not in the backup will stay as ${c.keptOnlyHere === 1 ? 'it is' : 'they are'}`,
      )
    }
    return lines.length ? [{ title: NOUNS[name].title, lines }] : []
  })
}

/** One sentence for after a successful import, e.g. "Added 2 cats and updated 1 schedule event." */
export function describeResult(plan: MergePlan): string {
  const added = COLLECTION_NAMES.filter(n => plan.counts[n].added).map(
    n => `${plan.counts[n].added} ${noun(n, plan.counts[n].added)}`,
  )
  const updated = COLLECTION_NAMES.filter(n => plan.counts[n].updated).map(
    n => `${plan.counts[n].updated} ${noun(n, plan.counts[n].updated)}`,
  )
  const parts: string[] = []
  if (added.length) parts.push(`added ${joinList(added)}`)
  if (updated.length) parts.push(`updated ${joinList(updated)}`)
  if (!parts.length)
    return 'Everything in that backup was already here, so nothing needed to change.'
  const sentence = parts.join(' and ')
  return `Backup restored: ${sentence}.`
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}
