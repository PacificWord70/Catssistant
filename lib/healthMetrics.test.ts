import { describe, expect, it } from 'vitest'
import { Cat } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { CatalogProduct } from '@/types/item'
import { buildMetrics, metricsWithData } from '@/lib/healthMetrics'

const FROM = new Date(2026, 5, 1) // 1 June 2026
const TO = new Date(2026, 7, 31) // 31 August 2026

function event(over: Partial<ScheduleEvent>): ScheduleEvent {
  return {
    id: 'e1',
    catIds: ['c1'],
    category: 'Play',
    title: 'thing',
    date: '2026-06-01',
    times: [],
    recurrence: 'none',
    createdAt: '2026-06-01T00:00:00Z',
    ...over,
  } as ScheduleEvent
}

const cats = [{ id: 'c1', name: 'One' } as Cat, { id: 'c2', name: 'Two' } as Cat]
const products: CatalogProduct[] = [
  { id: 'dry', name: 'Kibble', category: 'Food', createdAt: 'x', food: { gramsPerCup: 120, kcal: { amount: 4000, per: 'kg' } } },
  { id: 'wet', name: 'Pâté', category: 'Food', createdAt: 'x', food: { gramsPerCan: 156, kcal: { amount: 180, per: 'can' } } },
  { id: 'bare', name: 'Mystery', category: 'Food', createdAt: 'x' },
]
const build = (events: ScheduleEvent[], records: HealthRecord[] = []) =>
  buildMetrics({ cats, records, events, products, from: FROM, to: TO })
const metric = (events: ScheduleEvent[], id: string, records: HealthRecord[] = []) =>
  build(events, records).find(m => m.id === id)!

describe('weight metric', () => {
  it('reads from health records, not the schedule', () => {
    const records: HealthRecord[] = [
      { id: 'r1', catId: 'c1', date: '2026-06-10', weightLbs: 10, createdAt: 'x' },
      { id: 'r2', catId: 'c2', date: '2026-06-10', weightLbs: 14, createdAt: 'x' },
    ]
    const m = metric([], 'weight', records)
    expect(m.kind).toBe('measured')
    expect(m.seriesFor('c1').map(p => p.value)).toEqual([10])
    expect(m.seriesFor('c2').map(p => p.value)).toEqual([14])
  })
})

describe('play metric', () => {
  it('multiplies duration by the number of times scheduled that day', () => {
    const m = metric([event({ durationMinutes: 15, times: ['09:00', '19:00'] })], 'play')
    expect(m.seriesFor('c1')[0].value).toBe(30)
  })

  it('counts an event with no times as one session', () => {
    const m = metric([event({ durationMinutes: 20, times: [] })], 'play')
    expect(m.seriesFor('c1')[0].value).toBe(20)
  })

  it('sums separate sessions on the same day', () => {
    const m = metric(
      [
        event({ id: 'a', durationMinutes: 10, times: ['09:00'] }),
        event({ id: 'b', durationMinutes: 25, times: ['19:00'] }),
      ],
      'play',
    )
    expect(m.seriesFor('c1')).toHaveLength(1)
    expect(m.seriesFor('c1')[0].value).toBe(35)
  })

  it('expands a weekly event across the window', () => {
    const m = metric(
      [event({ durationMinutes: 10, times: ['09:00'], recurrence: 'weekly', recurrenceEndDate: '2026-06-29' })],
      'play',
    )
    // 1, 8, 15, 22, 29 June
    expect(m.seriesFor('c1')).toHaveLength(5)
  })

  it('is marked planned, because nothing records what actually happened', () => {
    expect(metric([], 'play').kind).toBe('planned')
  })

  it('gives another cat nothing when the event is not theirs', () => {
    const m = metric([event({ durationMinutes: 15, times: ['09:00'], catIds: ['c1'] })], 'play')
    expect(m.seriesFor('c2')).toEqual([])
  })
})

