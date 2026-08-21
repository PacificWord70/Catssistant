'use client'

import { DayCell, CATEGORY_EMOJI } from '@/lib/scheduleUtils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_DOTS = 3

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
              className={`aspect-square rounded-2xl flex flex-col items-center justify-start pt-1.5 gap-0.5 text-sm transition-colors
                ${isSelected ? 'bg-brand-orange text-white' : cell.isToday ? 'bg-brand-tan/20 text-brand-charcoal' : 'hover:bg-brand-tan/10 text-brand-charcoal'}
                ${!cell.inCurrentMonth ? 'opacity-30' : ''}`}
            >
              <span className={cell.isToday && !isSelected ? 'font-bold text-brand-orange' : ''}>{cell.dayNumber}</span>
              {/* Emoji size steps up on wider screens. At the smallest widths a day
                  cell is only about 45px across, and three emojis plus a "+N" at
                  the larger size would spill past its edge. */}
              {cell.items.length > 0 && (
                <span className="text-xs sm:text-sm leading-none tracking-tighter">
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
