'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import CatAvatar from '@/components/CatAvatar'
import MetricChart, { lineColor } from '@/components/MetricChart'
import WeightLogForm from '@/components/WeightLogForm'
import ScheduleEventForm from '@/components/ScheduleEventForm'
import Reveal from '@/components/motion/Reveal'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { persistHealthRecord, removeHealthRecord } from '@/store/healthSlice'
import { persistScheduleEvent } from '@/store/scheduleSlice'
import { ScheduleCategory, ScheduleEvent } from '@/types/scheduleEvent'
import { expandEvents } from '@/lib/scheduleUtils'
import { daysBetween, formatDateKey, todayKey } from '@/lib/dateKeys'
import { selectCatsByNewest, selectHealthRecords, selectScheduleEvents } from '@/store/selectors'
import { weightSeries, weightTrend } from '@/lib/healthAnalysis'
import { buildMetrics, metricsWithData } from '@/lib/healthMetrics'
import { catWeightLbs } from '@/lib/utils'
import { HealthRecord } from '@/types/healthRecord'

/* All/None sit at the head of both filter rows and have to look identical, so
   the class lives in one place rather than being typed twice. */
const PICK_BTN =
  'px-2.5 py-1.5 rounded-xl border border-brand-tan/50 text-xs font-medium text-brand-brown/70 hover:bg-brand-tan/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

const CARD = 'bg-white rounded-3xl shadow-soft border border-brand-tan/30 p-6'

