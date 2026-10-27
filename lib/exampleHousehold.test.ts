import { describe, it, expect } from 'vitest'
import {
  buildExampleHousehold,
  EXAMPLE_ID_PREFIX,
  ExampleHouseholdError,
  EXAMPLE_REFUSAL_MESSAGE,
  isExampleId,
} from '@/lib/exampleHousehold'
import { daysBetween, parseDateKey } from '@/lib/dateKeys'
import { SCHEDULE_CATEGORIES } from '@/lib/scheduleAttributes'
import { PRODUCT_CATEGORIES } from '@/lib/itemAttributes'
import { catLifeStage } from '@/lib/utils'

const TODAY = '2026-10-27'
const house = buildExampleHousehold(TODAY)

const allRecords = [
  ...house.cats,
  ...house.events,
  ...house.healthRecords,
  ...house.products,
  ...house.items,
]

describe('buildExampleHousehold', () => {
  it('is the six cat tree characters', () => {
    expect(house.cats.map(c => c.name)).toEqual([
      'Biscuit',
      'Noodle',
      'Miso',
      'Pepper',
      'Mochi',
      'Pickle',
    ])
  })

  it('prefixes every id, so none can collide with a real record', () => {
    for (const record of allRecords) expect(record.id.startsWith(EXAMPLE_ID_PREFIX)).toBe(true)
    expect(isExampleId('example-biscuit')).toBe(true)
    expect(isExampleId(crypto.randomUUID())).toBe(false)
  })

  it('never repeats an id', () => {
    const ids = allRecords.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses only valid dates and timestamps', () => {
    const keys = [
      ...house.cats.map(c => c.birthday),
      ...house.events.flatMap(e => [e.date, e.recurrenceEndDate]),
      ...house.healthRecords.map(r => r.date),
      ...house.items.flatMap(i => [i.dateStarted, i.dateEnded]),
    ].filter((k): k is string => k !== undefined)
    for (const key of keys) expect(parseDateKey(key), key).not.toBeNull()
    for (const record of allRecords) expect(Number.isNaN(Date.parse(record.createdAt))).toBe(false)
  })

  it('points every event, reading and item at an example cat', () => {
    const catIds = new Set(house.cats.map(c => c.id))
    for (const e of house.events) {
      expect(e.catIds.length).toBeGreaterThan(0)
      for (const id of e.catIds) expect(catIds.has(id)).toBe(true)
      for (const a of e.feedingAmounts ?? []) expect(e.catIds).toContain(a.catId)
      for (const g of e.groomingTools ?? []) expect(e.catIds).toContain(g.catId)
    }
    for (const r of house.healthRecords) expect(catIds.has(r.catId)).toBe(true)
    for (const i of house.items) for (const id of i.catIds) expect(catIds.has(id)).toBe(true)
  })

  it('points every item at a product in the catalogue', () => {
    const productIds = new Set(house.products.map(p => p.id))
    for (const item of house.items) expect(productIds.has(item.productId)).toBe(true)
  })

  it('has a vet visit behind and one ahead of today', () => {
    const offsets = house.events
      .filter(e => e.category === 'Vet' && e.recurrence === 'none')
      .map(e => daysBetween(TODAY, e.date) as number)
    expect(offsets.some(d => d < 0)).toBe(true)
    expect(offsets.some(d => d > 0)).toBe(true)
  })

  it('shows off every schedule category and every product category', () => {
    const scheduled = new Set(house.events.map(e => e.category))
    for (const c of SCHEDULE_CATEGORIES) expect(scheduled.has(c), c).toBe(true)
    const stocked = new Set(house.products.map(p => p.category))
    for (const c of PRODUCT_CATEGORIES) expect(stocked.has(c), c).toBe(true)
  })

  it('includes current and past items', () => {
    expect(house.items.some(i => i.status === 'current')).toBe(true)
    expect(house.items.some(i => i.status === 'past' && i.dateEnded)).toBe(true)
  })

  it('gives at least three cats a run of weight readings', () => {
    const counts = new Map<string, number>()
    for (const r of house.healthRecords) counts.set(r.catId, (counts.get(r.catId) ?? 0) + 1)
    expect([...counts.values()].filter(n => n >= 4).length).toBeGreaterThanOrEqual(3)
  })

  it('moves with the calendar, so the example never looks abandoned', () => {
    const later = buildExampleHousehold('2027-03-14')
    const recheck = later.events.find(e => e.id === 'example-vet-recheck')
    expect(daysBetween('2027-03-14', recheck!.date)).toBe(5)
    // Pickle stays a kitten and Pepper a senior whenever it is opened.
    const pickle = later.cats.find(c => c.name === 'Pickle')!
    expect(daysBetween(pickle.birthday!, '2027-03-14')).toBe(125)
    const pepper = house.cats.find(c => c.name === 'Pepper')!
    expect(daysBetween(pepper.birthday!, TODAY)).toBeGreaterThan(365 * 10)
  })

  it('is pure: the same day gives the same household', () => {
    expect(buildExampleHousehold(TODAY)).toEqual(house)
  })

  it('crosses a month end and a leap day without drifting', () => {
    const leap = buildExampleHousehold('2028-02-29')
    for (const e of leap.events) expect(parseDateKey(e.date)).not.toBeNull()
    expect(catLifeStage(leap.cats.find(c => c.name === 'Pickle')!.birthday)).toBe('Kitten')
  })

  it('refuses a malformed day rather than building nonsense dates', () => {
    expect(() => buildExampleHousehold('27/10/2026')).toThrow()
  })
})

describe('ExampleHouseholdError', () => {
  it('carries the nudge as its message, so forms can show it as-is', () => {
    const err = new ExampleHouseholdError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe(EXAMPLE_REFUSAL_MESSAGE)
  })
})
