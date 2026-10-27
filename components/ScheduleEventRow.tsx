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
      className="w-full flex items-center gap-3 px-3 py-2.5 bg-brand-cream border border-brand-tan/30 rounded-2xl hover:bg-brand-tan/15 hover:border-brand-tan/60 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
    >
      {/* A badge rather than a bare emoji: it keeps every row's icon the same
          size and lines the titles up, whatever the emoji's own proportions. */}
      <span
        className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-brand-tan/30 flex items-center justify-center text-xl leading-none select-none"
        aria-hidden="true"
      >
        {CATEGORY_EMOJI[event.category]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-brand-charcoal truncate">
          {/* The emoji is the category for sighted users; this says it in words. */}
          <span className="sr-only">{event.category}: </span>
          {event.title}
        </p>
        {(dateLabel || catNames) && (
          <p className="text-xs text-brand-brown/65 truncate">
            {[dateLabel, catNames].filter(Boolean).join(' · ')}
          </p>
        )}
        {note && <p className="text-xs text-brand-orange/80 mt-0.5">{note}</p>}
      </div>
      {(event.times.length > 0 || event.durationMinutes) && (
        <span className="flex-shrink-0 max-w-[40%] text-right text-xs font-medium text-brand-brown/75 bg-white border border-brand-tan/30 rounded-xl px-2.5 py-1">
          {formatTimesLabel(event.times, event.durationMinutes)}
        </span>
      )}
    </button>
  )
}
