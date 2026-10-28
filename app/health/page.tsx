'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import CatAvatar from '@/components/CatAvatar'
import MetricChart, { lineColor } from '@/components/MetricChart'
import WeightLogForm from '@/components/WeightLogForm'
import HealthStatCard from '@/components/HealthStatCard'
import HelpButton from '@/components/HelpButton'
import ScheduleEventForm from '@/components/ScheduleEventForm'
import Reveal from '@/components/motion/Reveal'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { persistHealthRecord, removeHealthRecord } from '@/store/healthSlice'
import { persistScheduleEvent } from '@/store/scheduleSlice'
import { ScheduleCategory, ScheduleEvent } from '@/types/scheduleEvent'
import { formatDateKey, todayKey } from '@/lib/dateKeys'
import {
  selectCatsByNewest,
  selectCatsLoaded,
  selectHealthLoaded,
  selectHealthRecords,
  selectScheduleEvents,
  selectScheduleLoaded,
} from '@/store/selectors'
import { CHART_RANGES, ChartRange, catHealthSummary, chartRangeStart } from '@/lib/healthAnalysis'
import { MARKER_KINDS, MarkerKind, chartMarkers } from '@/lib/chartMarkers'
import SegmentedControl from '@/components/SegmentedControl'
import { buildMetrics, metricsWithData } from '@/lib/healthMetrics'
import { catLifeStage, catWeightLbs } from '@/lib/utils'
import { HealthRecord } from '@/types/healthRecord'

/* All/None sit at the head of both filter rows and have to look identical, so
   the class lives in one place rather than being typed twice. */
const PICK_BTN =
  'px-2.5 py-1.5 rounded-xl border border-brand-tan/50 text-xs font-medium text-brand-brown/70 hover:bg-brand-tan/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

const CARD = 'bg-white rounded-3xl shadow-soft border border-brand-tan/30 p-6'

