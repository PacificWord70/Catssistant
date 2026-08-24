import { Cat } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { SeriesPoint, weightSeries } from '@/lib/healthAnalysis'
import { expandEvents } from '@/lib/scheduleUtils'

/**
 * What the health page is able to chart, derived from what the app actually
 * records.
 *
 * There are two kinds, and conflating them would be dishonest:
 *
 * - **measured** — the owner wrote this number down. Weight is the only one so
 *   far, and it is the only kind that says what really happened.
 * - **planned** — taken from the schedule, which stores intentions. A daily
 *   feeding event means the owner *meant* to serve that much, not that the cat
 *   ate it. `ScheduleEvent` has no completion field, so no "actual" figure for
 *   feeding, play, medication or grooming exists anywhere in the app.
 *
 * Every metric carries its own unit, because they cannot share a Y axis — lbs,
 * minutes and cups on one scale would be meaningless. The page stacks a chart
 * per metric instead.
 */

export type MetricKind = 'measured' | 'planned'

export interface MetricDef {
  id: string
  label: string
  unit: string
  kind: MetricKind
  /** Shown under the chart title, to say what the numbers actually are. */
  note?: string
  /** Points for one cat, oldest first. */
  seriesFor(catId: string): SeriesPoint[]
}

export interface MetricContext {
  cats: Cat[]
  records: HealthRecord[]
  events: ScheduleEvent[]
  /** Window to expand recurring events across. */
  from: Date
  to: Date
}

/** Sums values per date and returns them oldest first. */
function perDay(entries: { date: string; value: number }[], idPrefix: string): SeriesPoint[] {
  const totals = new Map<string, number>()
  for (const e of entries) totals.set(e.date, (totals.get(e.date) ?? 0) + e.value)
  return [...totals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ id: `${idPrefix}-${date}`, date, value }))
}

/**
 * Builds the metric list for the data at hand.
 *
 * Metrics with no data for any selected cat are left out rather than shown
 * empty — an axis with nothing on it invites the reader to conclude the value
 * was zero, when really it was never recorded.
 *
 * Food is emitted as one metric *per unit*. Cups and grams cannot be added
 * together, and picking one to convert into would need food densities the app
 * does not have.
 */
export function buildMetrics(ctx: MetricContext): MetricDef[] {
  const { records, events, from, to } = ctx
  const agenda = expandEvents(events, from, to)
  const metrics: MetricDef[] = []

  metrics.push({
    id: 'weight',
    label: 'Weight',
    unit: 'lbs',
    kind: 'measured',
    seriesFor: catId => weightSeries(records.filter(r => r.catId === catId)),
  })

  const playFor = (catId: string) =>
    perDay(
      agenda
        .filter(a => a.event.category === 'Play' && a.event.catIds.includes(catId))
        // Times are the occurrences within the day, so a session counts once per
        // scheduled time. An event with no times still means one session.
        .map(a => ({
          date: a.date,
          value: (a.event.durationMinutes ?? 0) * Math.max(1, a.event.times.length),
        })),
      `play-${catId}`,
    )
  metrics.push({
    id: 'play',
    label: 'Play',
    unit: 'min/day',
    kind: 'planned',
    note: 'Scheduled play, not time actually spent — the app has no record of what happened.',
    seriesFor: playFor,
  })

  const foodUnits = new Set(
    agenda
      .filter(a => a.event.category === 'Feeding')
      .flatMap(a => (a.event.feedingAmounts ?? []).map(f => f.unit)),
  )
  /* With nothing fed yet there is no unit to name, but the metric still has to
     appear so the owner can see that food is something the app charts. It shows
     empty and disabled until a feeding event gives it a real unit. */
  if (foodUnits.size === 0) {
    metrics.push({
      id: 'food',
      label: 'Food',
      unit: 'per day',
      kind: 'planned',
      note: 'How much is meant to be served. Nothing records how much was eaten.',
      seriesFor: () => [],
    })
  }
  for (const unit of foodUnits) {
    metrics.push({
      id: `food-${unit}`,
      label: 'Food',
      unit: `${unit}/day`,
      kind: 'planned',
      note: 'How much is meant to be served. Nothing records how much was eaten.',
      seriesFor: catId =>
        perDay(
          agenda
            .filter(a => a.event.category === 'Feeding')
            .flatMap(a =>
              (a.event.feedingAmounts ?? [])
                .filter(f => f.catId === catId && f.unit === unit)
                .map(f => ({ date: a.date, value: f.amount * Math.max(1, a.event.times.length) })),
            ),
          `food-${unit}-${catId}`,
        ),
    })
  }

  metrics.push({
    id: 'vet',
    label: 'Vet visits',
    unit: 'per month',
    kind: 'planned',
    note: 'Counted from the schedule, so it includes visits still to come.',
    seriesFor: catId =>
      perDay(
        agenda
          .filter(a => a.event.category === 'Vet' && a.event.catIds.includes(catId))
          // Bucketed to the first of the month: single visits scattered across a
          // year make a line that is mostly gaps.
          .map(a => ({ date: `${a.date.slice(0, 7)}-01`, value: 1 })),
        `vet-${catId}`,
      ),
  })

  metrics.push({
    id: 'grooming',
    label: 'Grooming',
    unit: 'per month',
    kind: 'planned',
    seriesFor: catId =>
      perDay(
        agenda
          .filter(a => a.event.category === 'Grooming' && a.event.catIds.includes(catId))
          .map(a => ({ date: `${a.date.slice(0, 7)}-01`, value: 1 })),
        `groom-${catId}`,
      ),
  })

  return metrics
}

/** Metrics that have at least one point for at least one of the given cats. */
export function metricsWithData(metrics: MetricDef[], catIds: string[]): MetricDef[] {
  return metrics.filter(m => catIds.some(id => m.seriesFor(id).length > 0))
}
