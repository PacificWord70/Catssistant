'use client'

import { AgendaItem, CATEGORY_EMOJI, adjustedDateNote, formatTimesLabel } from '@/lib/scheduleUtils'

interface Props {
  item: AgendaItem
  /** Names of the cats the event is for, already joined; empty leaves the line off. */
  catNames: string
  /** Shown under the title when the surrounding heading doesn't already say the day. */
  dateLabel?: string
  onOpen: () => void
}

/**
 * One occurrence of an event, as a button that opens it for editing. Shared by
 * the calendar's day list and the list view so the two read — and behave — the
 * same way.
 */
export default function ScheduleEventRow({ item, catNames, dateLabel, onOpen }: Props) {
  const { event } = item
  const note = adjustedDateNote(item)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="hover-lift w-full flex items-center gap-3 px-4 py-3 bg-brand-tan/10 rounded-2xl hover:bg-brand-tan/20 transition-colors text-left"
    >
      <span className="text-5xl select-none leading-none" aria-hidden="true">
        {CATEGORY_EMOJI[event.category]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-charcoal truncate">
          {/* The emoji is the category for sighted users; this says it in words. */}
          <span className="sr-only">{event.category}: </span>
          {event.title}
        </p>
        {dateLabel && <p className="text-xs text-brand-slate">{dateLabel}</p>}
        {catNames && <p className="text-xs text-brand-brown/60">{catNames}</p>}
        {note && <p className="text-xs text-brand-orange/80 mt-0.5">{note}</p>}
      </div>
      {(event.times.length > 0 || event.durationMinutes) && (
        <span className="text-xs text-brand-brown/60 flex-shrink-0">
          {formatTimesLabel(event.times, event.durationMinutes)}
        </span>
      )}
    </button>
  )
}
