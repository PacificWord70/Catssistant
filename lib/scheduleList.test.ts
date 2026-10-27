import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  addDaysToKey,
  formatListDayHeading,
  groupOccurrences,
  listOccurrences,
  listWindow,
  matchesSearch,
  sortOccurrences,
} from '@/lib/scheduleList'
import { buildMonthGrid } from '@/lib/scheduleUtils'
import { todayKey } from '@/lib/dateKeys'
import { Recurrence, ScheduleCategory, ScheduleEvent } from '@/types/scheduleEvent'

function ev(
  id: string,
  date: string,
  recurrence: Recurrence = 'none',
  extra: Partial<ScheduleEvent> = {},
): ScheduleEvent {
  return {
    id,
    catIds: ['miso'],
    category: 'Feeding',
    title: `Event ${id}`,
    date,
    times: ['08:00'],
    recurrence,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  }
}

const NAMES: Record<string, string> = { miso: 'Miso', pepper: 'Pepper' }
const catLabel = (ids: string[]) => ids.map(id => NAMES[id]).join(', ')
const dates = (items: { date: string }[]) => items.map(i => i.date)
const ids = (items: { event: ScheduleEvent }[]) => items.map(i => i.event.id)

describe('addDaysToKey', () => {
  it('crosses month and year ends', () => {
    expect(addDaysToKey('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDaysToKey('2028-03-01', -1)).toBe('2028-02-29')
  })

  it('refuses a key that is not a real day', () => {
    expect(addDaysToKey('2026-02-30', 1)).toBeNull()
    expect(addDaysToKey('soon', 1)).toBeNull()
  })
})

describe('listWindow', () => {
  it('upcoming runs from today for the horizon, inclusive', () => {
    expect(listWindow('upcoming', '2026-10-27')).toEqual({ from: '2026-10-27', to: '2026-11-25' })
    expect(listWindow('upcoming', '2026-10-27', 60)).toEqual({
      from: '2026-10-27',
      to: '2026-12-25',
    })
  })

  it('past stops at yesterday, so today is never in both', () => {
    expect(listWindow('past', '2026-10-27')).toEqual({ from: '2026-09-27', to: '2026-10-26' })
  })

  it('custom needs both ends, and reads a reversed range the right way round', () => {
    expect(listWindow('custom', '2026-10-27', 30, { from: '2026-11-01' })).toBeNull()
    expect(
      listWindow('custom', '2026-10-27', 30, { from: '2026-11-31', to: '2026-12-05' }),
    ).toBeNull()
    expect(
      listWindow('custom', '2026-10-27', 30, { from: '2026-12-05', to: '2026-11-01' }),
    ).toEqual({
      from: '2026-11-01',
      to: '2026-12-05',
    })
  })

  describe('with the clock late in the evening', () => {
    afterEach(() => vi.useRealTimers())

    it('starts on the local day, not the UTC one', () => {
      // 23:30 local is already tomorrow in UTC anywhere west of Greenwich. The
      // window must open on the day the owner is still living in.
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 9, 31, 23, 30))
      expect(listWindow('upcoming', todayKey())?.from).toBe('2026-10-31')
    })
  })
})

describe('matchesSearch', () => {
  const e = ev('a', '2026-10-01', 'none', {
    title: 'Flea treatment',
    notes: 'Use the Revolution pipette',
  })

  it('matches title or notes, ignoring case', () => {
    expect(matchesSearch(e, 'FLEA')).toBe(true)
    expect(matchesSearch(e, 'pipette')).toBe(true)
    expect(matchesSearch(e, 'dental')).toBe(false)
  })

  it('matches the category name, so "vet" finds a checkup filed under Vet', () => {
    expect(
      matchesSearch(
        ev('c', '2026-10-01', 'none', { title: 'Annual checkup', category: 'Vet' }),
        'vet',
      ),
    ).toBe(true)
  })

  it('treats blank search as no search', () => {
    expect(matchesSearch(e, '   ')).toBe(true)
    expect(matchesSearch(ev('b', '2026-10-01'), 'x')).toBe(false) // no notes at all
  })
})

