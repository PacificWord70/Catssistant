'use client'

import { useId, useState } from 'react'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { CATEGORY_EMOJI } from '@/lib/scheduleUtils'
import { formatDateKey } from '@/lib/dateKeys'
import {
  LIST_HORIZON_DAYS,
  ListRange,
  ListSort,
  formatListDayHeading,
  groupOccurrences,
  listOccurrences,
  listWindow,
} from '@/lib/scheduleList'
import ScheduleEventRow from '@/components/ScheduleEventRow'
import SegmentedControl from '@/components/SegmentedControl'

const RANGE_OPTIONS: { value: ListRange; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'custom', label: 'Custom' },
]

const SORT_OPTIONS: { value: ListSort; label: string }[] = [
  { value: 'date-asc', label: 'Date, earliest first' },
  { value: 'date-desc', label: 'Date, latest first' },
  { value: 'category', label: 'Category' },
  { value: 'cat', label: 'Cat' },
]

const FIELD =
  'w-full px-3 py-2 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white text-sm text-brand-charcoal'

interface Props {
  /** Already narrowed by the page's cat and category filters. */
  events: ScheduleEvent[]
  /** Every event before those filters, to tell "none yet" from "all hidden". */
  totalEvents: number
  today: string
  catNames: (catIds: string[]) => string
  onOpen: (event: ScheduleEvent) => void
}

/**
 * The schedule as a list of occurrences. It takes the same filtered events the
 * calendar does and adds only what a list needs on top: a span of days, a
 * text search and an order. Range, search and sort stay local — they're how the
 * owner is looking right now, not something worth linking to.
 */
export default function ScheduleList({ events, totalEvents, today, catNames, onOpen }: Props) {
  const [range, setRange] = useState<ListRange>('upcoming')
  const [days, setDays] = useState(LIST_HORIZON_DAYS)
  const [custom, setCustom] = useState<{ from?: string; to?: string }>({})
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ListSort>('date-asc')
  const ids = { from: useId(), to: useId(), search: useId(), sort: useId(), heading: useId() }

  const span = listWindow(range, today, days, custom)

  function changeRange(next: ListRange) {
    // Custom starts from whatever was showing, so it reads as "adjust this",
    // not as two blank boxes.
    if (next === 'custom' && span && !(custom.from && custom.to))
      setCustom({ from: span.from, to: span.to })
    // Looking back, the most recent day is the one you want first; looking
    // ahead, the nearest. Only the date orders flip — a chosen category or cat
    // sort is left alone.
    if (next === 'past' && sort === 'date-asc') setSort('date-desc')
    if (next === 'upcoming' && sort === 'date-desc') setSort('date-asc')
    setRange(next)
    setDays(LIST_HORIZON_DAYS)
  }

  const items = span ? listOccurrences(events, span, search, sort, catNames) : []
  const groups = groupOccurrences(items, sort, catNames)
  const shortDate = (key: string) =>
    formatDateKey(key, { month: 'short', day: 'numeric', year: 'numeric' })

  const heading =
    range === 'upcoming'
      ? `Next ${days} days`
      : range === 'past'
        ? `Last ${days} days`
        : span
          ? `${shortDate(span.from)} – ${shortDate(span.to)}`
          : 'Custom range'

  function emptyMessage(): string {
    if (totalEvents === 0) return 'No events yet. Add one with + Add Event.'
    if (events.length === 0) return 'Every event is hidden by the cat and category filters above.'
    if (!span) return 'Pick a start and an end date to see that range.'
    if (search.trim()) return `Nothing matches “${search.trim()}” in this range.`
    if (range === 'upcoming') return `Nothing scheduled in the next ${days} days.`
    if (range === 'past') return `Nothing was scheduled in the last ${days} days.`
    return 'Nothing scheduled between those dates.'
  }

  return (
    <section aria-labelledby={ids.heading}>
      <div className="space-y-3 mb-4">
        <SegmentedControl
          label="Which events"
          options={RANGE_OPTIONS}
          value={range}
          onChange={changeRange}
        />

        {range === 'custom' && (
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            <div>
              <label
                htmlFor={ids.from}
                className="block text-xs font-medium text-brand-brown/70 mb-1"
              >
                From
              </label>
              <input
                id={ids.from}
                type="date"
                value={custom.from ?? ''}
                onChange={e => setCustom(c => ({ ...c, from: e.target.value || undefined }))}
                className={FIELD}
              />
            </div>
            <div>
              <label
                htmlFor={ids.to}
                className="block text-xs font-medium text-brand-brown/70 mb-1"
              >
                To
              </label>
              <input
                id={ids.to}
                type="date"
                value={custom.to ?? ''}
                onChange={e => setCustom(c => ({ ...c, to: e.target.value || undefined }))}
                className={FIELD}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <label
              htmlFor={ids.search}
              className="block text-xs font-medium text-brand-brown/70 mb-1"
            >
              Search titles, notes and categories
            </label>
            <input
              id={ids.search}
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={FIELD}
            />
          </div>
          <div className="sm:w-56">
            <label
              htmlFor={ids.sort}
              className="block text-xs font-medium text-brand-brown/70 mb-1"
            >
              Sort by
            </label>
            <select
              id={ids.sort}
              value={sort}
              onChange={e => setSort(e.target.value as ListSort)}
              className={FIELD}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 id={ids.heading} className="font-display text-xl text-brand-brown">
          {heading}
        </h2>
        {/* Announced on change, so filtering by voice or keyboard says what it did. */}
        <p className="text-xs text-brand-brown/60" aria-live="polite">
          {items.length} {items.length === 1 ? 'occurrence' : 'occurrences'}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="text-brand-brown/60 text-sm py-4">{emptyMessage()}</p>
      ) : (
        <div className="space-y-5">
          {groups.map(group => (
            <div key={group.key}>
              <h3 className="text-sm font-semibold text-brand-slate mb-2">
                {group.kind === 'date' ? (
                  formatListDayHeading(group.key, today)
                ) : group.kind === 'category' ? (
                  <>
                    <span aria-hidden="true">{CATEGORY_EMOJI[group.items[0].event.category]} </span>
                    {group.key}
                  </>
                ) : (
                  group.key || 'No cat'
                )}
              </h3>
              <ul className="space-y-2">
                {group.items.map((item, i) => (
                  <li key={`${item.event.id}-${item.date}-${i}`}>
                    <ScheduleEventRow
                      item={item}
                      catNames={catNames(item.event.catIds)}
                      // Under a category or cat heading the row has to say its own day.
                      dateLabel={
                        group.kind === 'date' ? undefined : formatListDayHeading(item.date, today)
                      }
                      onOpen={() => onOpen(item.event)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {range !== 'custom' && span && (
        <button
          type="button"
          onClick={() => setDays(d => d + LIST_HORIZON_DAYS)}
          className="mt-5 w-full sm:w-auto px-4 py-2 border border-brand-tan/60 text-brand-brown rounded-2xl text-sm font-semibold hover:bg-brand-tan/15 transition-colors"
        >
          {range === 'upcoming'
            ? `Show ${LIST_HORIZON_DAYS} more days ahead`
            : `Show ${LIST_HORIZON_DAYS} more days back`}
        </button>
      )}
    </section>
  )
}
