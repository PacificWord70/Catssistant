import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { daysBetween, formatDateKey, parseDateKey, toDateKey, todayKey } from '@/lib/dateKeys'

/**
 * Pinned to Los Angeles, because the bugs these helpers prevent only show west
 * of UTC: there a late evening is already tomorrow in UTC, and a bare
 * `new Date('YYYY-MM-DD')` is still yesterday locally. Run in UTC, every one of
 * these tests would pass against the broken shortcuts too.
 *
 * Kept in its own file because it changes `process.env.TZ`, and Vitest isolates
 * each file — so the switch cannot leak into other suites.
 */
let previousTz: string | undefined
beforeAll(() => {
  previousTz = process.env.TZ
  process.env.TZ = 'America/Los_Angeles'
})
afterAll(() => {
  if (previousTz === undefined) delete process.env.TZ
  else process.env.TZ = previousTz
})
afterEach(() => {
  vi.useRealTimers()
})

describe('todayKey', () => {
  it('returns the local day on a US evening, when UTC has already rolled over', () => {
    vi.useFakeTimers()
    // 9pm Pacific on 26 Oct is 04:00 UTC on 27 Oct.
    vi.setSystemTime(new Date('2026-10-27T04:00:00Z'))
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-10-27') // the bug
    expect(todayKey()).toBe('2026-10-26')
  })

  it('accepts an explicit clock', () => {
    expect(todayKey(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01')
  })
})

describe('toDateKey', () => {
  it('zero-pads month and day', () => {
    expect(toDateKey(new Date(2026, 2, 7))).toBe('2026-03-07')
  })
})

describe('parseDateKey', () => {
  it('returns local midnight of that day, not the evening before', () => {
    const date = parseDateKey('2026-10-26')!
    expect(new Date('2026-10-26').getDate()).toBe(25) // the bug
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(9)
    expect(date.getDate()).toBe(26)
    expect(date.getHours()).toBe(0)
  })

  it('round-trips with toDateKey', () => {
    for (const key of ['2026-01-01', '2026-03-08', '2026-11-01', '2028-02-29']) {
      expect(toDateKey(parseDateKey(key)!)).toBe(key)
    }
  })

  it('rejects malformed and impossible days', () => {
    expect(parseDateKey('')).toBeNull()
    expect(parseDateKey('2026-10-26T00:00:00Z')).toBeNull()
    expect(parseDateKey('2026-2-3')).toBeNull()
    expect(parseDateKey('2026-02-30')).toBeNull()
    expect(parseDateKey('2026-13-01')).toBeNull()
  })
})

describe('daysBetween', () => {
  it('counts calendar days, signed', () => {
    expect(daysBetween('2026-10-20', '2026-10-26')).toBe(6)
    expect(daysBetween('2026-10-26', '2026-10-20')).toBe(-6)
    expect(daysBetween('2026-10-26', '2026-10-26')).toBe(0)
  })

  it('stays whole across a daylight-saving change', () => {
    // US clocks fall back on 1 Nov 2026, making that day 25 hours long.
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2)
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2)
  })

  it('returns null for a bad key', () => {
    expect(daysBetween('nope', '2026-10-26')).toBeNull()
  })
})

describe('formatDateKey', () => {
  it('formats the named day, not the day before', () => {
    expect(formatDateKey('2026-10-26', { month: 'short', day: 'numeric' })).toMatch(/26/)
  })

  it('passes an unparseable key through rather than printing "Invalid Date"', () => {
    expect(formatDateKey('someday')).toBe('someday')
  })
})
