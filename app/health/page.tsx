'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import CatAvatar from '@/components/CatAvatar'
import WeightChart from '@/components/WeightChart'
import WeightComparisonChart, { lineColor } from '@/components/WeightComparisonChart'
import WeightLogForm from '@/components/WeightLogForm'
import Reveal from '@/components/motion/Reveal'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loadCats } from '@/store/catsSlice'
import { loadScheduleEvents } from '@/store/scheduleSlice'
import { loadHealthRecords, persistHealthRecord, removeHealthRecord } from '@/store/healthSlice'
import { selectCatsByNewest, selectHealthRecords, selectScheduleEvents } from '@/store/selectors'
import { weightSeries, weightTrend } from '@/lib/healthAnalysis'
import { catWeightLbs } from '@/lib/utils'
import { HealthRecord } from '@/types/healthRecord'

const CARD = 'bg-white rounded-3xl shadow-soft border border-brand-tan/30 p-6'

function daysAgoLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const then = new Date(y, m - 1, d)
  const today = new Date()
  const days = Math.round((today.setHours(0, 0, 0, 0) - then.setHours(0, 0, 0, 0)) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.round(days / 30)} months ago`
  return `${Math.floor(days / 365)}y ago`
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

  useEffect(() => {
    dispatch(loadCats())
    dispatch(loadScheduleEvents())
    dispatch(loadHealthRecords())
  }, [dispatch])

  const selected = picked ?? new Set(cats.length ? [cats[0].id] : [])
  const selectedCats = cats.filter(c => selected.has(c.id))
  const comparing = selectedCats.length > 1
  /** The one cat in focus, when exactly one is picked. */
  const cat = selectedCats.length === 1 ? selectedCats[0] : undefined

  function toggle(id: string) {
    const next = new Set(selected)
    // Never let the selection empty out — a chart of nothing is not a view.
    if (next.has(id) && next.size > 1) next.delete(id)
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

  const catRecords = useMemo(() => (cat ? allRecords.filter(r => r.catId === cat.id) : []), [allRecords, cat])
  const series = useMemo(() => weightSeries(catRecords), [catRecords])
  const trend = useMemo(() => weightTrend(series), [series])

  const editingRecord = allRecords.find(r => r.id === editingId)
  /** The cat the edited record belongs to — in compare mode that is not
      necessarily the focused cat, since any line's point can be clicked. */
  const editingCat = editingRecord ? cats.find(c => c.id === editingRecord.catId) : undefined
  const formCat = editingCat ?? cat

  const lastVet = useMemo(() => {
    if (!cat) return undefined
    return events
      .filter(e => e.category === 'Vet' && e.catIds.includes(cat.id))
      .map(e => e.date)
      .sort()
      .reverse()[0]
  }, [events, cat])

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

  if (cats.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-7xl mb-6 select-none">🩺</div>
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
        {cat && (
          <button
            onClick={() => setLogging(true)}
            className="px-4 py-2 rounded-2xl bg-brand-orange text-white text-sm font-medium hover:bg-brand-orange/90 transition-colors"
          >
            + Log weight
          </button>
        )}
      </div>

      {cats.length > 1 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
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
          <button
            onClick={() => setPicked(new Set(cats.map(c => c.id)))}
            className="px-3 py-2 rounded-2xl border border-brand-tan/50 text-sm text-brand-brown/70 hover:bg-brand-tan/15 transition-colors whitespace-nowrap"
          >
            All cats
          </button>
        </div>
      )}

      <Reveal>
        <div className={`${CARD} mb-6`}>
          <h2 className="font-display text-xl text-brand-brown mb-4">
            {comparing ? `Weight over time — ${selectedCats.length} cats` : 'Weight over time'}
          </h2>

          {comparing ? (
            anyComparisonPoints ? (
              <WeightComparisonChart series={comparisonSeries} onSelect={setEditingId} />
            ) : (
              <p className="text-center text-brand-brown/60 py-10">
                None of the selected cats have weight readings yet.
              </p>
            )
          ) : series.length > 0 ? (
            <WeightChart series={series} onSelect={setEditingId} />
          ) : (
            <div className="text-center py-10">
              <p className="text-brand-brown/60 mb-1">No weight readings yet for {cat?.name}.</p>
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
          )}
        </div>
      </Reveal>

      {/* Stats and the reading list describe one cat, so they only appear when
          one is in focus. Averaging them across a comparison would say nothing
          true about any of the cats. */}
      {cat && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Current weight"
              value={
                series.length > 0
                  ? `${series[series.length - 1].lbs.toFixed(1)} lbs`
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
              hint={lastVet ?? (cat.vet?.name ? `${cat.vet.name} on file` : 'no vet on file')}
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

          {series.length > 0 && (
            <div className={`${CARD} mt-6`}>
              <h2 className="font-display text-xl text-brand-brown mb-1">Readings</h2>
              <p className="text-sm text-brand-brown/55 mb-4">
                Newest first. Click any row — or any point on the chart — to correct it.
              </p>
              <ul className="divide-y divide-brand-tan/30">
                {[...series].reverse().map(point => (
                  <li key={point.id}>
                    <button
                      onClick={() => setEditingId(point.id)}
                      className="w-full flex items-baseline justify-between gap-4 py-2.5 text-left hover:bg-brand-tan/10 rounded-xl px-2 -mx-2 transition-colors"
                    >
                      <span className="font-medium text-brand-brown">{point.lbs.toFixed(1)} lbs</span>
                      <span className="text-sm text-brand-brown/55 flex-1 truncate">
                        {catRecords.find(r => r.id === point.id)?.notes ?? ''}
                      </span>
                      <span className="text-sm text-brand-brown/70 whitespace-nowrap">{point.date}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {(logging || editingRecord) && formCat && (
        <WeightLogForm
          cat={formCat}
          record={editingRecord}
          existingDates={allRecords.filter(r => r.catId === formCat.id).map(r => r.date)}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
