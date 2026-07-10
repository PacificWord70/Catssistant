'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCats, getScheduleEvents, saveScheduleEvent, deleteScheduleEvent } from '@/lib/storage'
import { Cat } from '@/types/cat'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { buildMonthGrid, formatDateLabel, formatTimesLabel, toDateKey, CATEGORY_EMOJI, adjustedDateNote } from '@/lib/scheduleUtils'
import ScheduleCalendar from '@/components/ScheduleCalendar'
import ScheduleEventForm from '@/components/ScheduleEventForm'
import Reveal from '@/components/motion/Reveal'

export default function SchedulePage() {
  const router = useRouter()
  const [cats, setCats] = useState<Cat[]>([])
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loaded, setLoaded] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | 'new' | null>(null)

  useEffect(() => {
    const storedCats = getCats()
    if (storedCats.length === 0) {
      router.replace('/onboarding')
      return
    }
    setCats(storedCats)
    setEvents(getScheduleEvents())
    setLoaded(true)
  }, [router])

  if (!loaded) return null

  function handleSave(event: ScheduleEvent) {
    saveScheduleEvent(event)
    setEvents(getScheduleEvents())
    setEditingEvent(null)
  }

  function handleDelete(id: string) {
    deleteScheduleEvent(id)
    setEvents(getScheduleEvents())
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
          <button
            onClick={() => setEditingEvent('new')}
            className="px-4 py-2 bg-brand-orange text-white rounded-2xl text-sm font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft"
          >
            + Add Event
          </button>
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
                    className="w-full flex items-center gap-3 px-4 py-3 bg-brand-tan/10 rounded-2xl hover:bg-brand-tan/20 transition-colors text-left"
                  >
                    <span className="text-xl select-none">{CATEGORY_EMOJI[event.category]}</span>
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
    </div>
  )
}