export default function HealthPage() {
  const dispatch = useAppDispatch()
  const cats = useAppSelector(selectCatsByNewest)
  const events = useAppSelector(selectScheduleEvents)
  const allRecords = useAppSelector(selectHealthRecords)
  /* Every slice the page reads, not just cats: records arriving a beat after
     the cats would flash "No weight readings yet" over a cat that has plenty. */
  const catsLoaded = useAppSelector(selectCatsLoaded)
  const healthLoaded = useAppSelector(selectHealthLoaded)
  const scheduleLoaded = useAppSelector(selectScheduleLoaded)

  /** Which cats are on the chart. Null until the owner picks, so the default can
      follow the cat list arriving without an effect writing state. */
  const [picked, setPicked] = useState<Set<string> | null>(null)
  const [logging, setLogging] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  /** Schedule category being added inline, so the graph is never left behind. */
  const [addingCategory, setAddingCategory] = useState<ScheduleCategory | null>(null)
  /** Which metrics are charted. Null until the owner picks, which means the default: weight, when there is any. */
  const [pickedMetrics, setPickedMetrics] = useState<Set<string> | null>(null)

  /* Every cat by default: the chart is a comparison, and starting on one of
     them hides the rest of the household behind a control the owner has to find
     first.

     Memoised because the fallback builds a new Set on every render, which would
     give the memos below a fresh dependency each time and recompute them all. */
  const selected = useMemo(() => picked ?? new Set(cats.map(c => c.id)), [picked, cats])
  // Memoised so the per-cat summaries below are not rebuilt on every render.
  const selectedCats = useMemo(() => cats.filter(c => selected.has(c.id)), [cats, selected])
  const comparing = selectedCats.length > 1
  /** The one cat in focus, when exactly one is picked. */
  const cat = selectedCats.length === 1 ? selectedCats[0] : undefined

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPicked(next)
    setEditingId(null)
  }

  /* Recurring events are expanded across a window rather than for all time.
     Two years back and one month forward covers the trends worth looking at
     without expanding a daily event since the beginning of the epoch. */
  const metrics = useMemo(() => {
    const to = new Date()
    to.setMonth(to.getMonth() + 1)
    const from = new Date()
    from.setFullYear(from.getFullYear() - 2)
    return buildMetrics({ cats, records: allRecords, events, from, to })
  }, [cats, allRecords, events])

  const selectedCatIds = useMemo(() => selectedCats.map(c => c.id), [selectedCats])
  const available = useMemo(() => metricsWithData(metrics, selectedCatIds), [metrics, selectedCatIds])
  /* Weight is the one metric every owner records here, so it is charted until
     the owner chooses otherwise. Opening on "Nothing charted yet" above a
     page of readings read as if the readings had not saved. Derived rather
     than written into state, so it follows the data arriving, and the first
     click on a metric builds on what is already shown. */
  /* A year by default: long enough to show a trend, short enough that one
     reading from three years ago doesn't flatten everything since. */
  const [range, setRange] = useState<ChartRange>('1y')
  /* Vet visits and diet changes on by default: they are what explain a turn in
     a weight line, which is the point of putting them there. */
  const [markerKinds, setMarkerKinds] = useState<Set<MarkerKind>>(() => new Set<MarkerKind>(['vet', 'diet']))
  function toggleMarker(kind: MarkerKind) {
    const next = new Set(markerKinds)
    if (next.has(kind)) next.delete(kind)
    else next.add(kind)
    setMarkerKinds(next)
  }
  const catNameMap = useMemo(() => new Map(cats.map(c => [c.id, c.name])), [cats])
  const today = todayKey()
  const rangeFrom = chartRangeStart(today, range)
  const domain = rangeFrom ? { from: rangeFrom, to: today } : undefined

  const metricChoice = pickedMetrics ?? new Set(['weight'])
  const shownMetrics = available.filter(m => metricChoice.has(m.id))

  function toggleMetric(id: string) {
    const next = new Set(metricChoice)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPickedMetrics(next)
  }

  /* Worked out per cat and apart from the cards, so the layout can change —
     a combined table is on the cards — without touching the numbers. */
  const summaries = useMemo(() => {
    const today = todayKey()
    return selectedCats.map(c => catHealthSummary(c, allRecords, events, today))
  }, [selectedCats, allRecords, events])

  /** Weight readings for every selected cat, newest first. */
  const readings = useMemo(
    () =>
      allRecords
        .filter(r => selected.has(r.catId) && typeof r.weightLbs === 'number')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allRecords, selected],
  )

  const editingRecord = allRecords.find(r => r.id === editingId)
  /** The cat the edited record belongs to — in compare mode that is not
      necessarily the focused cat, since any line's point can be clicked. */
  const editingCat = editingRecord ? cats.find(c => c.id === editingRecord.catId) : undefined
  /* In comparison mode there is no single focused cat, so a new reading starts
     on the first selected one and the form offers the rest. With nobody
     selected, "+ Log weight" still has to do something, so it offers every cat. */
  const formCats = selectedCats.length > 0 ? selectedCats : cats
  const formCat = editingCat ?? cat ?? formCats[0]

  function closeForm() {
    setLogging(false)
    setEditingId(null)
  }

  function handleSave(record: HealthRecord) {
    dispatch(persistHealthRecord(record))
    closeForm()
  }

  function handleDelete(id: string) {
    dispatch(removeHealthRecord(id))
    closeForm()
  }

  /* Saved straight into the schedule slice, so one entry lands in both places:
     the metric it was added for starts charting, and the event shows up on the
     schedule like any other. Nothing here is health-only. */
  function handleEventSave(event: ScheduleEvent) {
    dispatch(persistScheduleEvent(event))
    setAddingCategory(null)
  }

  /* Until storage has been read the store is empty, which looks exactly like a
     household with no cats. Rendering nothing for that moment avoids flashing
     the "Add a cat first" invitation at someone who has three. */
  if (!catsLoaded || !healthLoaded || !scheduleLoaded) return null

  if (cats.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-7xl mb-6 select-none" aria-hidden="true">🩺</div>
        <h1 className="font-display text-3xl text-brand-brown mb-2">Health</h1>
        <p className="text-brand-brown/60 max-w-sm mx-auto mb-8">
          Add a cat first, then you can start tracking weight and spotting trends over time.
        </p>
        <Link
          href="/cats/new"
          className="inline-block px-5 py-2.5 rounded-2xl bg-brand-orange text-white font-medium hover:bg-brand-orange/90 transition-colors"
        >
          Add a cat
        </Link>
      </div>
    )
  }

  const profileWeight = cat ? catWeightLbs(cat) : undefined

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl text-brand-brown">Health</h1>
          <HelpButton page="health" />
        </div>
        <button
          onClick={() => setLogging(true)}
          className="px-4 py-2 rounded-2xl bg-brand-orange text-white text-sm font-medium hover:bg-brand-orange/90 transition-colors"
        >
          + Log weight
        </button>
      </div>

      {cats.length > 1 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <button onClick={() => setPicked(new Set(cats.map(c => c.id)))} disabled={selected.size === cats.length} className={PICK_BTN}>
            All
          </button>
          <button onClick={() => setPicked(new Set())} disabled={selected.size === 0} className={PICK_BTN}>
            None
          </button>
          {cats.map(c => {
            const on = selected.has(c.id)
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                aria-pressed={on}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border whitespace-nowrap transition-colors ${
                  on
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-brown'
                    : 'border-brand-tan/50 text-brand-brown/60 hover:bg-brand-tan/15'
                }`}
              >
                <CatAvatar cat={c} size={24} />
                <span className="text-sm font-medium">{c.name}</span>
                {/* The colour this cat takes on the comparison chart, so the chip
                    and the line read as the same cat. */}
                {on && comparing && (
                  <span
                    className="w-3 h-1.5 rounded-full"
                    style={{ background: lineColor(selectedCats.findIndex(s => s.id === c.id)) }}
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* What to plot. Only metrics with data for the selected cats appear —
          an empty axis invites the reader to conclude the value was zero, when
          really it was never recorded. */}
      {metrics.length > 1 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setPickedMetrics(new Set(available.map(m => m.id)))}
            disabled={available.length === 0 || shownMetrics.length === available.length}
            className={PICK_BTN}
          >
            All
          </button>
          <button onClick={() => setPickedMetrics(new Set())} disabled={shownMetrics.length === 0} className={PICK_BTN}>
            None
          </button>
          {metrics.map(m => {
            const on = shownMetrics.some(x => x.id === m.id)
            /* Every metric the app can chart is listed, not just the ones with
               data. Hiding the empty ones makes the whole feature invisible on a
               fresh account and gives no way to learn what it tracks. */
            const hasData = available.some(x => x.id === m.id)
            return (
              <button
                key={m.id}
                /* An empty metric is not a dead end: it offers the way to put
                   data behind it. Weight is recorded here; everything else is
                   read from the schedule, so it hands off there with the right
                   category already chosen. */
                onClick={() => {
                  if (hasData) return toggleMetric(m.id)
                  if (m.sourceCategory) return setAddingCategory(m.sourceCategory)
                  setLogging(true)
                }}
                aria-pressed={on}
                title={
                  hasData
                    ? m.note
                    : m.sourceCategory
                      ? `Nothing scheduled yet — click to add ${m.label.toLowerCase()}. It goes on the schedule too.`
                      : `Nothing recorded yet for the selected ${selectedCats.length === 1 ? 'cat' : 'cats'}. Click to log one.`
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-sm transition-colors ${
                  !hasData
                    ? 'border-dashed border-brand-tan/60 text-brand-brown/45 hover:bg-brand-tan/15 hover:text-brand-brown/70'
                    : on
                      ? 'border-brand-orange bg-brand-orange/10 text-brand-brown'
                      : 'border-brand-tan/50 text-brand-brown/60 hover:bg-brand-tan/15'
                }`}
              >
                {m.label} <span className="text-brand-brown/45">{m.unit}</span>
                {!hasData && <span className="text-brand-brown/45">+</span>}
                {m.kind === 'planned' && (
                  <span
                    className="text-[10px] uppercase tracking-wide text-brand-brown/45"
                    title="From the schedule — what was planned, not what happened"
                  >
                    planned
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {selectedCats.length === 0 && (
        <div className={`${CARD} mb-6 text-center py-10`}>
          <p className="text-brand-brown/60">No cats selected.</p>
          <p className="text-sm text-brand-brown/45 mt-1">Pick one above to see its charts.</p>
        </div>
      )}

      {shownMetrics.length > 0 && selectedCats.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <SegmentedControl
            label="Time range"
            options={CHART_RANGES.map(({ value, label }) => ({ value, label }))}
            value={range}
            onChange={setRange}
          />
          {shownMetrics.some(m => m.id === 'weight') && (
            <div role="group" aria-labelledby="marker-toggles-label" className="flex flex-wrap items-center gap-1.5">
              <span id="marker-toggles-label" className="text-xs text-brand-brown/60 mr-1">
                Show on weight chart
              </span>
              {MARKER_KINDS.map(k => {
                const on = markerKinds.has(k.kind)
                return (
                  <button
                    key={k.kind}
                    type="button"
                    onClick={() => toggleMarker(k.kind)}
                    aria-pressed={on}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 ${
                      on
                        ? 'border-brand-orange bg-brand-orange/10 text-brand-brown'
                        : 'border-brand-tan/50 text-brand-brown/60 hover:bg-brand-tan/15'
                    }`}
                  >
                    <span aria-hidden="true">{k.emoji}</span>
                    {k.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {shownMetrics.length === 0 && available.length > 0 && (
        <div className={`${CARD} mb-6 text-center py-10`}>
          <p className="text-brand-brown/60">Nothing charted yet.</p>
          <p className="text-sm text-brand-brown/45 mt-1">Pick a category above to plot it.</p>
        </div>
      )}

      {/* A chart per metric. They cannot share a Y axis — pounds, minutes and
          cups on one scale would be meaningless — so they stack, sharing only
          the cat colours. */}
      {shownMetrics.map(m => {
        const metricSeries = selectedCats.map(c => ({ id: c.id, label: c.name, points: m.seriesFor(c.id) }))
        /* Kittens get their own weight chart. A 2 lb kitten and a 13 lb adult
           on one scale flatten every adult's change into a line, and a kitten's
           climb is a different story anyway — growth, not a trend to watch. The
           chart only appears when a selected cat is under a year old. */
        const isKitten = (id: string) => catLifeStage(selectedCats.find(c => c.id === id)?.birthday) === 'Kitten'
        const groups =
          m.id === 'weight'
            ? [
                { key: 'adults', title: undefined as string | undefined, series: metricSeries.filter(x => !isKitten(x.id)) },
                { key: 'kittens', title: 'Kittens', series: metricSeries.filter(x => isKitten(x.id)) },
              ].filter(g => g.series.length > 0)
            : [{ key: 'all', title: undefined as string | undefined, series: metricSeries }]
        const split = groups.length > 1
        const colorFor = (id: string) => lineColor(selectedCats.findIndex(c => c.id === id))
        /* A kitten's whole life is shorter than a year, so a year-wide axis
           squeezes all of it against the right edge. Its chart starts at the
           first weigh-in instead, unless the range itself starts later. */
        const kittenDomain = (series: typeof metricSeries) => {
          const first = series.flatMap(x => x.points.map(p => p.date)).sort()[0]
          return domain && first && first < domain.from ? domain : undefined
        }
        const markersFor = (series: typeof metricSeries, span: typeof domain) => {
          if (markerKinds.size === 0) return []
          const from = span?.from ?? series.flatMap(x => x.points.map(p => p.date)).sort()[0]
          if (!from) return []
          return chartMarkers(events, catNameMap, series.map(x => x.id), from, today).filter(mk => markerKinds.has(mk.kind))
        }
        const inRange = (series: typeof metricSeries) =>
          series.some(x => x.points.some(p => !domain || (p.date >= domain.from && p.date <= domain.to)))

        return groups.map(group => (
          <Reveal key={`${m.id}-${group.key}`}>
            <div className={`${CARD} mb-6`}>
              <h2 className="font-display text-xl text-brand-brown">
                {split && group.title ? `${m.label}: ${group.title}` : m.label}{' '}
                <span className="text-base text-brand-brown/50">({m.unit})</span>
              </h2>
              {split && group.key === 'kittens' ? (
                <p className="text-sm text-brand-brown/55 mb-4">
                  Cats under a year old, on their own chart so their growth doesn&apos;t flatten everyone else&apos;s line.
                </p>
              ) : m.note ? (
                <p className="text-sm text-brand-brown/55 mb-4">{m.note}</p>
              ) : (
                <div className="mb-4" />
              )}
              {inRange(group.series) ? (
                <MetricChart
                  series={group.series}
                  unit={m.unit}
                  /* Only weight points map to a stored record. Scheduled metrics
                     are aggregated per day with synthetic ids, so making them
                     clickable would open an editor for a record that is not
                     there. */
                  onSelect={m.id === 'weight' ? setEditingId : undefined}
                  domain={group.key === 'kittens' ? kittenDomain(group.series) : domain}
                  colorFor={colorFor}
                  markers={m.id === 'weight' ? markersFor(group.series, group.key === 'kittens' ? kittenDomain(group.series) : domain) : undefined}
                />
              ) : (
                <p className="text-center text-brand-brown/60 py-8">
                  {range === 'all' ? 'Nothing recorded for the selected cats.' : 'Nothing recorded in this time range.'}
                </p>
              )}
            </div>
          </Reveal>
        ))
      })}

      {/* Weight drops out of `available` when none of the selected cats have a
          reading, so this is the prompt to start it. It has to work for a whole
          household now that they are all selected by default. */}
      {selectedCats.length > 0 && !available.some(m => m.id === 'weight') && (
        <Reveal>
          <div className={`${CARD} mb-6`}>
            <h2 className="font-display text-xl text-brand-brown mb-4">Weight over time</h2>
            <div className="text-center py-10">
              <p className="text-brand-brown/60 mb-1">
                {cat ? `No weight readings yet for ${cat.name}.` : 'No weight readings yet.'}
              </p>
              <p className="text-sm text-brand-brown/45 max-w-md mx-auto mb-6">
                {profileWeight !== undefined
                  ? `The profile says ${profileWeight.toFixed(1)} lbs, but not when that was measured — so it can't go on a timeline. Log it with a date to start the chart.`
                  : 'Log a weight to start the chart. Two or more readings will show a trend.'}
              </p>
              <button
                onClick={() => setLogging(true)}
                className="px-5 py-2.5 rounded-2xl bg-brand-orange text-white font-medium hover:bg-brand-orange/90 transition-colors"
              >
                Log the first weight
              </button>
            </div>
          </div>
        </Reveal>
      )}

      {/* A card per cat, never an average across them, which would say nothing
          true about any one. Side by side so a household compares at a glance;
          one cat gets the full width and lays its stats out in a row. */}
      {selectedCats.length > 0 && (
        <div className={comparing ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : undefined}>
          {selectedCats.map((c, i) => (
            <HealthStatCard key={c.id} cat={c} summary={summaries[i]} color={lineColor(i)} wide={!comparing} />
          ))}
        </div>
      )}

      {/* Readings stay whatever the selection is; with more than one cat each
          row is tagged, in that cat's line colour, so the list and the chart
          identify the same animal the same way. */}
      {readings.length > 0 && (
        <div className={`${CARD} mt-6`}>
          <h2 className="font-display text-xl text-brand-brown mb-1">Readings</h2>
          <p className="text-sm text-brand-brown/55 mb-4">
            Newest first. Click any row — or any weight point on a chart — to correct it.
          </p>
          <ul className="divide-y divide-brand-tan/30">
            {readings.map(r => (
              <li key={r.id}>
                <button
                  onClick={() => setEditingId(r.id)}
                  className="w-full flex items-baseline gap-3 py-2.5 text-left hover:bg-brand-tan/10 rounded-xl px-2 -mx-2 transition-colors"
                >
                  {comparing && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                      style={{
                        background: `${lineColor(selectedCatIds.indexOf(r.catId))}22`,
                        color: lineColor(selectedCatIds.indexOf(r.catId)),
                      }}
                    >
                      {cats.find(c => c.id === r.catId)?.name ?? 'Unknown'}
                    </span>
                  )}
                  <span className="font-medium text-brand-brown whitespace-nowrap">
                    {(r.weightLbs ?? 0).toFixed(1)} lbs
                  </span>
                  <span className="text-sm text-brand-brown/55 flex-1 truncate">{r.notes ?? ''}</span>
                  <span className="text-sm text-brand-brown/70 whitespace-nowrap">{formatDateKey(r.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {addingCategory && (
        <ScheduleEventForm
          cats={cats}
          defaultCategory={addingCategory}
          defaultDate={todayKey()}
          /* Starts against whichever cats are on the chart, since that is who
             the owner was looking at when they asked to add this. */
          defaultCatIds={selectedCats.map(c => c.id)}
          onSave={handleEventSave}
          onCancel={() => setAddingCategory(null)}
        />
      )}

      {(logging || editingRecord) && formCat && (
        <WeightLogForm
          /* Editing is pinned to the record's own cat; a new reading can be
             filed against any of the ones currently selected. */
          cats={editingRecord ? [formCat] : formCats}
          defaultCatId={formCat.id}
          record={editingRecord}
          existingDatesFor={id => allRecords.filter(r => r.catId === id).map(r => r.date)}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
