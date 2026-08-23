import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  adjustedDateNote,
  buildMonthGrid,
  expandEvents,
  formatDateLabel,
  formatDurationLabel,
  formatTimeLabel,
  formatTimesLabel,
  groupByDate,
  toDateKey,
} from '@/lib/scheduleUtils'
import { Recurrence, ScheduleEvent } from '@/types/scheduleEvent'

/** Minimal event; only the fields expansion actually reads are set. */
function ev(date: string, recurrence: Recurrence = 'none', extra: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    id: `e-${date}-${recurrence}`,
    catIds: ['cat-1'],
    category: 'Feeding',
    title: 'Test event',
    date,
    times: ['08:00'],
    recurrence,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  }
}

const d = (key: string) => {
  const [y, m, day] = key.split('-').map(Number)
  return new Date(y, m - 1, day)
}
const dates = (items: { date: string }[]) => items.map(i => i.date)

describe('toDateKey', () => {
  it('zero-pads month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('reads the local date, not UTC', () => {
    // Late evening local time is already tomorrow in UTC. The key has to follow
    // the calendar the owner is looking at.
    expect(toDateKey(new Date(2026, 5, 15, 23, 30))).toBe('2026-06-15')
  })
})

describe('expandEvents - non-recurring', () => {
  it('includes an event inside the range', () => {
    expect(dates(expandEvents([ev('2026-06-10')], d('2026-06-01'), d('2026-06-30')))).toEqual(['2026-06-10'])
  })

  it('excludes one before the range', () => {
    expect(expandEvents([ev('2026-05-10')], d('2026-06-01'), d('2026-06-30'))).toEqual([])
  })

  it('excludes one after the range', () => {
    expect(expandEvents([ev('2026-07-10')], d('2026-06-01'), d('2026-06-30'))).toEqual([])
  })

  it('includes events sitting on the range boundaries', () => {
    const items = expandEvents([ev('2026-06-01'), ev('2026-06-30')], d('2026-06-01'), d('2026-06-30'))
    expect(dates(items)).toEqual(['2026-06-01', '2026-06-30'])
  })
})

describe('expandEvents - daily and weekly', () => {
  it('expands daily across the range', () => {
    const items = expandEvents([ev('2026-06-01', 'daily')], d('2026-06-01'), d('2026-06-05'))
    expect(dates(items)).toEqual(['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05'])
  })

  it('expands weekly onto the same weekday', () => {
    const items = expandEvents([ev('2026-06-01', 'weekly')], d('2026-06-01'), d('2026-06-30'))
    expect(dates(items)).toEqual(['2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29'])
  })

  it('starts from the range, not the anchor, when the series began earlier', () => {
    const items = expandEvents([ev('2026-01-01', 'daily')], d('2026-06-10'), d('2026-06-12'))
    expect(dates(items)).toEqual(['2026-06-10', '2026-06-11', '2026-06-12'])
  })

  it('stops at recurrenceEndDate', () => {
    const items = expandEvents(
      [ev('2026-06-01', 'daily', { recurrenceEndDate: '2026-06-03' })],
      d('2026-06-01'), d('2026-06-30'),
    )
    expect(dates(items)).toEqual(['2026-06-01', '2026-06-02', '2026-06-03'])
  })

  it('produces nothing when the end date precedes the start', () => {
    // Invalid input the form used to allow. It must not emit an occurrence and
    // it must not spin.
    const items = expandEvents(
      [ev('2026-06-15', 'daily', { recurrenceEndDate: '2026-06-10' })],
      d('2026-06-01'), d('2026-06-30'),
    )
    expect(items).toEqual([])
  })
})

