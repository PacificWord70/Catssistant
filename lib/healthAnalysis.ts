import { HealthRecord } from '@/types/healthRecord'
import { Cat } from '@/types/cat'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { daysBetween, parseDateKey, toDateKey } from '@/lib/dateKeys'
import { expandEvents } from '@/lib/scheduleUtils'
import { catWeightLbs } from '@/lib/utils'

/**
 * Turning health records into something a chart can draw.
 *
 * Kept free of React and of the DOM so the maths is testable on its own — the
 * Vitest suite only covers `lib/`, and geometry that lives inside a component
 * is geometry nobody can assert on.
 */

export interface SeriesPoint {
  /** The record this came from, where a point maps to one — used for editing. */
  id: string
  /** ISO date, YYYY-MM-DD. */
  date: string
  /** The measurement, in whatever unit the metric declares. */
  value: number
  /**
   * What the owner wrote beside a weight reading, shown when the date is
   * hovered. Only weight carries one: a scheduled metric's point is a sum
   * across a day's events, with no single note that belongs to it.
   */
  note?: string
}

/** @deprecated Use SeriesPoint. Kept so weight code reads naturally. */
export type WeightPoint = SeriesPoint

/**
 * Local midnight of a date key, as a timestamp for the time axis. Local because
 * a UTC parse would shift every point a day west of Greenwich.
 *
 * A key that is not a real day gives NaN rather than a guess: the form only
 * saves real dates, and quietly rolling 2026-02-30 into March would plot a
 * reading on a day it was never taken.
 */
function timeOf(key: string): number {
  return parseDateKey(key)?.getTime() ?? NaN
}

/** How far back the health charts look. */
export type ChartRange = '3m' | '6m' | '1y' | '2y' | 'all'

export const CHART_RANGES: { value: ChartRange; label: string; months?: number }[] = [
  { value: '3m', label: '3 months', months: 3 },
  { value: '6m', label: '6 months', months: 6 },
  { value: '1y', label: '1 year', months: 12 },
  { value: '2y', label: '2 years', months: 24 },
  { value: 'all', label: 'All' },
]

/**
 * The first day a range covers, counting back whole months from `today`, or
 * undefined for "All". Built from local calendar fields so a range never starts
 * a day off, and a month that is too short clamps (Mar 31 back one month is the
 * last day of February) rather than spilling into the next month.
 */
export function chartRangeStart(today: string, range: ChartRange): string | undefined {
  const months = CHART_RANGES.find(r => r.value === range)?.months
  const date = parseDateKey(today)
  if (!months || !date) return undefined
  const target = new Date(date.getFullYear(), date.getMonth() - months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(date.getDate(), lastDay))
  return toDateKey(target)
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
    // A blank note is left off rather than carried as "", so a point only says
    // it has a note when there is something to read.
    .map(r => {
      const point: WeightPoint = { id: r.id, date: r.date, value: r.weightLbs }
      const note = r.notes?.trim()
      return note ? { ...point, note } : point
    })
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
  const changeLbs = to.value - from.value
  return {
    changeLbs,
    percent: from.value === 0 ? 0 : (changeLbs / from.value) * 100,
    direction: Math.abs(changeLbs) <= steadyBandLbs ? 'steady' : changeLbs > 0 ? 'up' : 'down',
    from,
    to,
    days: daysBetween(from.date, to.date) ?? 0,
  }
}

export interface ChartGeometry {
  points: { x: number; y: number; point: WeightPoint }[]
  /** Y axis labels, low to high, with the y each sits at. */
  ticks: { value: number; y: number }[]
  min: number
  max: number
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

  const lows = series.map(p => p.value)
  const rawMin = Math.min(...lows)
  const rawMax = Math.max(...lows)
  // A flat series has no range to scale against; give it one so it draws as a
  // level line through the middle rather than collapsing onto an edge.
  const span = rawMax - rawMin || Math.max(rawMax * 0.1, 1)
  const min = rawMin - span * 0.15
  const max = rawMax + span * 0.15

  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom
  const yFor = (value: number) => padding.top + plotH - ((value - min) / (max - min)) * plotH

  const times = series.map(p => timeOf(p.date))
  const tMin = times[0]
  const tMax = times[times.length - 1]
  const tSpan = tMax - tMin

  const points = series.map((point, i) => ({
    // One reading, or several on the same day, has no time span to spread over.
    // Centre it rather than dividing by zero.
    x: tSpan === 0 ? padding.left + plotW / 2 : padding.left + ((times[i] - tMin) / tSpan) * plotW,
    y: yFor(point.value),
    point,
  }))

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const value = min + ((max - min) * i) / (tickCount - 1)
    return { value, y: yFor(value) }
  })

  return { points, ticks, min, max }
}

export interface NamedSeries {
  /** Cat id, or whatever the caller keys lines by. */
  id: string
  label: string
  points: WeightPoint[]
}

export interface MultiSeriesGeometry {
  lines: {
    id: string
    label: string
    points: { x: number; y: number; point: WeightPoint }[]
  }[]
  ticks: { value: number; y: number }[]
  min: number
  max: number
  /** Date range covered, for the axis labels. */
  from: string
  to: string
}