describe('food metric', () => {
  const feeding = (unit: 'cup' | 'g' | 'can' | 'oz', amount: number, productId?: string, catId = 'c1') =>
    event({
      id: `f-${unit}-${productId}-${catId}`,
      category: 'Feeding',
      catIds: [catId],
      times: ['08:00', '18:00'],
      feedingAmounts: [{ catId, amount, unit, productId }],
    })

  it('multiplies the per-serving amount by the servings that day', () => {
    const m = metric([feeding('cup', 0.5, 'dry')], 'food-cup')
    expect(m.seriesFor('c1')[0].value).toBeCloseTo(1)
  })

  it('offers grams, cups and calories, with grams up by default', () => {
    const metrics = build([feeding('cup', 0.5, 'dry')])
    const food = metrics.filter(m => m.id.startsWith('food-'))
    expect(food.map(m => m.id)).toEqual(['food-g', 'food-cup', 'food-kcal'])
    expect(food.map(m => m.defaultOn)).toEqual([true, false, false])
  })

  it('converts every cat into each unit from the serving as written', () => {
    const metrics = build([feeding('cup', 0.5, 'dry'), feeding('can', 0.5, 'wet', 'c2')])
    const g = metrics.find(m => m.id === 'food-g')!
    expect(g.seriesFor('c1')[0].value).toBeCloseTo(120) // 2 × 0.5 cup × 120 g
    expect(g.seriesFor('c2')[0].value).toBeCloseTo(156) // 2 × 0.5 can × 156 g
    const kcal = metrics.find(m => m.id === 'food-kcal')!
    expect(kcal.seriesFor('c1')[0].value).toBeCloseTo(480)
    expect(kcal.seriesFor('c2')[0].value).toBeCloseTo(180)
  })

  it('adds a cup of dry and a can of wet into one grams figure', () => {
    const m = metric([feeding('cup', 0.25, 'dry'), feeding('can', 0.5, 'wet')], 'food-g')
    expect(m.seriesFor('c1')[0].value).toBeCloseTo(2 * 0.25 * 120 + 2 * 0.5 * 156)
  })

  it('leaves a can-fed cat off the cups chart and says why', () => {
    const m = metric([feeding('can', 0.5, 'wet')], 'food-cup')
    expect(m.seriesFor('c1')).toEqual([])
    expect(m.omittedReason!('c1')).toMatch(/can/)
  })

  it('leaves a cat off entirely when any serving cannot convert, rather than charting half its diet', () => {
    const m = metric([feeding('g', 60, 'dry'), feeding('can', 0.5, 'bare')], 'food-g')
    expect(m.seriesFor('c1')).toEqual([])
    expect(m.omittedReason!('c1')).toMatch(/Mystery/)
  })

  it('reports nothing omitted for a cat that charted', () => {
    const m = metric([feeding('oz', 3, undefined)], 'food-g')
    expect(m.seriesFor('c1')[0].value).toBeCloseTo(2 * 3 * 28.3495)
    expect(m.omittedReason!('c1')).toBeUndefined()
  })

  it('only counts the portion belonging to the cat asked about', () => {
    const shared = event({
      category: 'Feeding',
      catIds: ['c1', 'c2'],
      times: ['08:00'],
      feedingAmounts: [
        { catId: 'c1', amount: 0.5, unit: 'cup', productId: 'dry' },
        { catId: 'c2', amount: 1.25, unit: 'cup', productId: 'dry' },
      ],
    })
    const m = metric([shared], 'food-cup')
    expect(m.seriesFor('c1')[0].value).toBeCloseTo(0.5)
    expect(m.seriesFor('c2')[0].value).toBeCloseTo(1.25)
  })

  it('offers an empty placeholder food metric when nothing is fed', () => {
    const food = build([]).filter(m => m.id.startsWith('food'))
    expect(food.map(m => m.id)).toEqual(['food'])
  })
})

describe('vet metric', () => {
  it('buckets visits to the start of their month', () => {
    const m = metric(
      [event({ category: 'Vet', date: '2026-07-15' }), event({ id: 'v2', category: 'Vet', date: '2026-07-28' })],
      'vet',
    )
    expect(m.seriesFor('c1')).toEqual([expect.objectContaining({ date: '2026-07-01', value: 2 })])
  })

  it('keeps separate months apart', () => {
    const m = metric(
      [event({ category: 'Vet', date: '2026-06-04' }), event({ id: 'v2', category: 'Vet', date: '2026-08-04' })],
      'vet',
    )
    expect(m.seriesFor('c1').map(p => p.date)).toEqual(['2026-06-01', '2026-08-01'])
  })
})

describe('metricsWithData', () => {
  it('drops metrics with nothing for the chosen cats, so no empty axis is drawn', () => {
    const metrics = build([event({ durationMinutes: 10, times: ['09:00'], catIds: ['c1'] })])
    expect(metricsWithData(metrics, ['c1']).map(m => m.id)).toContain('play')
    expect(metricsWithData(metrics, ['c2']).map(m => m.id)).not.toContain('play')
  })

  it('keeps a metric when any one of the chosen cats has data', () => {
    const metrics = build([event({ durationMinutes: 10, times: ['09:00'], catIds: ['c1'] })])
    expect(metricsWithData(metrics, ['c1', 'c2']).map(m => m.id)).toContain('play')
  })
})