describe('expandEvents - monthly rollover', () => {
  it('keeps the 31st in months that have one', () => {
    const items = expandEvents([ev('2026-01-31', 'monthly')], d('2026-01-01'), d('2026-01-31'))
    expect(dates(items)).toEqual(['2026-01-31'])
  })

  it('falls back to the last day of a short month instead of overflowing', () => {
    // The bug this guards against: naive date maths turns 31 February into 3 March.
    const items = expandEvents([ev('2026-01-31', 'monthly')], d('2026-01-01'), d('2026-04-30'))
    expect(dates(items)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('records which day the occurrence was moved from', () => {
    const items = expandEvents([ev('2026-01-31', 'monthly')], d('2026-02-01'), d('2026-02-28'))
    expect(items[0].adjustedFromDay).toBe(31)
  })

  it('leaves adjustedFromDay unset when nothing moved', () => {
    const items = expandEvents([ev('2026-01-31', 'monthly')], d('2026-03-01'), d('2026-03-31'))
    expect(items[0].adjustedFromDay).toBeUndefined()
  })

  it('uses 29 February in a leap year', () => {
    const items = expandEvents([ev('2024-01-31', 'monthly')], d('2024-02-01'), d('2024-02-29'))
    expect(dates(items)).toEqual(['2024-02-29'])
  })

  it('recovers the original day after a short month', () => {
    // March has to return to the 31st rather than staying on the 28th.
    const items = expandEvents([ev('2026-01-31', 'monthly')], d('2026-03-01'), d('2026-03-31'))
    expect(dates(items)).toEqual(['2026-03-31'])
  })

  it('crosses a year boundary', () => {
    const items = expandEvents([ev('2026-11-15', 'monthly')], d('2026-12-01'), d('2027-02-28'))
    expect(dates(items)).toEqual(['2026-12-15', '2027-01-15', '2027-02-15'])
  })
})

describe('expandEvents - ordering', () => {
  it('sorts by date, then by first time', () => {
    const items = expandEvents(
      [
        ev('2026-06-10', 'none', { id: 'late', times: ['18:00'] }),
        ev('2026-06-10', 'none', { id: 'early', times: ['07:00'] }),
        ev('2026-06-09', 'none', { id: 'yesterday', times: ['23:00'] }),
      ],
      d('2026-06-01'), d('2026-06-30'),
    )
    expect(items.map(i => i.event.id)).toEqual(['yesterday', 'early', 'late'])
  })

  it('puts events with no time last within their day', () => {
    const items = expandEvents(
      [
        ev('2026-06-10', 'none', { id: 'untimed', times: [] }),
        ev('2026-06-10', 'none', { id: 'timed', times: ['09:00'] }),
      ],
      d('2026-06-01'), d('2026-06-30'),
    )
    expect(items.map(i => i.event.id)).toEqual(['timed', 'untimed'])
  })
})

describe('groupByDate', () => {
  it('collects items under their date', () => {
    const grouped = groupByDate(expandEvents([ev('2026-06-01', 'daily')], d('2026-06-01'), d('2026-06-03')))
    expect(grouped.map(g => g.date)).toEqual(['2026-06-01', '2026-06-02', '2026-06-03'])
    expect(grouped[0].items).toHaveLength(1)
  })

  it('returns nothing for no items', () => {
    expect(groupByDate([])).toEqual([])
  })
})

describe('buildMonthGrid', () => {
  it('covers whole weeks running Sunday to Saturday', () => {
    const cells = buildMonthGrid(new Date(2026, 5, 1), [])
    expect(cells.length % 7).toBe(0)
    expect(d(cells[0].dateKey).getDay()).toBe(0)
    expect(d(cells[cells.length - 1].dateKey).getDay()).toBe(6)
  })

  it('marks which days belong to the month being viewed', () => {
    const cells = buildMonthGrid(new Date(2026, 5, 1), [])
    const inMonth = cells.filter(c => c.inCurrentMonth)
    expect(inMonth).toHaveLength(30) // June
    expect(inMonth[0].dateKey).toBe('2026-06-01')
    expect(inMonth[inMonth.length - 1].dateKey).toBe('2026-06-30')
  })

  it('attaches expanded occurrences to their day', () => {
    const cells = buildMonthGrid(new Date(2026, 5, 1), [ev('2026-06-10')])
    expect(cells.find(c => c.dateKey === '2026-06-10')!.items).toHaveLength(1)
    expect(cells.find(c => c.dateKey === '2026-06-11')!.items).toEqual([])
  })

  it('adds no leading blanks when the month starts on a Sunday', () => {
    // February 2026 starts on a Sunday.
    const cells = buildMonthGrid(new Date(2026, 1, 1), [])
    expect(cells[0].dateKey).toBe('2026-02-01')
  })
})

describe('buildMonthGrid - today', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15))
  })
  afterEach(() => vi.useRealTimers())

  it('marks exactly one cell as today', () => {
    const cells = buildMonthGrid(new Date(2026, 5, 1), [])
    const todays = cells.filter(c => c.isToday)
    expect(todays).toHaveLength(1)
    expect(todays[0].dateKey).toBe('2026-06-15')
  })

  it('marks none when viewing another month', () => {
    expect(buildMonthGrid(new Date(2026, 0, 1), []).filter(c => c.isToday)).toHaveLength(0)
  })
})

describe('adjustedDateNote', () => {
  it('explains a moved occurrence', () => {
    const note = adjustedDateNote({ event: ev('2026-01-31', 'monthly'), date: '2026-02-28', adjustedFromDay: 31 })
    expect(note).toContain('Normally the 31st')
    expect(note).toContain('on the 28th instead')
  })

  it('returns null when nothing moved', () => {
    expect(adjustedDateNote({ event: ev('2026-06-10'), date: '2026-06-10' })).toBeNull()
  })

  it('picks the ordinal suffix English expects', () => {
    expect(adjustedDateNote({ event: ev('2026-01-30', 'monthly'), date: '2026-02-28', adjustedFromDay: 30 }))
      .toContain('30th')
    expect(adjustedDateNote({ event: ev('2026-01-22', 'monthly'), date: '2026-02-22', adjustedFromDay: 22 }))
      .toContain('22nd')
  })
})

describe('time and duration labels', () => {
  it('converts to 12-hour time', () => {
    expect(formatTimeLabel('08:00')).toBe('8:00 AM')
    expect(formatTimeLabel('13:05')).toBe('1:05 PM')
  })

  it('shows midnight and noon as 12 rather than 0', () => {
    expect(formatTimeLabel('00:30')).toBe('12:30 AM')
    expect(formatTimeLabel('12:00')).toBe('12:00 PM')
  })

  it('returns an empty string when there is no time', () => {
    expect(formatTimeLabel(undefined)).toBe('')
  })

  it('formats durations', () => {
    expect(formatDurationLabel(45)).toBe('45 min')
    expect(formatDurationLabel(60)).toBe('1 hr')
    expect(formatDurationLabel(90)).toBe('1 hr 30 min')
    expect(formatDurationLabel(undefined)).toBe('')
  })

  it('combines times and duration', () => {
    expect(formatTimesLabel(['08:00', '18:00'])).toBe('8:00 AM, 6:00 PM')
    expect(formatTimesLabel(['08:00'], 30)).toBe('8:00 AM (30 min)')
    expect(formatTimesLabel([], 30)).toBe('30 min')
    expect(formatTimesLabel([])).toBe('')
  })
})

describe('formatDateLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15))
  })
  afterEach(() => vi.useRealTimers())

  it('names today and tomorrow', () => {
    expect(formatDateLabel('2026-06-15')).toBe('Today')
    expect(formatDateLabel('2026-06-16')).toBe('Tomorrow')
  })

  it('falls back to a written date otherwise', () => {
    expect(formatDateLabel('2026-06-20')).toMatch(/Jun/)
  })
})
