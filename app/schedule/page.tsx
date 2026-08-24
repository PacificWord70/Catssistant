'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { SCHEDULE_CATEGORIES } from '@/lib/scheduleAttributes'
import { HealthRecord } from '@/types/healthRecord'
import { buildMonthGrid, formatDateLabel, formatTimesLabel, toDateKey, CATEGORY_EMOJI, adjustedDateNote } from '@/lib/scheduleUtils'
import CatAvatar from '@/components/CatAvatar'
import ScheduleCalendar from '@/components/ScheduleCalendar'
import ScheduleEventForm from '@/components/ScheduleEventForm'
import WeightLogForm from '@/components/WeightLogForm'
import Reveal from '@/components/motion/Reveal'

/* Matches the health page's filter chips, so the two read the same way. */
const PICK_BTN =
  'px-2.5 py-1.5 rounded-xl border border-brand-tan/50 text-xs font-medium text-brand-brown/70 hover:bg-brand-tan/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

const CHIP = (on: boolean) =>
  `flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-sm whitespace-nowrap transition-colors ${
    on
      ? 'border-brand-orange bg-brand-orange/10 text-brand-brown'
      : 'border-brand-tan/50 text-brand-brown/60 hover:bg-brand-tan/15'
  }`

export default function SchedulePage() {
  const router = useRouter()
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

  /* Null means the default, which is everything on — the schedule is a record
     of the whole household, so hiding any of it has to be a deliberate act. */
  const [pickedCats, setPickedCats] = useState<Set<string> | null>(null)
  const [pickedCategories, setPickedCategories] = useState<Set<ScheduleCategory> | null>(null)

  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | 'new' | null>(null)

  useEffect(() => {
    if (loaded && cats.length === 0) router.replace('/onboarding')
  }, [loaded, cats.length, router])

  if (!loaded || cats.length === 0) return null

  function handleWeightSave(record: HealthRecord) {
    dispatch(persistHealthRecord(record))
    setLoggingWeight(false)
  }

  function handleSave(event: ScheduleEvent) {
    dispatch(persistScheduleEvent(event))
    setEditingEvent(null)
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

  const shownCats = pickedCats ?? new Set(cats.map(c => c.id))
  const shownCategories = pickedCategories ?? new Set(SCHEDULE_CATEGORIES)

  /* Filtered before the grid is built, so the calendar dots and the day list
     below it can never disagree about what is showing. Not memoised: this sits
     after an early return, where a hook would break the rules of hooks, and one
     pass over the events is far cheaper than the grid built from it anyway. */
  const visibleEvents = events.filter(
    e => shownCategories.has(e.category) && e.catIds.some(id => shownCats.has(id)),
  )

  function toggleCat(id: string) {
    const next = new Set(shownCats)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPickedCats(next)
  }

  function toggleCategory(c: ScheduleCategory) {
    const next = new Set(shownCategories)
    if (next.has(c)) next.delete(c)
    else next.add(c)
    setPickedCategories(next)
  }

  const cells = buildMonthGrid(currentMonth, visibleEvents)
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

      <Reveal delay={0.05}>
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button onClick={() => setPickedCats(new Set(cats.map(c => c.id)))} disabled={shownCats.size === cats.length} className={PICK_BTN}>All</button>
            <button onClick={() => setPickedCats(new Set())} disabled={shownCats.size === 0} className={PICK_BTN}>None</button>
            {cats.map(c => (
              <button key={c.id} onClick={() => toggleCat(c.id)} aria-pressed={shownCats.has(c.id)} className={CHIP(shownCats.has(c.id))}>
                <CatAvatar cat={c} size={20} />
                <span className="font-medium">{c.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setPickedCategories(new Set(SCHEDULE_CATEGORIES))} disabled={shownCategories.size === SCHEDULE_CATEGORIES.length} className={PICK_BTN}>All</button>
            <button onClick={() => setPickedCategories(new Set())} disabled={shownCategories.size === 0} className={PICK_BTN}>None</button>
            {SCHEDULE_CATEGORIES.map(c => (
              <button key={c} onClick={() => toggleCategory(c)} aria-pressed={shownCategories.has(c)} className={CHIP(shownCategories.has(c))}>
                <span aria-hidden="true">{CATEGORY_EMOJI[c]}</span>
                {c}
              </button>
            ))}
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
          onSave={handleSave}
          onCancel={() => setEditingEvent(null)}
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
