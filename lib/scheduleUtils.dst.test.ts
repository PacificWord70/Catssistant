import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildMonthGrid, expandEvents } from '@/lib/scheduleUtils'
import { Recurrence, ScheduleEvent } from '@/types/scheduleEvent'

/**
 * Calendar maths under daylight saving.
 *
 * Kept in its own file because it changes `process.env.TZ`, and Vitest isolates
 * each file in its own process — so the switch cannot leak into other suites.
 *
 * Santiago is chosen on purpose. Most zones shift at 2am, which date-only maths
 * never notices. Chile shifts at midnight, so on the spring-forward day
 * `new Date(y, m, d)` lands on 01:00 rather than 00:00, and any code that
 * compares Date objects (rather than date keys) sees that hour.
 */
let previousTz: string | undefined
beforeAll(() => {
  previousTz = process.env.TZ
  process.env.TZ = 'America/Santiago'
})
afterAll(() => {
  if (previousTz === undefined) delete process.env.TZ
  else process.env.TZ = previousTz
})

function ev(date: string, recurrence: Recurrence): ScheduleEvent {
  return {
    id: `e-${date}`,
    catIds: ['cat-1'],
    category: 'Feeding',
    title: 'Test event',
    date,
    times: ['08:00'],
    recurrence,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

const d = (key: string) => {
  const [y, m, day] = key.split('-').map(Number)
  return new Date(y, m - 1, day)
}

describe('timezone setup', () => {
  it('really is in a zone whose clocks jump at midnight', () => {
    // Guards the rest of the file: if TZ did not take, these tests prove nothing.
    expect(d('2026-09-06').getHours()).toBe(1)
  })
})

describe('expandEvents across a midnight DST jump', () => {
  it('emits every day once through spring-forward', () => {
    const items = expandEvents([ev('2026-09-04', 'daily')], d('2026-09-04'), d('2026-09-08'))
    expect(items.map(i => i.date)).toEqual([
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
      '2026-09-07',
      '2026-09-08',
    ])
  })

  it('emits every day once through fall-back', () => {
    const items = expandEvents([ev('2026-04-03', 'daily')], d('2026-04-03'), d('2026-04-06'))
    expect(items.map(i => i.date)).toEqual(['2026-04-03', '2026-04-04', '2026-04-05', '2026-04-06'])
  })

  it('keeps a weekly series on its weekday', () => {
    const items = expandEvents([ev('2026-08-30', 'weekly')], d('2026-08-30'), d('2026-09-20'))
    expect(items.map(i => i.date)).toEqual(['2026-08-30', '2026-09-06', '2026-09-13', '2026-09-20'])
  })

  it('lands a monthly series on the jump day itself', () => {
    const items = expandEvents([ev('2026-08-06', 'monthly')], d('2026-09-01'), d('2026-09-30'))
    expect(items.map(i => i.date)).toEqual(['2026-09-06'])
  })
})

describe('buildMonthGrid across a midnight DST jump', () => {
  // BUG: lib/scheduleUtils.ts:53 — the loop compares Date objects
  // (`cursor <= gridEnd`). gridEnd sits at 00:00, but after the spring-forward
  // day the cursor carries 01:00, so on the final Saturday it is an hour past
  // gridEnd and the loop stops early. September 2026 in Chile renders 34 cells
  // ending on Friday 2 October, leaving the last week one day short.
  it.fails('still covers whole weeks', () => {
    const grid = buildMonthGrid(d('2026-09-01'), [])
    expect(grid.length % 7).toBe(0)
    expect(grid[grid.length - 1].dateKey).toBe('2026-10-03')
  })

  it('is unaffected in a month without the jump', () => {
    const grid = buildMonthGrid(d('2026-06-01'), [])
    expect(grid.length % 7).toBe(0)
  })
})
