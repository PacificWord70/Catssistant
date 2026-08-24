import { HealthRecord } from '@/types/healthRecord'

/**
 * Turning health records into something a chart can draw.
 *
 * Kept free of React and of the DOM so the maths is testable on its own — the
 * Vitest suite only covers `lib/`, and geometry that lives inside a component
 * is geometry nobody can assert on.
 */

export interface WeightPoint {
  /** The record this came from, so a point on the chart can be edited. */
  id: string
  /** ISO date, YYYY-MM-DD. */
  date: string
  lbs: number
}

/**
 * Same local-time parsing as `scheduleUtils`. `new Date('2026-06-01')` reads a
 * bare ISO date as UTC midnight, which lands on the previous day anywhere west
 * of Greenwich and would shift every point on the axis.
 */
function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * The weight readings for one cat, oldest first.
 *
 * Records without a weight are dropped rather than plotted as zero — a missing
 * measurement is not a measurement of nothing, and a zero would wreck the axis.
 */
export function weightSeries(records: HealthRecord[]): WeightPoint[] {
  return records
    .filter((r): r is HealthRecord & { weightLbs: number } => typeof r.weightLbs === 'number')
    .map(r => ({ id: r.id, date: r.date, lbs: r.weightLbs }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface WeightTrend {
  changeLbs: number
  percent: number
  direction: 'up' | 'down' | 'steady'
  from: WeightPoint
  to: WeightPoint
  days: number
}

/**
 * Change between the first and last reading.
 *
 * Deliberately first-to-last rather than a fitted line: with the handful of
 * points an owner actually records, a regression slope reads as more precision
 * than the data supports.
 *
 * "Steady" is a band, not an exact equality, because scales disagree with
 * themselves by a few ounces and a 0.05lb difference is not a trend.
 */
export function weightTrend(series: WeightPoint[], steadyBandLbs = 0.1): WeightTrend | undefined {
  if (series.length < 2) return undefined
  const from = series[0]
  const to = series[series.length - 1]
  const changeLbs = to.lbs - from.lbs
  const msPerDay = 1000 * 60 * 60 * 24
  return {
    changeLbs,
    percent: from.lbs === 0 ? 0 : (changeLbs / from.lbs) * 100,
    direction: Math.abs(changeLbs) <= steadyBandLbs ? 'steady' : changeLbs > 0 ? 'up' : 'down',
    from,
    to,
    days: Math.round((parseDateKey(to.date).getTime() - parseDateKey(from.date).getTime()) / msPerDay),
  }
}

export interface ChartGeometry {
  points: { x: number; y: number; point: WeightPoint }[]
  /** Y axis labels, low to high, with the y each sits at. */
  ticks: { lbs: number; y: number }[]
  minLbs: number
  maxLbs: number
}

/**
 * Maps a series into chart coordinates.
 *
 * X is proportional to *time*, not to index, so a six-month gap between two
 * readings looks like a six-month gap. Spacing points evenly would imply the
 * owner weighed the cat on a regular cadence they did not keep.
 *
 * The Y domain is padded away from the data so the line never runs along the
 * frame, and a flat or single-point series gets an artificial band — otherwise
 * min equals max, every point divides by zero, and the line vanishes.
 */
export function chartGeometry(
  series: WeightPoint[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
  tickCount = 4,
): ChartGeometry | undefined {
  if (series.length === 0) return undefined

  const lows = series.map(p => p.lbs)
  const rawMin = Math.min(...lows)
  const rawMax = Math.max(...lows)
  // A flat series has no range to scale against; give it one so it draws as a
  // level line through the middle rather than collapsing onto an edge.
  const span = rawMax - rawMin || Math.max(rawMax * 0.1, 1)
  const minLbs = rawMin - span * 0.15
  const maxLbs = rawMax + span * 0.15

  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom
  const yFor = (lbs: number) => padding.top + plotH - ((lbs - minLbs) / (maxLbs - minLbs)) * plotH

  const times = series.map(p => parseDateKey(p.date).getTime())
  const tMin = times[0]
  const tMax = times[times.length - 1]
  const tSpan = tMax - tMin

  const points = series.map((point, i) => ({
    // One reading, or several on the same day, has no time span to spread over.
    // Centre it rather than dividing by zero.
    x: tSpan === 0 ? padding.left + plotW / 2 : padding.left + ((times[i] - tMin) / tSpan) * plotW,
    y: yFor(point.lbs),
    point,
  }))

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const lbs = minLbs + ((maxLbs - minLbs) * i) / (tickCount - 1)
    return { lbs, y: yFor(lbs) }
  })

  return { points, ticks, minLbs, maxLbs }
}
