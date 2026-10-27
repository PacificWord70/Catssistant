import { describe, expect, it } from 'vitest'
import { HealthRecord } from '@/types/healthRecord'
import { Cat } from '@/types/cat'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { catHealthSummary, chartGeometry, multiSeriesGeometry, weightSeries, weightTrend } from '@/lib/healthAnalysis'

const PADDING = { top: 10, right: 10, bottom: 20, left: 30 }

function record(date: string, weightLbs?: number, catId = 'c1'): HealthRecord {
  return { id: `r-${date}-${weightLbs ?? 'x'}`, catId, date, weightLbs, createdAt: `${date}T00:00:00Z` }
}

describe('weightSeries', () => {
  it('sorts oldest first regardless of stored order', () => {
    const series = weightSeries([record('2026-03-01', 10), record('2026-01-01', 9), record('2026-02-01', 9.5)])
    expect(series.map(p => p.date)).toEqual(['2026-01-01', '2026-02-01', '2026-03-01'])
  })

  it('drops records with no weight rather than plotting them as zero', () => {
    const series = weightSeries([record('2026-01-01', 9), record('2026-02-01', undefined), record('2026-03-01', 10)])
    expect(series).toHaveLength(2)
    expect(series.every(p => p.value > 0)).toBe(true)
  })

  it('is empty when nothing has a weight', () => {
    expect(weightSeries([record('2026-01-01'), record('2026-02-01')])).toEqual([])
  })
})

describe('weightTrend', () => {
  it('is undefined with fewer than two readings', () => {
    expect(weightTrend([])).toBeUndefined()
    expect(weightTrend(weightSeries([record('2026-01-01', 9)]))).toBeUndefined()
  })

  it('measures first to last, ignoring the wander in between', () => {
    const trend = weightTrend(weightSeries([record('2026-01-01', 10), record('2026-02-01', 14), record('2026-03-01', 11)]))
    expect(trend!.changeLbs).toBeCloseTo(1)
    expect(trend!.direction).toBe('up')
  })

  it('reports a loss as down, with a negative change', () => {
    const trend = weightTrend(weightSeries([record('2026-01-01', 12), record('2026-03-01', 10.5)]))
    expect(trend!.changeLbs).toBeCloseTo(-1.5)
    expect(trend!.percent).toBeCloseTo(-12.5)
    expect(trend!.direction).toBe('down')
  })

  it('calls a difference inside the band steady, since scales disagree by ounces', () => {
    expect(weightTrend(weightSeries([record('2026-01-01', 10), record('2026-02-01', 10.05)]))!.direction).toBe('steady')
    expect(weightTrend(weightSeries([record('2026-01-01', 10), record('2026-02-01', 10.5)]))!.direction).toBe('up')
  })

  it('counts elapsed days across a month boundary', () => {
    expect(weightTrend(weightSeries([record('2026-01-01', 10), record('2026-02-01', 11)]))!.days).toBe(31)
  })
})