describe('listOccurrences', () => {
  it('expands a daily event across a month end', () => {
    const items = listOccurrences(
      [ev('d', '2026-10-01', 'daily')],
      { from: '2026-10-30', to: '2026-11-02' },
      '',
      'date-asc',
    )
    expect(dates(items)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'])
  })

  it('falls a monthly 31st back to the end of short months, as the calendar does', () => {
    const items = listOccurrences(
      [ev('m', '2026-01-31', 'monthly')],
      { from: '2026-01-20', to: '2026-04-10' },
      '',
      'date-asc',
    )
    expect(dates(items)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
    expect(items[1].adjustedFromDay).toBe(31)
  })

  it('keeps a weekly series on its weekday across a year end', () => {
    const items = listOccurrences(
      [ev('w', '2026-12-24', 'weekly')],
      { from: '2026-12-20', to: '2027-01-10' },
      '',
      'date-asc',
    )
    expect(dates(items)).toEqual(['2026-12-24', '2026-12-31', '2027-01-07'])
  })

  it('respects a series end date', () => {
    const items = listOccurrences(
      [ev('d', '2026-10-01', 'daily', { recurrenceEndDate: '2026-10-03' })],
      { from: '2026-10-01', to: '2026-10-31' },
      '',
      'date-asc',
    )
    expect(dates(items)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03'])
  })

  it('filters by search before expanding', () => {
    const events = [
      ev('a', '2026-10-01', 'daily', { title: 'Breakfast' }),
      ev('b', '2026-10-02', 'none', { title: 'Vet visit' }),
    ]
    const items = listOccurrences(
      events,
      { from: '2026-10-01', to: '2026-10-03' },
      'vet',
      'date-asc',
    )
    expect(ids(items)).toEqual(['b'])
  })

  it('shows the same occurrences as the calendar for the same days', () => {
    const events = [
      ev('d', '2026-01-15', 'daily'),
      ev('w', '2026-01-20', 'weekly'),
      ev('m', '2026-01-31', 'monthly'),
      ev('o', '2026-02-14'),
    ]
    // February 2026 starts on a Sunday and ends on a Saturday, so its grid is
    // exactly the month and no padding days muddy the comparison.
    const fromCalendar = buildMonthGrid(new Date(2026, 1, 1), events).flatMap(c => c.items)
    const fromList = listOccurrences(
      events,
      { from: '2026-02-01', to: '2026-02-28' },
      '',
      'date-asc',
    )
    expect(fromList.map(i => `${i.date}:${i.event.id}`)).toEqual(
      fromCalendar.map(i => `${i.date}:${i.event.id}`),
    )
  })

  it('returns nothing for a window that is not made of real days', () => {
    expect(
      listOccurrences([ev('a', '2026-10-01')], { from: '2026-10-01', to: 'later' }, '', 'date-asc'),
    ).toEqual([])
  })
})

describe('sortOccurrences', () => {
  const items = [
    { event: ev('late', '2026-10-01', 'none', { times: ['18:00'] }), date: '2026-10-01' },
    { event: ev('early', '2026-10-01', 'none', { times: ['07:00'] }), date: '2026-10-01' },
    { event: ev('next', '2026-10-02'), date: '2026-10-02' },
  ]

  it('latest-first reverses days but keeps each day morning to night', () => {
    expect(ids(sortOccurrences(items, 'date-desc'))).toEqual(['next', 'early', 'late'])
  })

  it('by category follows the category order, then date', () => {
    const cat = (id: string, category: ScheduleCategory, date: string) => ({
      event: ev(id, date, 'none', { category }),
      date,
    })
    const mixed = [
      cat('play', 'Play', '2026-10-01'),
      cat('vet', 'Vet', '2026-10-03'),
      cat('feed', 'Feeding', '2026-10-02'),
    ]
    expect(ids(sortOccurrences(mixed, 'category'))).toEqual(['feed', 'vet', 'play'])
  })

  it('by cat sorts on the cats named, then date', () => {
    const forCats = (id: string, catIds: string[], date: string) => ({
      event: ev(id, date, 'none', { catIds }),
      date,
    })
    const mixed = [
      forCats('p', ['pepper'], '2026-10-01'),
      forCats('both', ['miso', 'pepper'], '2026-10-01'),
      forCats('m', ['miso'], '2026-10-05'),
    ]
    expect(ids(sortOccurrences(mixed, 'cat', catLabel))).toEqual(['m', 'both', 'p'])
  })

  it('does not reorder the array it was given', () => {
    const copy = [...items]
    sortOccurrences(items, 'date-desc')
    expect(items).toEqual(copy)
  })
})

describe('groupOccurrences', () => {
  it('groups by day when sorted by date', () => {
    const items = listOccurrences(
      [ev('d', '2026-10-01', 'daily'), ev('o', '2026-10-02')],
      { from: '2026-10-01', to: '2026-10-02' },
      '',
      'date-asc',
    )
    const groups = groupOccurrences(items, 'date-asc')
    expect(groups.map(g => [g.kind, g.key, g.items.length])).toEqual([
      ['date', '2026-10-01', 1],
      ['date', '2026-10-02', 2],
    ])
  })

  it('puts a shared event under both cats together, once', () => {
    const items = sortOccurrences(
      [
        {
          event: ev('both', '2026-10-01', 'none', { catIds: ['miso', 'pepper'] }),
          date: '2026-10-01',
        },
        { event: ev('m', '2026-10-02'), date: '2026-10-02' },
      ],
      'cat',
      catLabel,
    )
    const groups = groupOccurrences(items, 'cat', catLabel)
    expect(groups.map(g => [g.key, ids(g.items)])).toEqual([
      ['Miso', ['m']],
      ['Miso, Pepper', ['both']],
    ])
  })
})

describe('formatListDayHeading', () => {
  it('names the days either side of today in words', () => {
    expect(formatListDayHeading('2026-10-27', '2026-10-27')).toBe('Today')
    expect(formatListDayHeading('2026-10-28', '2026-10-27')).toBe('Tomorrow')
    expect(formatListDayHeading('2026-10-26', '2026-10-27')).toBe('Yesterday')
  })

  it('says Tomorrow across a month end', () => {
    expect(formatListDayHeading('2026-11-01', '2026-10-31')).toBe('Tomorrow')
  })

  it('adds the year only when it differs', () => {
    expect(formatListDayHeading('2026-11-05', '2026-10-27')).not.toMatch(/2026/)
    expect(formatListDayHeading('2027-01-05', '2026-10-27')).toMatch(/2027/)
  })
})
