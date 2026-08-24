'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { persistScheduleEvent, removeScheduleEvent } from '@/store/scheduleSlice'
import { persistHealthRecord } from '@/store/healthSlice'
import {
  selectAllCats,
  selectCatsLoaded,
  selectScheduleEvents,
  selectScheduleLoaded,
  selectHealthRecords,
} from '@/store/selectors'
import { ScheduleCategory, ScheduleEvent } from '@/types/scheduleEvent'
import { HealthRecord } from '@/types/healthRecord'
import { buildMonthGrid, formatDateLabel, formatTimesLabel, toDateKey, CATEGORY_EMOJI, adjustedDateNote } from '@/lib/scheduleUtils'
import ScheduleCalendar from '@/components/ScheduleCalendar'
import ScheduleEventForm from '@/components/ScheduleEventForm'
import WeightLogForm from '@/components/WeightLogForm'
import Reveal from '@/components/motion/Reveal'

/**
 * `useSearchParams` has to sit inside a Suspense boundary, otherwise the whole
 * route opts out of static rendering at build time.
 */
export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <ScheduleView />
    </Suspense>
  )
}

function ScheduleView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const cats = useAppSelector(selectAllCats)
  const events = useAppSelector(selectScheduleEvents)
  const catsLoaded = useAppSelector(selectCatsLoaded)
  const scheduleLoaded = useAppSelector(selectScheduleLoaded)
  const loaded = catsLoaded && scheduleLoaded

  // Which month is shown and which day is picked stay local. They're view state:
  // meaningful only to this screen, and there's no reason for them to survive
  // navigating away.
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const healthRecords = useAppSelector(selectHealthRecords)
  const [loggingWeight, setLoggingWeight] = useState(false)

  /* The health page hands off here with a category when a metric has nothing
     behind it yet — /schedule?add=Play. Both are read once, at first render,
     rather than set from an effect: an effect would render the page closed and
     then reopen it, and would fight the user the moment they hit cancel. */
  const [handoff] = useState<ScheduleCategory | null>(
    () => (searchParams.get('add') as ScheduleCategory | null) ?? null,
  )
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | 'new' | null>(() =>
    searchParams.get('add') ? 'new' : null,
  )

  useEffect(() => {
    if (loaded && cats.length === 0) router.replace('/onboarding')
  }, [loaded, cats.length, router])

  if (!loaded || cats.length === 0) return null

  function closeEventForm() {
    setEditingEvent(null)
    // Drop the parameter, so a refresh does not reopen a form just dismissed.
    if (handoff) router.replace('/schedule')
  }

  function handleWeightSave(record: HealthRecord) {
    dispatch(persistHealthRecord(record))
    setLoggingWeight(false)
  }

  function handleSave(event: ScheduleEvent) {
    dispatch(persistScheduleEvent(event))
    setEditingEvent(null)
    if (handoff) router.replace('/schedule')
  }

  function handleDelete(id: string) {
    dispatch(removeScheduleEvent(id))
    setEditingEvent(null)
  }

  function shiftMonth(offset: number) {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  function goToday() {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(toDateKey(today))
  }

  const cells = buildMonthGrid(currentMonth, events)
  const selectedCell = cells.find(c => c.dateKey === selectedDate)
  const selectedItems = selectedCell?.items ?? []
  const catNames = (ids: string[]) => ids.map(id => cats.find(c => c.id === id)?.name ?? 'Unknown cat').join(', ')

  return (
    <div className="bg-white rounded-3xl shadow-soft p-7 min-h-[calc(100vh-8rem)]">
      <Reveal>
        <div className="flex items-center justify-between mb-7">
          <h1 className="font-display text-3xl text-brand-brown">Schedule</h1>
          <div className="flex items-center gap-2">
            {/* Weight belongs to the health page, but the moment you are most
                likely to have a number to hand is while logging the vet visit
                you took it at. */}
            <button
              onClick={() => setLoggingWeight(true)}
              className="hover-lift px-4 py-2 border border-brand-tan/60 text-brand-brown rounded-2xl text-sm font-semibold hover:bg-brand-tan/15 transition-colors"
            >
              + Log Weight
            </button>
            <button
              onClick={() => setEditingEvent('new')}
              className="hover-lift px-4 py-2 bg-brand-orange text-white rounded-2xl text-sm font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft"
            >
              + Add Event
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <ScheduleCalendar
          month={currentMonth}
          cells={cells}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
          onToday={goToday}
        />
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-6 pt-6 border-t border-brand-tan/30">
          <h3 className="text-sm font-semibold text-brand-slate mb-2">{formatDateLabel(selectedDate)}</h3>
          {selectedItems.length === 0 ? (
            <p className="text-brand-brown/60 text-sm py-4">Nothing scheduled this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedItems.map((item, i) => {
                const { event } = item
                const note = adjustedDateNote(item)
                return (
                  <button
                    key={`${event.id}-${i}`}
                    onClick={() => setEditingEvent(event)}
                    className="hover-lift w-full flex items-center gap-3 px-4 py-3 bg-brand-tan/10 rounded-2xl hover:bg-brand-tan/20 transition-colors text-left"
                  >
                    <span className="text-2xl select-none">{CATEGORY_EMOJI[event.category]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-charcoal truncate">{event.title}</p>
                      <p className="text-xs text-brand-brown/60">{catNames(event.catIds)}</p>
                      {note && <p className="text-xs text-brand-orange/80 mt-0.5">{note}</p>}
                    </div>
                    {(event.times.length > 0 || event.durationMinutes) && (
                      <span className="text-xs text-brand-brown/60 flex-shrink-0">{formatTimesLabel(event.times, event.durationMinutes)}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </Reveal>

      {editingEvent && (
        <ScheduleEventForm
          cats={cats}
          existing={editingEvent === 'new' ? undefined : editingEvent}
          defaultDate={selectedDate}
          defaultCategory={editingEvent === 'new' ? (handoff ?? undefined) : undefined}
          onSave={handleSave}
          onCancel={closeEventForm}
          onDelete={editingEvent !== 'new' ? () => handleDelete(editingEvent.id) : undefined}
        />
      )}

      {loggingWeight && (
        <WeightLogForm
          cats={cats}
          defaultCatId={cats[0].id}
          existingDatesFor={id => healthRecords.filter(r => r.catId === id).map(r => r.date)}
          onSave={handleWeightSave}
          onClose={() => setLoggingWeight(false)}
        />
      )}
    </div>
  )
}
