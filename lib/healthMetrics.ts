import { Cat } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { CatalogProduct } from '@/types/item'
import { ScheduleCategory, ScheduleEvent } from '@/types/scheduleEvent'
import { SeriesPoint, weightSeries } from '@/lib/healthAnalysis'
import { expandEvents } from '@/lib/scheduleUtils'
import { FOOD_CHART_UNITS, FoodChartUnit, convertServing } from '@/lib/foodConversion'

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
  /**
   * The schedule category this is read from, for planned metrics.
   *
   * Lets an empty metric point at where its data would come from, so a chip with
   * nothing behind it can offer to go and add some instead of being a dead end.
   */
  sourceCategory?: ScheduleCategory
  /**
   * Charted until the owner says otherwise. Food comes in three units and
   * only one of them needs to be up by default; the rest are a toggle away.
   */
  defaultOn?: boolean
  /** Points for one cat, oldest first. */
  seriesFor(catId: string): SeriesPoint[]
  /**
   * Why this cat is left off the chart, when some of its data could not be
   * put in the chart's unit — a cat fed by the can on the cups chart, or on a
   * product with no label facts. Undefined when everything charted.
   */
  omittedReason?(catId: string): string | undefined
}

export interface MetricContext {
  cats: Cat[]
  records: HealthRecord[]
  events: ScheduleEvent[]
  /** The catalog, for the label facts that turn a serving into grams or calories. */
  products?: CatalogProduct[]
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
 * Food is emitted in three units — grams, cups and calories a day — and every
 * cat is converted into each from the serving as written, using the product's
 * label facts (see lib/foodConversion). A cat whose servings cannot be put in
 * a unit honestly is left off that chart and named, rather than guessed at.
 */
export function buildMetrics(ctx: MetricContext): MetricDef[] {
  const { records, events, from, to } = ctx
  const agenda = expandEvents(events, from, to)
  const metrics: MetricDef[] = []
  const productById = new Map((ctx.products ?? []).map(p => [p.id, p]))

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
    sourceCategory: 'Play',
    seriesFor: playFor,
  })

  const feedings = agenda.filter(a => a.event.category === 'Feeding')
  /* With nothing fed yet there is no unit to name, but the metric still has to
     appear so the owner can see that food is something the app charts. It shows
     empty and disabled until a feeding event gives it something to convert. */
  const anythingFed = feedings.some(a => (a.event.feedingAmounts ?? []).length > 0)
  if (!anythingFed) {
    metrics.push({
      id: 'food',
      label: 'Food',
      unit: 'per day',
      kind: 'planned',
      note: 'How much is meant to be served. Nothing records how much was eaten.',
      sourceCategory: 'Feeding',
      seriesFor: () => [],
    })
  }
  /** Every serving for a cat, converted to the unit, or the first reason one could not be. */
  const servings = (catId: string, unit: FoodChartUnit) => {
    const points: { date: string; value: number }[] = []
    let reason: string | undefined
    for (const a of feedings) {
      for (const f of a.event.feedingAmounts ?? []) {
        if (f.catId !== catId) continue
        // An amount that is not a positive number is a damaged record, not a
        // serving of nothing; it is skipped rather than charted as NaN.
        if (!Number.isFinite(f.amount) || f.amount <= 0) continue
        const converted = convertServing(f.amount, f.unit, f.productId ? productById.get(f.productId) : undefined, unit)
        if (converted.ok) points.push({ date: a.date, value: converted.value * Math.max(1, a.event.times.length) })
        else reason ??= converted.reason
      }
    }
    return { points, reason }
  }
  for (const { unit, label } of anythingFed ? FOOD_CHART_UNITS : []) {
    metrics.push({
      id: `food-${unit}`,
      label: 'Food',
      unit: label,
      kind: 'planned',
      note:
        unit === 'kcal'
          ? 'Calories meant to be served, from each product\u2019s label. Nothing records how much was eaten.'
          : 'How much is meant to be served, converted from each meal as written. Nothing records how much was eaten.',
      sourceCategory: 'Feeding',
      // Grams is the one unit every serving can reach with a label, so it is
      // the chart that is up by default; cups and calories are a toggle away.
      defaultOn: unit === 'g',
      /* A cat with any serving the unit cannot honestly reach is left off the
         chart entirely, not charted on the servings that happened to convert:
         half a diet is a wrong total, not a partial one. */
      seriesFor: catId => {
        const { points, reason } = servings(catId, unit)
        return reason ? [] : perDay(points, `food-${unit}-${catId}`)
      },
      omittedReason: catId => servings(catId, unit).reason,
    })
  }

  metrics.push({
    id: 'vet',
    label: 'Vet visits',
    unit: 'per month',
    kind: 'planned',
    note: 'Counted from the schedule, so it includes visits still to come.',
    sourceCategory: 'Vet',
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
    sourceCategory: 'Grooming',
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
