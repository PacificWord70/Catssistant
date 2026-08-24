'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import CatAvatar from '@/components/CatAvatar'
import WeightChart from '@/components/WeightChart'
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

  const [chosenId, setChosenId] = useState<string | null>(null)
  const [logging, setLogging] = useState(false)
  /** Id of the reading being edited, or null when logging a new one. */
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(loadCats())
    dispatch(loadScheduleEvents())
    dispatch(loadHealthRecords())
  }, [dispatch])

  /* Derived rather than synced. Defaulting the selection inside an effect means
     a render with nothing selected followed by a second render once it is —
     and an effect that writes state the render could have computed. Falling
     back at read time picks the first cat immediately, and still never fights a
     choice the owner has made. */
  const cat = cats.find(c => c.id === chosenId) ?? cats[0]

  const series = useMemo(
    () => (cat ? weightSeries(allRecords.filter(r => r.catId === cat.id)) : []),
    [allRecords, cat],
  )
  const trend = useMemo(() => weightTrend(series), [series])

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

  const catRecords = useMemo(
    () => (cat ? allRecords.filter(r => r.catId === cat.id) : []),
    [allRecords, cat],
  )
  const editingRecord = catRecords.find(r => r.id === editingId)

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

      {/* Cat switcher. Hidden for a single-cat household, where a picker of one
          is just clutter. */}
      {cats.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {cats.map(c => (
            <button
              key={c.id}
              onClick={() => setChosenId(c.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl border whitespace-nowrap transition-colors ${
                c.id === cat?.id
                  ? 'border-brand-orange bg-brand-orange/10 text-brand-brown'
                  : 'border-brand-tan/50 text-brand-brown/70 hover:bg-brand-tan/15'
              }`}
            >
              <CatAvatar cat={c} size={24} />
              <span className="text-sm font-medium">{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {cat && (
        <>
          <Reveal>
            <div className={`${CARD} mb-6`}>
              <h2 className="font-display text-xl text-brand-brown mb-4">Weight over time</h2>

              {series.length > 0 ? (
                <WeightChart series={series} onSelect={setEditingId} />
              ) : (
                <div className="text-center py-10">
                  <p className="text-brand-brown/60 mb-1">No weight readings yet for {cat.name}.</p>
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

      {(logging || editingRecord) && cat && (
        <WeightLogForm
          cat={cat}
          record={editingRecord}
          existingDates={catRecords.map(r => r.date)}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
