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

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-center text-[11px] font-semibold uppercase tracking-wide text-brand-brown/50 py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map(cell => {
          const isSelected = cell.dateKey === selectedDate
          const categories = Array.from(new Set(cell.items.map(i => i.event.category)))
          const shown = categories.slice(0, MAX_DOTS)
          const extra = categories.length - shown.length
          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelectDate(cell.dateKey)}
              aria-label={dayLabel(cell)}
              aria-pressed={isSelected}
              /* Square days, so a month reads as a calendar rather than a
                 spreadsheet. The width cap on the calendar (see the page) is
                 what keeps six square rows from growing past the fold on a wide
                 screen; the cell itself just stays square. */
              className={`aspect-square min-w-0 rounded-xl p-1 sm:p-1.5 flex flex-col items-stretch text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40
                ${
                  isSelected
                    ? 'bg-brand-orange text-white shadow-soft'
                    : cell.items.length > 0
                      ? 'bg-brand-orange/10 text-brand-charcoal hover:bg-brand-orange/20'
                      : cell.isToday
                        ? 'bg-brand-tan/25 text-brand-charcoal'
                        : 'bg-brand-cream hover:bg-brand-tan/15 text-brand-charcoal'
                }
                ${cell.isToday && !isSelected ? 'ring-1 ring-brand-orange/50' : ''}
                ${!cell.inCurrentMonth ? 'opacity-35' : ''}`}
            >
              <span aria-hidden="true" className={`text-xs sm:text-sm leading-none ${cell.isToday && !isSelected ? 'font-bold text-brand-orange' : 'font-medium'}`}>
                {cell.dayNumber}
              </span>
              {cell.items.length > 0 && (
                <span aria-hidden="true" className="mt-auto flex items-center justify-center gap-0.5 leading-none">
                  {/* Dots on phones, where a day is about 40px across and emoji
                      cannot be told apart; small emoji once there is room. */}
                  <span className="flex gap-0.5 sm:hidden">
                    {shown.map(c => (
                      <span key={c} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-orange'}`} />
                    ))}
                  </span>
                  <span className="hidden sm:flex items-center gap-px text-[13px] lg:text-[15px]">
                    {shown.map(c => <span key={c}>{CATEGORY_EMOJI[c]}</span>)}
                  </span>
                  {extra > 0 && <span className="hidden sm:inline text-[10px] font-semibold opacity-70">+{extra}</span>}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