describe('chartGeometry', () => {
  it('is undefined with no readings, so the caller shows an empty state', () => {
    expect(chartGeometry([], 400, 200, PADDING)).toBeUndefined()
  })

  it('spaces points by elapsed time, not by index', () => {
    // Three readings where the second sits a tenth of the way along.
    const geo = chartGeometry(weightSeries([record('2026-01-01', 10), record('2026-01-11', 10.5), record('2026-05-11', 11)]), 430, 200, PADDING)!
    const [a, b, c] = geo.points
    const alongTheWay = (b.x - a.x) / (c.x - a.x)
    expect(alongTheWay).toBeGreaterThan(0.05)
    expect(alongTheWay).toBeLessThan(0.12)
  })

  it('centres a single reading instead of dividing by a zero time span', () => {
    const geo = chartGeometry(weightSeries([record('2026-01-01', 10)]), 430, 200, PADDING)!
    expect(geo.points).toHaveLength(1)
    expect(Number.isFinite(geo.points[0].x)).toBe(true)
    expect(geo.points[0].x).toBeCloseTo(PADDING.left + (430 - PADDING.left - PADDING.right) / 2)
  })

  it('gives a flat series a band so the line does not collapse onto an edge', () => {
    const geo = chartGeometry(weightSeries([record('2026-01-01', 10), record('2026-02-01', 10)]), 430, 200, PADDING)!
    expect(geo.max).toBeGreaterThan(geo.min)
    expect(geo.points.every(p => Number.isFinite(p.y))).toBe(true)
    // Both readings are equal, so both sit at the same height, mid-plot.
    expect(geo.points[0].y).toBeCloseTo(geo.points[1].y)
  })

  it('keeps every point inside the padded plot area', () => {
    const geo = chartGeometry(weightSeries([record('2026-01-01', 8), record('2026-02-01', 15), record('2026-03-01', 11)]), 430, 200, PADDING)!
    for (const p of geo.points) {
      expect(p.x).toBeGreaterThanOrEqual(PADDING.left)
      expect(p.x).toBeLessThanOrEqual(430 - PADDING.right)
      expect(p.y).toBeGreaterThanOrEqual(PADDING.top)
      expect(p.y).toBeLessThanOrEqual(200 - PADDING.bottom)
    }
  })

  it('pads the domain past the data so the line never runs along the frame', () => {
    const geo = chartGeometry(weightSeries([record('2026-01-01', 9), record('2026-02-01', 11)]), 430, 200, PADDING)!
    expect(geo.min).toBeLessThan(9)
    expect(geo.max).toBeGreaterThan(11)
  })

  it('returns ticks low to high, spanning the domain', () => {
    const geo = chartGeometry(weightSeries([record('2026-01-01', 9), record('2026-02-01', 11)]), 430, 200, PADDING)!
    expect(geo.ticks).toHaveLength(4)
    expect(geo.ticks[0].value).toBeCloseTo(geo.min)
    expect(geo.ticks[3].value).toBeCloseTo(geo.max)
    // Higher weight means a smaller y — screen coordinates run downward.
    expect(geo.ticks[3].y).toBeLessThan(geo.ticks[0].y)
  })
})

describe('multiSeriesGeometry', () => {
  const named = (id: string, label: string, rs: HealthRecord[]) => ({ id, label, points: weightSeries(rs) })

  it('is undefined when no cat has a reading', () => {
    expect(multiSeriesGeometry([], 640, 260, PADDING)).toBeUndefined()
    expect(multiSeriesGeometry([named('a', 'A', [])], 640, 260, PADDING)).toBeUndefined()
  })

  it('drops cats with no readings but keeps the rest', () => {
    const geo = multiSeriesGeometry(
      [named('a', 'A', [record('2026-01-01', 9)]), named('b', 'B', []), named('c', 'C', [record('2026-02-01', 12)])],
      640, 260, PADDING,
    )!
    expect(geo.lines.map(l => l.id)).toEqual(['a', 'c'])
  })

  it('shares one weight domain, so a light cat sits below a heavy one', () => {
    const geo = multiSeriesGeometry(
      [
        named('light', 'Light', [record('2026-01-01', 8), record('2026-02-01', 8.4)]),
        named('heavy', 'Heavy', [record('2026-01-01', 15), record('2026-02-01', 15.4)]),
      ],
      640, 260, PADDING,
    )!
    const light = geo.lines.find(l => l.id === 'light')!
    const heavy = geo.lines.find(l => l.id === 'heavy')!
    // Smaller y is higher on screen: the heavy cat must be above the light one.
    expect(heavy.points[0].y).toBeLessThan(light.points[0].y)
    expect(geo.min).toBeLessThan(8)
    expect(geo.max).toBeGreaterThan(15.4)
  })

  it('shares one time axis, so the same date lands at the same x on every line', () => {
    const geo = multiSeriesGeometry(
      [
        named('a', 'A', [record('2026-01-01', 9), record('2026-03-01', 10)]),
        named('b', 'B', [record('2026-01-01', 12), record('2026-03-01', 13)]),
      ],
      640, 260, PADDING,
    )!
    const [a, b] = geo.lines
    expect(a.points[0].x).toBeCloseTo(b.points[0].x)
    expect(a.points[1].x).toBeCloseTo(b.points[1].x)
  })

  it('spans the full range across cats, not just the first one', () => {
    const geo = multiSeriesGeometry(
      [named('a', 'A', [record('2026-02-01', 9)]), named('b', 'B', [record('2026-01-01', 12), record('2026-06-01', 13)])],
      640, 260, PADDING,
    )!
    expect(geo.from).toBe('2026-01-01')
    expect(geo.to).toBe('2026-06-01')
  })

  it('centres a single shared date rather than dividing by a zero span', () => {
    const geo = multiSeriesGeometry(
      [named('a', 'A', [record('2026-01-01', 9)]), named('b', 'B', [record('2026-01-01', 12)])],
      640, 260, PADDING,
    )!
    for (const line of geo.lines) expect(Number.isFinite(line.points[0].x)).toBe(true)
    expect(geo.lines[0].points[0].x).toBeCloseTo(geo.lines[1].points[0].x)
  })
})

