/**
 * The guard rails every localStorage collection goes through.
 *
 * Each collection (cats, schedule events, items, health records) is one JSON
 * array under one key, and every save is a read-modify-write of that whole
 * array. That shape has one dangerous failure: if the read cannot make sense of
 * what is stored and quietly says "empty", the write that follows replaces
 * everything with a one-element list. So the rule here is that *couldn't read*
 * is never treated as *nothing there*.
 *
 * How unreadable data is handled:
 *
 * - Reads still return `[]`, so a page renders instead of crashing, but first
 *   they copy the raw string to a backup key (`<key>__unreadable`). That copy
 *   is the one side effect a read is allowed. It runs once per distinct bad
 *   value, never overwrites an earlier backup, and does not touch the live key,
 *   so reading twice still equals reading once.
 * - Writes refuse while the live key is unreadable. The refusal is how the user
 *   gets told: they see the StorageWriteError message, and only once the backup
 *   is confirmed is the unreadable value moved off the live key. Their next
 *   save then starts from a genuinely empty list, with the old data kept aside
 *   for recovery. If the backup cannot be made (say, storage is full), the live
 *   value stays put and every write keeps refusing — staying stuck is better
 *   than losing it.
 *
 * Anything that parses but is not an array (`null`, `{}`, `42`) counts as
 * unreadable too: it is not a shape this app ever wrote, and passing it on is
 * what used to crash the next `.findIndex`.
 */

const BACKUP_SUFFIX = '__unreadable'
/** More distinct unreadable values than this for one key means something is badly wrong; stop copying. */
const MAX_BACKUPS = 10

export type StorageWriteFailure = 'quota' | 'unreadable' | 'unknown'

/**
 * The user-facing text for each failure. UI code shows `error.message`
 * directly, so these are written for someone who has never heard of
 * localStorage. Photos are named in the quota message because they are by far
 * the largest thing the app stores.
 */
export const STORAGE_WRITE_MESSAGES: Record<StorageWriteFailure, string> = {
  quota:
    "There isn't enough room to save this — try a smaller photo, or remove one you no longer need.",
  unreadable:
    "Some of your saved information couldn't be read, so we've kept a copy of it rather than save over it. Your change wasn't saved — please try again.",
  unknown: "Something went wrong and your change wasn't saved. Please try again.",
}

/** Thrown by every storage write that did not happen. Its `message` is safe to show the user as-is. */
export class StorageWriteError extends Error {
  readonly reason: StorageWriteFailure

  constructor(reason: StorageWriteFailure, options?: { cause?: unknown }) {
    super(STORAGE_WRITE_MESSAGES[reason], options)
    this.name = 'StorageWriteError'
    this.reason = reason
  }
}

/** Browsers disagree on how to say "full": Firefox has its own name, older engines only set a code. */
function isQuotaError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const { name, code } = err as { name?: unknown; code?: unknown }
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    code === 22 ||
    code === 1014
  )
}

type Parsed<T> = { ok: true; list: T[] } | { ok: false }

function parseList<T>(raw: string | null): Parsed<T> {
  if (raw === null) return { ok: true, list: [] }
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? { ok: true, list: value as T[] } : { ok: false }
  } catch {
    return { ok: false }
  }
}

/**
 * Copies an unreadable value to the first backup slot that either already
 * holds it or is free. Returns false if it could not be kept safe.
 */
function backUp(key: string, raw: string): boolean {
  for (let n = 1; n <= MAX_BACKUPS; n++) {
    const slot = n === 1 ? `${key}${BACKUP_SUFFIX}` : `${key}${BACKUP_SUFFIX}_${n}`
    const existing = localStorage.getItem(slot)
    if (existing === raw) return true
    if (existing !== null) continue
    try {
      localStorage.setItem(slot, raw)
      return true
    } catch {
      return false
    }
  }
  return false
}

/** Reads a collection for display. Never throws; unreadable data is backed up and shown as empty. */
export function readList<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    const parsed = parseList<T>(raw)
    if (parsed.ok) return parsed.list
    backUp(key, raw as string)
  } catch {
    // Storage itself is unavailable (e.g. blocked by privacy settings). Nothing to back up.
  }
  return []
}

/**
 * Reads a collection that is about to be written back. Throws instead of
 * returning `[]` when the stored value is unreadable — see the module comment
 * for why the throw also sets that value aside.
 */
export function readListForWrite<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  const parsed = parseList<T>(raw)
  if (parsed.ok) return parsed.list
  if (backUp(key, raw as string)) {
    try {
      localStorage.removeItem(key)
    } catch {
      // Still backed up; the next attempt will find the same value and try again.
    }
  }
  throw new StorageWriteError('unreadable')
}

export function writeList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch (err) {
    throw new StorageWriteError(isQuotaError(err) ? 'quota' : 'unknown', { cause: err })
  }
}

/** Replaces the entry with the same id, or appends it. */
export function upsertById<T extends { id: string }>(list: T[], entry: T): T[] {
  const index = list.findIndex(x => x.id === entry.id)
  if (index < 0) return [...list, entry]
  const next = [...list]
  next[index] = entry
  return next
}

/**
 * Returns a copy of `record` marked as saved now. Every save function in lib/
 * stamps here, so `updatedAt` is set in exactly one way and the thunks dispatch
 * the stamped copy — if they dispatched what the form handed in, the store
 * would hold a record one field different from the one in storage.
 */
export function stamped<T extends object>(
  record: T,
  now: Date = new Date(),
): T & { updatedAt: string } {
  return { ...record, updatedAt: now.toISOString() }
}
