import { describe, it, expect } from 'vitest'
import { chartMarkers } from '@/lib/chartMarkers'
import { ScheduleEvent } from '@/types/scheduleEvent'

const NAMES = new Map([
  ['a', 'Pepper'],
  ['b', 'Noodle'],
])

function ev(over: Partial<ScheduleEvent>): ScheduleEvent {
  return {
    id: `${over.category}-${over.date}-${over.title}`,
    catIds: ['a'],
    category: 'Other',
    title: 'x',
    date: '2026-01-01',
    times: [],
    recurrence: 'none',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  } as ScheduleEvent
}

describe('chartMarkers', () => {
  it('marks vet visits, expanding recurring ones inside the range', () => {
    const markers = chartMarkers(
      [ev({ category: 'Vet', title: 'Recheck', date: '2026-01-10', recurrence: 'monthly' })],
      NAMES,
      ['a'],
      '2026-02-01',
      '2026-03-31',
    )
    expect(markers.map(m => m.date)).toEqual(['2026-02-10', '2026-03-10'])
    expect(markers[0].lines).toEqual(['Pepper: Recheck'])
  })

  it('treats a later feeding start as a diet change, but not the first one', () => {
    const markers = chartMarkers(
      [
        ev({ category: 'Feeding', title: 'Dinner', date: '2025-06-01', recurrence: 'daily', recurrenceEndDate: '2026-03-31' }),
        ev({ category: 'Feeding', title: 'Diet dinner', date: '2026-04-01', recurrence: 'daily', foodName: 'Weight control' }),
      ],
      NAMES,
      ['a'],
      '2025-01-01',
      '2026-12-31',
    )
    expect(markers).toEqual([
      { date: '2026-04-01', kind: 'diet', catIds: ['a'], lines: ['Pepper: Diet dinner (Weight control)'] },
    ])
  })

  it('marks medication starts and stops, not every dose', () => {
    const markers = chartMarkers(
      [
        ev({ category: 'Medication', title: 'Antibiotic', date: '2026-02-01', recurrence: 'daily', medicationStatus: 'Started' }),
        ev({ category: 'Medication', title: 'Antibiotic', date: '2026-02-11', medicationStatus: 'Stopped' }),
      ],
      NAMES,
      ['a'],
      '2026-01-01',
      '2026-03-01',
    )
    expect(markers.map(m => [m.date, m.lines[0]])).toEqual([
      ['2026-02-01', 'Pepper: Started Antibiotic'],
      ['2026-02-11', 'Pepper: Stopped Antibiotic'],
    ])
  })

  it('only includes the cats asked about, and merges a shared visit into one marker', () => {
    const markers = chartMarkers(
      [
        ev({ category: 'Vet', title: 'Checkup', date: '2026-05-01', catIds: ['a', 'b'] }),
        ev({ category: 'Vet', title: 'Dental', date: '2026-05-01', catIds: ['b'] }),
        ev({ category: 'Vet', title: 'Other cat only', date: '2026-06-01', catIds: ['c'] }),
      ],
      NAMES,
      ['a', 'b'],
      '2026-01-01',
      '2026-12-31',
    )
    expect(markers).toHaveLength(1)
    expect(markers[0].catIds.sort()).toEqual(['a', 'b'])
    expect(markers[0].lines).toEqual(['Pepper, Noodle: Checkup', 'Noodle: Dental'])
  })

  it('drops anything outside the range', () => {
    expect(chartMarkers([ev({ category: 'Vet', date: '2024-01-01' })], NAMES, ['a'], '2026-01-01', '2026-12-31')).toEqual([])
  })

  it('does not flag a cat whose meal only carried on when a shared meal was split', () => {
    const amounts = (ids: string[], amount: number) => ids.map(catId => ({ catId, amount, unit: 'can' as const }))
    const markers = chartMarkers(
      [
        ev({ category: 'Feeding', title: 'Breakfast', date: '2025-01-01', recurrence: 'daily', catIds: ['a', 'b'],
             foodName: 'Pate', feedingAmounts: amounts(['a', 'b'], 0.5), recurrenceEndDate: '2026-03-31' }),
        // Noodle carries on as before; Pepper moves to a new food.
        ev({ category: 'Feeding', title: 'Breakfast', date: '2026-04-01', recurrence: 'daily', catIds: ['b'],
             foodName: 'Pate', feedingAmounts: amounts(['b'], 0.5) }),
        ev({ category: 'Feeding', title: 'Senior breakfast', date: '2026-04-01', recurrence: 'daily', catIds: ['a'],
             foodName: 'Senior pate', feedingAmounts: amounts(['a'], 0.5) }),
      ],
      NAMES,
      ['a', 'b'],
      '2025-01-01',
      '2026-12-31',
    )
    expect(markers).toHaveLength(1)
    expect(markers[0].catIds).toEqual(['a'])
    expect(markers[0].lines).toEqual(['Pepper: Senior breakfast (Senior pate)'])
  })
})