describe('catHealthSummary', () => {
  const TODAY = '2026-06-15'
  const cat = (over: Partial<Cat> = {}): Cat => ({ id: 'c1', name: 'Miso', breed: [], weightUnit: 'lbs', ...over }) as Cat
  const event = (over: Partial<ScheduleEvent>): ScheduleEvent => ({
    id: `e-${over.date}-${over.category}`,
    catIds: ['c1'],
    category: 'Vet',
    title: 'x',
    date: TODAY,
    times: [],
    recurrence: 'none',
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  })

  it('takes the newest reading and the trend across all of them', () => {
    const s = catHealthSummary(cat(), [record('2026-01-01', 9), record('2026-03-01', 10)], [], TODAY)
    expect(s.weight).toEqual({ lbs: 10, date: '2026-03-01', source: 'reading' })
    expect(s.readingCount).toBe(2)
    expect(s.trend?.direction).toBe('up')
    expect(s.trend?.days).toBe(59)
  })

  it('falls back to the undated profile weight, converted to pounds', () => {
    const s = catHealthSummary(cat({ weight: 5, weightUnit: 'kg' }), [], [], TODAY)
    expect(s.weight?.source).toBe('profile')
    expect(s.weight?.date).toBeUndefined()
    expect(s.weight?.lbs).toBeCloseTo(11.02, 1)
  })

  it("ignores another cat's readings and events", () => {
    const s = catHealthSummary(
      cat(),
      [record('2026-01-01', 12, 'c2')],
      [event({ date: '2026-06-01', catIds: ['c2'] })],
      TODAY,
    )
    expect(s.weight).toBeUndefined()
    expect(s.lastVet).toBeUndefined()
  })

  it('splits vet visits into the last one that happened and the next one booked', () => {
    const s = catHealthSummary(
      cat(),
      [],
      [event({ date: '2026-07-01' }), event({ date: '2026-02-01' }), event({ date: '2026-05-01' })],
      TODAY,
    )
    expect(s.lastVet).toBe('2026-05-01')
    expect(s.nextVet).toBe('2026-07-01')
  })

  it('counts a visit on today as the last one, not the next', () => {
    const s = catHealthSummary(cat(), [], [event({ date: TODAY })], TODAY)
    expect(s.lastVet).toBe(TODAY)
    expect(s.nextVet).toBeUndefined()
  })

  it('counts medications as starts minus stops, never below zero', () => {
    const meds = [
      event({ category: 'Medication', date: '2026-01-01', medicationStatus: 'Started' }),
      event({ category: 'Medication', date: '2026-02-01', medicationStatus: 'Started' }),
      event({ category: 'Medication', date: '2026-03-01', medicationStatus: 'Stopped' }),
    ]
    expect(catHealthSummary(cat(), [], meds, TODAY).activeMeds).toBe(1)
    expect(catHealthSummary(cat(), [], meds.slice(2), TODAY).activeMeds).toBe(0)
  })
})
