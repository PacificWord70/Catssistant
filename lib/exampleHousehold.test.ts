import { describe, it, expect } from 'vitest'
import {
  buildExampleHousehold,
  EXAMPLE_ID_PREFIX,
  ExampleHouseholdError,
  EXAMPLE_REFUSAL_MESSAGE,
  isExampleId,
} from '@/lib/exampleHousehold'
import { daysBetween, parseDateKey } from '@/lib/dateKeys'
import { catHealthSummary, weightSeries } from '@/lib/healthAnalysis'
import { buildMetrics } from '@/lib/healthMetrics'
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
    expect(daysBetween(pickle.birthday!, '2027-03-14')).toBe(112)
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

describe('the example health stories', () => {
  const catNamed = (name: string) => house.cats.find(c => c.name === name)!
  const seriesFor = (name: string) =>
    weightSeries(house.healthRecords.filter(r => r.catId === catNamed(name).id))
  const weights = (name: string) => seriesFor(name).map(p => p.value)
  const eventsFor = (name: string) => house.events.filter(e => e.catIds.includes(catNamed(name).id))
  const summary = (name: string) =>
    catHealthSummary(catNamed(name), house.healthRecords, house.events, TODAY)

  it('takes Pepper’s weight history back at least eighteen months', () => {
    expect(daysBetween(seriesFor('Pepper')[0].date, TODAY)).toBeGreaterThanOrEqual(548)
  })

  it('has Pepper lose weight before the diagnosis and regain it on treatment', () => {
    const w = weights('Pepper')
    const low = Math.min(...w)
    expect(low).toBeLessThan(w[0])
    expect(low).toBeLessThan(w[w.length - 1])
    const lowAt = w.indexOf(low)
    expect(lowAt).toBeGreaterThan(0)
    expect(lowAt).toBeLessThan(w.length - 1)
    // The tablets start on the day of the diagnosis, and carry on.
    const meds = eventsFor('Pepper').find(e => e.category === 'Medication')!
    const diagnosis = house.events.find(e => e.id === 'example-pepper-diagnosis')!
    expect(meds.date).toBe(diagnosis.date)
    expect(meds.medicationDuration).toBe('Forever')
  })

  it('has Noodle lose weight from his peak at a sensible pace', () => {
    const series = seriesFor('Noodle')
    const peak = series.reduce((a, b) => (b.value > a.value ? b : a))
    const latest = series[series.length - 1]
    expect(latest.value).toBeLessThan(peak.value)
    const months = (daysBetween(peak.date, latest.date) as number) / 30.4
    const perMonth = (peak.value - latest.value) / peak.value / months
    expect(perMonth).toBeGreaterThan(0.01)
    expect(perMonth).toBeLessThanOrEqual(0.02)
  })

  it('swaps Noodle’s dinner the day after the old one ends, for a smaller portion', () => {
    const noodle = catNamed('Noodle').id
    const feeds = eventsFor('Noodle').filter(e => e.category === 'Feeding')
    const ended = feeds.find(
      e => e.recurrenceEndDate && e.feedingAmounts!.some(a => a.unit === 'cup'),
    )!
    const diet = feeds.find(e => e.id === 'example-noodle-diet')!
    expect(daysBetween(ended.recurrenceEndDate!, diet.date)).toBe(1)
    const perDay = (e: (typeof feeds)[number]) =>
      e.feedingAmounts!.find(a => a.catId === noodle)!.amount * e.times.length
    expect(perDay(diet)).toBeLessThan(perDay(ended))
  })

  it('charts more planned play for Noodle once the diet starts', () => {
    const metrics = buildMetrics({
      cats: house.cats,
      records: house.healthRecords,
      events: house.events,
      from: parseDateKey('2024-10-27')!,
      to: parseDateKey(TODAY)!,
    })
    const play = metrics.find(m => m.id === 'play')!.seriesFor(catNamed('Noodle').id)
    const diet = house.events.find(e => e.id === 'example-noodle-diet')!.date
    const avg = (pts: { value: number }[]) => pts.reduce((s, p) => s + p.value, 0) / pts.length
    const before = play.filter(p => p.date < diet)
    const after = play.filter(p => p.date >= diet)
    expect(before.length).toBeGreaterThan(0)
    expect(avg(after)).toBeGreaterThan(avg(before))
  })

  it('moves Miso onto the urinary diet after his vet visit, and off everything else', () => {
    const firstVet = eventsFor('Miso')
      .filter(e => e.category === 'Vet')
      .map(e => e.date)
      .sort()[0]
    const feeds = eventsFor('Miso').filter(e => e.category === 'Feeding')
    const urinary = feeds.filter(e => e.foodBrand === 'Northpaw Veterinary')
    expect(urinary.length).toBeGreaterThan(0)
    for (const e of urinary) expect(e.date > firstVet).toBe(true)
    for (const e of feeds.filter(f => !urinary.includes(f))) {
      expect(e.recurrenceEndDate! < urinary[0].date, e.id).toBe(true)
    }
  })

  it('grows Pickle steadily, with a plateau while she was ill', () => {
    const w = weights('Pickle')
    expect(w.length).toBeGreaterThanOrEqual(8)
    const steps = w.slice(1).map((v, i) => v - w[i])
    expect(steps.every(s => s >= 0)).toBe(true)
    expect(steps.some(s => s <= 0.05)).toBe(true)
    expect(steps.filter(s => s > 0.05).length).toBeGreaterThanOrEqual(steps.length - 2)
    expect(w[w.length - 1] - w[0]).toBeGreaterThan(2)
  })

  it('pairs every Stopped medication with a Started one before it', () => {
    const meds = house.events.filter(e => e.category === 'Medication')
    for (const stop of meds.filter(e => e.medicationStatus === 'Stopped')) {
      const start = meds.find(
        e =>
          e.medicationStatus === 'Started' &&
          e.title === stop.title &&
          e.catIds.join() === stop.catIds.join() &&
          e.date < stop.date,
      )
      expect(start, stop.id).toBeDefined()
    }
  })

  it('counts only the medications still being given', () => {
    expect(summary('Pepper').activeMeds).toBe(1) // methimazole
    expect(summary('Pickle').activeMeds).toBe(1) // monthly flea treatment
    expect(summary('Biscuit').activeMeds).toBe(0)
    expect(summary('Miso').activeMeds).toBe(0)
  })

  it('has a vet visit behind and ahead for Pepper and for Pickle', () => {
    for (const name of ['Pepper', 'Pickle']) {
      expect(summary(name).lastVet, name).toBeDefined()
      expect(summary(name).nextVet, name).toBeDefined()
    }
  })

  it('fills in the fields each event’s form shows', () => {
    for (const e of house.events) {
      if (e.recurrenceEndDate) expect(e.recurrenceEndDate >= e.date, e.id).toBe(true)
      if (e.category === 'Feeding') {
        expect(e.times.length, e.id).toBeGreaterThan(0)
        expect(e.foodName, e.id).toBeTruthy()
        for (const c of e.catIds) {
          const amount = e.feedingAmounts?.find(a => a.catId === c)?.amount ?? 0
          expect(amount, e.id).toBeGreaterThan(0)
        }
      }
      if (e.category === 'Medication') {
        expect(e.medicationStatus, e.id).toBeDefined()
        if (e.medicationStatus === 'Started') {
          expect(e.medicationDuration, e.id).toBeDefined()
          expect(e.times.length, e.id).toBeGreaterThan(0)
        } else {
          expect(e.medicationDuration, e.id).toBeUndefined()
        }
      }
      if (e.category === 'Vet') {
        expect(e.vetName, e.id).toBeTruthy()
        expect(e.vetAddress, e.id).toBeTruthy()
        expect(e.times.length, e.id).toBeGreaterThan(0)
      }
    }
  })
})

describe('ExampleHouseholdError', () => {
  it('carries the nudge as its message, so forms can show it as-is', () => {
    const err = new ExampleHouseholdError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe(EXAMPLE_REFUSAL_MESSAGE)
  })
})
