'use client'

import { DayCell, CATEGORY_EMOJI } from '@/lib/scheduleUtils'
import { parseDateKey } from '@/lib/dateKeys'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_DOTS = 3

/**
 * What a screen reader hears for a day. The visible cell is a bare number, a
 * tint and some emoji — none of which say which month it is, whether it is
 * today, or what is on — so the label carries all of that in words.
 */
function dayLabel(cell: DayCell): string {
  const date = parseDateKey(cell.dateKey)
  const full = date
    ? date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : cell.dateKey
  const parts = [cell.isToday ? `Today, ${full}` : full]
  const count = cell.items.length
  if (count === 0) {
    parts.push('nothing scheduled')
  } else {
    const categories = Array.from(new Set(cell.items.map(i => i.event.category)))
    parts.push(`${count} ${count === 1 ? 'event' : 'events'}: ${categories.join(', ')}`)
  }
  return parts.join(', ')
}

interface Props {
  month: Date
  cells: DayCell[]
  selectedDate: string
  onSelectDate: (dateKey: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export default function ScheduleCalendar({ month, cells, selectedDate, onSelectDate, onPrevMonth, onNextMonth, onToday }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-brand-brown">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onToday} className="px-3 py-1.5 text-xs font-medium text-brand-slate hover:bg-brand-tan/10 rounded-lg transition-colors">
            Today
          </button>
          <button type="button" onClick={onPrevMonth} aria-label="Previous month" className="px-2 py-1.5 text-brand-brown hover:bg-brand-tan/10 rounded-lg transition-colors">
            ‹
          </button>
          <button type="button" onClick={onNextMonth} aria-label="Next month" className="px-2 py-1.5 text-brand-brown hover:bg-brand-tan/10 rounded-lg transition-colors">
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-center text-xs font-semibold text-brand-brown/60 py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(cell => {
          const isSelected = cell.dateKey === selectedDate
          const categories = Array.from(new Set(cell.items.map(i => i.event.category))).slice(0, MAX_DOTS)
          const extra = cell.items.length - categories.length
          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelectDate(cell.dateKey)}
              aria-label={dayLabel(cell)}
              aria-pressed={isSelected}
              /* Height follows the viewport rather than the container's width.
               aspect-square grew the month with the screen, so a wide display
               pushed it past the fold; a plain fixed height ignores how much
               room there actually is. Clamped so six rows stay usable on a short
               laptop and do not become vast on a tall monitor. */
            className={`h-[clamp(2.25rem,5.6vh,4.25rem)] rounded-2xl flex flex-col items-center justify-start pt-1.5 gap-0.5 text-sm transition-colors
                ${
                  isSelected
                    ? 'bg-brand-orange text-white'
                    : cell.items.length > 0
                      ? // A day with something on it is tinted, which is the only
                        // signal small screens get once the emoji are hidden.
                        'bg-brand-orange/15 text-brand-charcoal hover:bg-brand-orange/25'
                      : cell.isToday
                        ? 'bg-brand-tan/20 text-brand-charcoal'
                        : 'hover:bg-brand-tan/10 text-brand-charcoal'
                }
                ${!cell.inCurrentMonth ? 'opacity-30' : ''}`}
            >
              <span aria-hidden="true" className={cell.isToday && !isSelected ? 'font-bold text-brand-orange' : ''}>{cell.dayNumber}</span>
              {/* Hidden on phones: a cell is about 45px across there, and three
                  emoji plus a "+N" cannot be read at that size — the tint says
                  "something is on" and tapping the day shows what. */}
              {cell.items.length > 0 && (
                <span aria-hidden="true" className="hidden sm:inline text-3xl leading-none tracking-tighter">
                  {categories.map(c => CATEGORY_EMOJI[c]).join('')}
                  {extra > 0 && `+${extra}`}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