function daysAgoLabel(iso: string): string {
  const days = daysBetween(iso, todayKey())
  if (days === null) return iso
  // A future date has no "ago". Callers should not pass one, but a reading
  // typed a day ahead should still say something true rather than "-1 days ago".
  if (days < 0) return daysUntilLabel(iso)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.round(days / 30)} months ago`
  return `${Math.floor(days / 365)}y ago`
}

function daysUntilLabel(iso: string): string {
  const days = daysBetween(todayKey(), iso)
  if (days === null) return iso
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 30) return `in ${days} days`
  if (days < 365) return `in ${Math.round(days / 30)} months`
  return `in ${Math.floor(days / 365)}y`
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={CARD}>
      <p className="text-xs uppercase tracking-wide text-brand-brown/50 mb-1">{label}</p>
      <p className="font-display text-2xl text-brand-brown leading-tight">{value}</p>
      {hint && <p className="text-sm text-brand-brown/55 mt-1">{hint}</p>}
    </div>
  )
}

export default function HealthPage() {
  const dispatch = useAppDispatch()
  const cats = useAppSelector(selectCatsByNewest)
  const events = useAppSelector(selectScheduleEvents)
  const allRecords = useAppSelector(selectHealthRecords)

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
  const selectedCats = cats.filter(c => selected.has(c.id))
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

  const comparisonSeries = useMemo(
    () =>
      selectedCats.map(c => ({
        id: c.id,
        label: c.name,
        points: weightSeries(allRecords.filter(r => r.catId === c.id)),
      })),
    [selectedCats, allRecords],
  )

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

  const selectedCatIds = selectedCats.map(c => c.id)
  const available = useMemo(
    () => metricsWithData(metrics, selectedCatIds),
    // selectedCatIds is rebuilt each render; join it so the memo compares by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics, selectedCatIds.join(',')],
  )
  /* Weight is the one metric every owner records here, so it is charted until
     the owner chooses otherwise. Opening on "Nothing charted yet" above a
     page of readings read as if the readings had not saved. Derived rather
     than written into state, so it follows the data arriving, and the first
     click on a metric builds on what is already shown. */
  const metricChoice = pickedMetrics ?? new Set(['weight'])
  const shownMetrics = available.filter(m => metricChoice.has(m.id))

  function toggleMetric(id: string) {
    const next = new Set(metricChoice)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPickedMetrics(next)
  }

  const catRecords = useMemo(() => (cat ? allRecords.filter(r => r.catId === cat.id) : []), [allRecords, cat])
  const series = useMemo(() => weightSeries(catRecords), [catRecords])
  const trend = useMemo(() => weightTrend(series), [series])

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

  /* "Last" visit means one that has happened. Vet events are often booked
     ahead, and taking the newest date regardless printed "-5 days ago". The
     next booked one is worth showing too, so it is split out rather than
     dropped. Recurring visits are expanded so an annual checkup counts on the
     date it actually falls. */
  const vetVisits = useMemo(() => {
    if (!cat) return { last: undefined, next: undefined }
    const from = new Date()
    from.setFullYear(from.getFullYear() - 10)
    const to = new Date()
    to.setFullYear(to.getFullYear() + 2)
    const today = todayKey()
    const dates = expandEvents(
      events.filter(e => e.category === 'Vet' && e.catIds.includes(cat.id)),
      from,
      to,
    ).map(item => item.date)
    return {
      last: dates.filter(d => d <= today).pop(),
      next: dates.find(d => d > today),
    }
  }, [events, cat])
  const lastVet = vetVisits.last
  const nextVet = vetVisits.next

  const activeMeds = useMemo(() => {
    if (!cat) return 0
    // A medication event marks a Started or a Stopped moment, so the count of
    // things currently being given is starts minus stops.
    const meds = events.filter(e => e.category === 'Medication' && e.catIds.includes(cat.id))
    const started = meds.filter(e => e.medicationStatus !== 'Stopped').length
    return Math.max(0, started - meds.filter(e => e.medicationStatus === 'Stopped').length)
  }, [events, cat])

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
  const anyComparisonPoints = comparisonSeries.some(s => s.points.length > 0)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-6 flex-wrap">
        <h1 className="font-display text-3xl text-brand-brown">Health</h1>
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
        const hasPoints = metricSeries.some(x => x.points.length > 0)
        return (
          <Reveal key={m.id}>
            <div className={`${CARD} mb-6`}>
              <h2 className="font-display text-xl text-brand-brown">
                {m.label} <span className="text-base text-brand-brown/50">({m.unit})</span>
              </h2>
              {m.note && <p className="text-sm text-brand-brown/55 mb-4">{m.note}</p>}
              {!m.note && <div className="mb-4" />}
              {hasPoints ? (
                <MetricChart
                  series={metricSeries}
                  unit={m.unit}
                  /* Only weight points map to a stored record. Scheduled metrics
                     are aggregated per day with synthetic ids, so making them
                     clickable would open an editor for a record that is not
                     there. */
                  onSelect={m.id === 'weight' ? setEditingId : undefined}
                />
              ) : (
                <p className="text-center text-brand-brown/60 py-8">Nothing recorded for the selected cats.</p>
              )}
            </div>
          </Reveal>
        )
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

      {/* With several cats up, the detailed cards below would have to average
          across them, which says nothing true about any one. A row each keeps
          the numbers per cat, which is the only honest way to show them. */}
      {comparing && (
        <div className={CARD}>
          <ul className="divide-y divide-brand-tan/30">
            {selectedCats.map((c, i) => {
              const points = weightSeries(allRecords.filter(r => r.catId === c.id))
              const t = weightTrend(points)
              return (
                <li key={c.id} className="flex items-baseline gap-3 py-2.5">
                  <span
                    className="w-4 h-1.5 rounded-full shrink-0"
                    style={{ background: lineColor(i) }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-brand-brown flex-1 truncate">{c.name}</span>
                  <span className="text-brand-brown whitespace-nowrap">
                    {points.length > 0 ? `${points[points.length - 1].value.toFixed(1)} lbs` : '—'}
                  </span>
                  <span
                    className={`text-sm whitespace-nowrap w-24 text-right ${
                      t && t.direction !== 'steady' ? 'text-brand-brown/70' : 'text-brand-brown/40'
                    }`}
                  >
                    {t
                      ? t.direction === 'steady'
                        ? 'steady'
                        : `${t.changeLbs > 0 ? '+' : ''}${t.changeLbs.toFixed(1)} lbs`
                      : points.length === 1
                        ? 'one reading'
                        : 'no readings'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {cat && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Current weight"
              value={
                series.length > 0
                  ? `${series[series.length - 1].value.toFixed(1)} lbs`
                  : profileWeight !== undefined
                    ? `${profileWeight.toFixed(1)} lbs`
                    : '—'
              }
              hint={
                series.length > 0
                  ? `logged ${daysAgoLabel(series[series.length - 1].date)}`
                  : profileWeight !== undefined
                    ? 'from the profile, undated'
                    : 'not recorded'
              }
            />
            <Stat
              label="Trend"
              value={
                trend
                  ? trend.direction === 'steady'
                    ? 'Steady'
                    : `${trend.changeLbs > 0 ? '+' : ''}${trend.changeLbs.toFixed(1)} lbs`
                  : '—'
              }
              hint={
                trend
                  ? `${trend.percent > 0 ? '+' : ''}${trend.percent.toFixed(1)}% over ${trend.days} days`
                  : 'needs two readings'
              }
            />
            <Stat
              label="Last vet visit"
              value={lastVet ? daysAgoLabel(lastVet) : '—'}
              /* Falls back to the practice on the profile. A cat can have a vet
                 on file and no visit scheduled yet, and showing only "none"
                 hides information the owner already gave us. */
              hint={[
                lastVet ? formatDateKey(lastVet) : cat.vet?.name ? `${cat.vet.name} on file` : 'no vet on file',
                nextVet && `next visit ${daysUntilLabel(nextVet)}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            />
            <Stat
              label="Known illnesses"
              value={cat.knownIllnesses?.length ? String(cat.knownIllnesses.length) : 'None'}
              hint={
                cat.knownIllnesses?.length
                  ? cat.knownIllnesses.join(', ')
                  : `${activeMeds} active medication${activeMeds === 1 ? '' : 's'}`
              }
            />
          </div>

        </>
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
