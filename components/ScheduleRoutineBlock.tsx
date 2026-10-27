'use client'

import { AgendaItem, formatTimesLabel } from '@/lib/scheduleUtils'

interface Props {
  title: string
  emoji: string
  items: AgendaItem[]
  catNames: (ids: string[]) => string
  onOpen: (item: AgendaItem) => void
}

/**
 * The day's routine — meals, play — as one compact block. These happen most
 * days and read the same each time, so full rows for them buried the things
 * that are actually different about the day.
 */
export default function ScheduleRoutineBlock({ title, emoji, items, catNames, onOpen }: Props) {
  if (items.length === 0) return null
  return (
    <section aria-label={title} className="rounded-2xl bg-brand-tan/15 border border-brand-tan/30 px-3 py-2.5 mt-3">
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-brown/60 mb-1">
        <span aria-hidden="true">{emoji}</span>
        {title}
      </h3>
      <ul className="divide-y divide-brand-tan/30">
        {items.map((item, i) => (
          <li key={`${item.event.id}-${i}`}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="w-full flex items-center gap-3 py-1.5 text-left rounded-lg hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-brand-charcoal truncate">{item.event.title}</span>
                <span className="block text-xs text-brand-brown/55 truncate">{catNames(item.event.catIds)}</span>
              </span>
              {(item.event.times.length > 0 || item.event.durationMinutes) && (
                <span className="flex-shrink-0 max-w-[45%] text-right text-xs text-brand-brown/70">
                  {formatTimesLabel(item.event.times, item.event.durationMinutes)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
