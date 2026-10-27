'use client'

import { Suspense, useState, useSyncExternalStore } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
import { buildMonthGrid, formatDateLabel, CATEGORY_EMOJI } from '@/lib/scheduleUtils'
import { todayKey } from '@/lib/dateKeys'
import CatAvatar from '@/components/CatAvatar'
import ScheduleCalendar from '@/components/ScheduleCalendar'
import ScheduleList from '@/components/ScheduleList'
import ScheduleEventRow from '@/components/ScheduleEventRow'
import SegmentedControl from '@/components/SegmentedControl'
import ScheduleEventForm from '@/components/ScheduleEventForm'
import WeightLogForm from '@/components/WeightLogForm'
import Reveal from '@/components/motion/Reveal'

/* Matches the health page's filter chips, so the two read the same way. */
const PICK_BTN =
  'px-2.5 py-1.5 rounded-xl border border-brand-tan/50 text-xs font-medium text-brand-brown/70 hover:bg-brand-tan/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

const CHIP = (on: boolean) =>
  `flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs sm:text-sm whitespace-nowrap transition-colors ${
    on
      ? 'border-brand-orange bg-brand-orange/10 text-brand-brown'
      : 'border-brand-tan/50 text-brand-brown/60 hover:bg-brand-tan/15'
  }`

type ScheduleView = 'calendar' | 'list'

const VIEW_OPTIONS: { value: ScheduleView; label: string }[] = [
  { value: 'calendar', label: 'Calendar' },
  { value: 'list', label: 'List' },
]

/* useSearchParams has to sit under a Suspense boundary, or Next gives up on
   prerendering the route. The page renders nothing until the store has loaded
   anyway, so an empty fallback costs nothing. */
export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <SchedulePageContent />
    </Suspense>
  )
}

const noSubscribe = () => () => {}

/**
 * False while React hydrates server HTML, true from then on. A Suspense
 * boundary hydrates after the rest of the page, by which time StoreProvider's
 * effect has already loaded the store — so without this the first client
 * render shows the schedule where the server sent nothing, and React throws
 * the tree away as a hydration mismatch. The server snapshot is what hydration
 * reads, so it matches; the switch to true needs no effect.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false)
}

function SchedulePageContent() {
  const hydrated = useHydrated()
  const router = useRouter()
  const pathname = usePathname()
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
  const [selectedDate, setSelectedDate] = useState(() => todayKey())
  const healthRecords = useAppSelector(selectHealthRecords)
  const [loggingWeight, setLoggingWeight] = useState(false)

  /* Null means the default, which is everything on — the schedule is a record
     of the whole household, so hiding any of it has to be a deliberate act. */
  const [pickedCats, setPickedCats] = useState<Set<string> | null>(null)
  const [pickedCategories, setPickedCategories] = useState<Set<ScheduleCategory> | null>(null)

  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | 'new' | null>(null)

  /* The view lives in the URL rather than in state or storage, so a link to
     ?view=list opens the list and Back leaves the page rather than flipping
     views. The calendar stays the default: it's the view the page has always
     opened on, and the one that shows a month at a glance. */
  const view: ScheduleView = searchParams.get('view') === 'list' ? 'list' : 'calendar'
  function changeView(next: ScheduleView) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'list') params.set('view', 'list')
    else params.delete('view')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  // No redirect for a household without cats: the example household fills
  // the store then, so the schedule always has someone to show.
  if (!hydrated || !loaded) return null

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
    setSelectedDate(todayKey(today))
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
  /* An event can outlive a cat it was shared with. Those ids are skipped rather
     than shown as "Unknown cat" — the event still belongs to whoever remains,
     and if nobody does the line is simply left off. */
  const catNames = (ids: string[]) =>
    ids
      .map(id => cats.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ')

  return (
    <div className="bg-white rounded-3xl shadow-soft p-4 sm:p-6 min-h-[calc(100vh-8rem)]">
      <Reveal>
        <div className="flex items-center justify-between mb-4">
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
        <div className="mb-4 space-y-3">
          <SegmentedControl label="Schedule view" options={VIEW_OPTIONS} value={view} onChange={changeView} />
          {/* Labelled and wrapping, rather than two anonymous rows that ran off
              the side of a phone and had to be scrolled sideways to read. */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-brand-brown/45 mb-1.5">Cats</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button onClick={() => setPickedCats(new Set(cats.map(c => c.id)))} disabled={shownCats.size === cats.length} className={PICK_BTN}>All</button>
              <button onClick={() => setPickedCats(new Set())} disabled={shownCats.size === 0} className={PICK_BTN}>None</button>
              {cats.map(c => (
                <button key={c.id} onClick={() => toggleCat(c.id)} aria-pressed={shownCats.has(c.id)} className={CHIP(shownCats.has(c.id))}>
                  <CatAvatar cat={c} size={18} />
                  <span className="font-medium">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-brand-brown/45 mb-1.5">Categories</p>
            <div className="flex flex-wrap items-center gap-1.5">
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
        </div>
      </Reveal>

      {/* No Reveal around the list: it waits until a fifth of its own height is
          on screen, and a month of daily events is many screens tall, so the
          list would never fade in at all. */}
      {view === 'list' ? (
        <ScheduleList
          events={visibleEvents}
          totalEvents={events.length}
          today={todayKey()}
          catNames={catNames}
          onOpen={setEditingEvent}
        />
      ) : (
        /* Side by side when the screen is wider than it is tall, so picking a
           day doesn't mean scrolling down to see what's on it; stacked when it
           is taller, where the calendar wants the full width. Shape rather than
           a width breakpoint, because a tall monitor and a short laptop of the
           same width want opposite layouts. `md` keeps a phone turned sideways
           stacked: it is wide but has no room for two columns. */
        <div className="grid gap-6 md:landscape:grid-cols-[minmax(0,38rem)_minmax(16rem,1fr)] md:landscape:items-start">
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
            <section
              aria-labelledby="selected-day-heading"
              className="pt-6 border-t border-brand-tan/30 md:landscape:pt-0 md:landscape:border-t-0 md:landscape:border-l md:landscape:pl-6 md:landscape:sticky md:landscape:top-24"
            >
              <h2 id="selected-day-heading" className="font-display text-xl text-brand-brown mb-1">
                {formatDateLabel(selectedDate)}
              </h2>
              <p className="text-xs text-brand-brown/55 mb-3">
                {selectedItems.length === 0
                  ? 'Nothing scheduled this day.'
                  : `${selectedItems.length} ${selectedItems.length === 1 ? 'thing' : 'things'} scheduled`}
              </p>
              {selectedItems.length > 0 && (
                <ul className="space-y-2">
                  {selectedItems.map((item, i) => (
                    <li key={`${item.event.id}-${i}`}>
                      <ScheduleEventRow item={item} catNames={catNames(item.event.catIds)} onOpen={() => setEditingEvent(item.event)} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>
        </div>
      )}

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
