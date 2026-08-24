import { describe, expect, it } from 'vitest'
import { HealthRecord } from '@/types/healthRecord'
import { chartGeometry, weightSeries, weightTrend } from '@/lib/healthAnalysis'

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
    expect(series.every(p => p.lbs > 0)).toBe(true)
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
    expect(geo.maxLbs).toBeGreaterThan(geo.minLbs)
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
    expect(geo.minLbs).toBeLessThan(9)
    expect(geo.maxLbs).toBeGreaterThan(11)
  })

  it('returns ticks low to high, spanning the domain', () => {
    const geo = chartGeometry(weightSeries([record('2026-01-01', 9), record('2026-02-01', 11)]), 430, 200, PADDING)!
    expect(geo.ticks).toHaveLength(4)
    expect(geo.ticks[0].lbs).toBeCloseTo(geo.minLbs)
    expect(geo.ticks[3].lbs).toBeCloseTo(geo.maxLbs)
    // Higher weight means a smaller y — screen coordinates run downward.
    expect(geo.ticks[3].y).toBeLessThan(geo.ticks[0].y)
  })
})
