/**
 * Calendar-day keys (YYYY-MM-DD) in the owner's local time.
 *
 * A date key names a day on the owner's wall calendar, not an instant, so both
 * directions have to stay local. The two tempting shortcuts are both UTC:
 *
 * - `date.toISOString().slice(0, 10)` reads the UTC day. In a US evening that is
 *   already tomorrow, so "marked past today" lands on the wrong date.
 * - `new Date('2026-10-26')` parses a bare date as UTC midnight, which west of
 *   Greenwich is still the evening before — the day displays one short.
 *
 * `lib/scheduleUtils.ts` carries its own copy of the first two helpers; new code
 * should import from here.
 */

const KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** The local calendar day of `date` as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Today on the owner's calendar. Takes `now` so callers and tests can pin the clock. */
export function todayKey(now: Date = new Date()): string {
  return toDateKey(now)
}

/**
 * Local midnight at the start of the day `key` names. Returns null for anything
 * that is not a real YYYY-MM-DD day — stored data can predate validation, and
 * `new Date(2026, 1, 30)` would otherwise roll quietly into March.
 */
export function parseDateKey(key: string): Date | null {
  const match = KEY_PATTERN.exec(key)
  if (!match) return null
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

/**
 * Whole calendar days from `fromKey` to `toKey` — positive when `toKey` is later.
 * Rounded, because a day that crosses a daylight-saving change is 23 or 25 hours
 * long and plain division would land a fraction off.
 */
export function daysBetween(fromKey: string, toKey: string): number | null {
  const from = parseDateKey(fromKey)
  const to = parseDateKey(toKey)
  if (!from || !to) return null
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

/** A date key as the owner's locale writes a date, e.g. "10/26/2026". */
export function formatDateKey(key: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseDateKey(key)
  return date ? date.toLocaleDateString(undefined, options) : key
}
