import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { addDaysToKey, listOccurrences, listWindow } from '@/lib/scheduleList'
import { ScheduleEvent } from '@/types/scheduleEvent'

/**
 * The list's date window under daylight saving.
 *
 * Its own file for the same reason as scheduleUtils.dst.test.ts: it changes
 * `process.env.TZ`, and Vitest gives each file its own process. Santiago
 * springs forward at midnight (6 September 2026), so that day has no 00:00 —
 * the case where stepping a Date by 24 hours lands on the wrong day.
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

describe('list window across a midnight DST change', () => {
  it('steps one day at a time through the change', () => {
    expect(addDaysToKey('2026-09-05', 1)).toBe('2026-09-06')
    expect(addDaysToKey('2026-09-06', 1)).toBe('2026-09-07')
    expect(addDaysToKey('2026-09-07', -2)).toBe('2026-09-05')
  })

  it('spans exactly the horizon in days', () => {
    expect(listWindow('upcoming', '2026-09-01', 30)).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    })
  })

  it('lists a daily event once on every day, including the short one', () => {
    const event: ScheduleEvent = {
      id: 'feed',
      catIds: ['miso'],
      category: 'Feeding',
      title: 'Breakfast',
      date: '2026-09-01',
      times: ['08:00'],
      recurrence: 'daily',
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    const items = listOccurrences([event], { from: '2026-09-04', to: '2026-09-08' }, '', 'date-asc')
    expect(items.map(i => i.date)).toEqual([
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
      '2026-09-07',
      '2026-09-08',
    ])
  })
})