/**
 * Lays several cats out on one pair of axes.
 *
 * The domains are deliberately *shared* rather than computed per line. Scaling
 * each cat to its own range would put a 9lb cat and a 15lb cat on the same
 * visual level and make a comparison chart lie about the thing it exists to
 * compare. Same for time: every line is placed against one date range, so a
 * point halfway across means the same moment on every line.
 */
export function multiSeriesGeometry(
  seriesList: NamedSeries[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
  tickCount = 4,
  /**
   * A fixed span for the time axis. Without it the axis runs from the first
   * reading to the last, so "1 year" with three readings in May would look like
   * a busy month. Points outside it are dropped.
   */
  domain?: { from: string; to: string },
): MultiSeriesGeometry | undefined {
  const inDomain = (date: string) => !domain || (date >= domain.from && date <= domain.to)
  const withPoints = seriesList
    .map(s => ({ ...s, points: s.points.filter(p => inDomain(p.date)) }))
    .filter(s => s.points.length > 0)
  if (withPoints.length === 0) return undefined

  const allPoints = withPoints.flatMap(s => s.points)
  const weights = allPoints.map(p => p.value)
  const rawMin = Math.min(...weights)
  const rawMax = Math.max(...weights)
  const span = rawMax - rawMin || Math.max(rawMax * 0.1, 1)
  const min = rawMin - span * 0.15
  const max = rawMax + span * 0.15

  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom
  const yFor = (value: number) => padding.top + plotH - ((value - min) / (max - min)) * plotH

  const dates = allPoints.map(p => p.date).sort()
  const from = domain?.from ?? dates[0]
  const to = domain?.to ?? dates[dates.length - 1]
  const tMin = timeOf(from)
  const tMax = timeOf(to)
  const tSpan = tMax - tMin

  return {
    lines: withPoints.map(s => ({
      id: s.id,
      label: s.label,
      points: s.points.map(point => ({
        // Everything on one day, or a single reading overall, has no span to
        // spread across. Centre rather than divide by zero.
        x:
          tSpan === 0
            ? padding.left + plotW / 2
            : padding.left + ((timeOf(point.date) - tMin) / tSpan) * plotW,
        y: yFor(point.value),
        point,
      })),
    })),
    ticks: Array.from({ length: tickCount }, (_, i) => {
      const value = min + ((max - min) * i) / (tickCount - 1)
      return { value, y: yFor(value) }
    }),
    min,
    max,
    from,
    to,
  }
}

export interface CatHealthSummary {
  catId: string
  /**
   * The newest weight. Falls back to the profile weight, flagged as such,
   * because a profile weight has no date and must not be presented as a reading.
   */
  weight?: { lbs: number; date?: string; source: 'reading' | 'profile' }
  /** How many dated weight readings there are, so "no trend" can say why. */
  readingCount: number
  trend?: WeightTrend
  /** The newest vet visit on or before today. */
  lastVet?: string
  /** The soonest vet visit after today. */
  nextVet?: string
  vetName?: string
  illnesses: string[]
  activeMeds: number
}

/**
 * Everything the health stat card shows for one cat, worked out without any
 * layout in mind.
 *
 * One cat at a time on purpose. The page shows a card per cat side by side
 * today, but a combined table is on the cards; computing per cat keeps that
 * switch a change to the markup alone. Averaging across cats was never an
 * option — it says nothing true about any one of them.
 *
 * `today` is passed in so the past/future split is testable on any day.
 */
export function catHealthSummary(
  cat: Cat,
  records: HealthRecord[],
  events: ScheduleEvent[],
  today: string,
): CatHealthSummary {
  const series = weightSeries(records.filter(r => r.catId === cat.id))
  const latest = series[series.length - 1]
  const profileLbs = catWeightLbs(cat)

  /* "Last" visit means one that has happened. Vet events are often booked
     ahead, and taking the newest date regardless printed "-5 days ago". The
     next booked one is worth showing too, so it is split out rather than
     dropped. Recurring visits are expanded so an annual checkup counts on the
     date it actually falls. */
  const anchor = parseDateKey(today) ?? new Date()
  const from = new Date(anchor)
  from.setFullYear(from.getFullYear() - 10)
  const to = new Date(anchor)
  to.setFullYear(to.getFullYear() + 2)
  const vetDates = expandEvents(
    events.filter(e => e.category === 'Vet' && e.catIds.includes(cat.id)),
    from,
    to,
  )
    .map(item => item.date)
    .sort()

  // A medication event marks a Started or a Stopped moment, so the count of
  // things currently being given is starts minus stops.
  const meds = events.filter(e => e.category === 'Medication' && e.catIds.includes(cat.id))
  const started = meds.filter(e => e.medicationStatus !== 'Stopped').length
  const stopped = meds.length - started

  return {
    catId: cat.id,
    weight: latest
      ? { lbs: latest.value, date: latest.date, source: 'reading' }
      : profileLbs !== undefined
        ? { lbs: profileLbs, source: 'profile' }
        : undefined,
    readingCount: series.length,
    trend: weightTrend(series),
    lastVet: vetDates.filter(d => d <= today).pop(),
    nextVet: vetDates.find(d => d > today),
    vetName: cat.vet?.name || undefined,
    illnesses: cat.knownIllnesses ?? [],
    activeMeds: Math.max(0, started - stopped),
  }
}
