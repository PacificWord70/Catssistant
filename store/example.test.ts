import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import catsReducer, { loadHousehold, persistCat, removeCat } from '@/store/catsSlice'
import exampleReducer from '@/store/exampleSlice'
import healthReducer, { persistHealthRecord, removeHealthRecord } from '@/store/healthSlice'
import itemsReducer, { persistHouseholdItem, removeHouseholdItem } from '@/store/itemsSlice'
import scheduleReducer, { persistScheduleEvent, removeScheduleEvent } from '@/store/scheduleSlice'
import { selectIsExample } from '@/store/selectors'
import { EXAMPLE_REFUSAL_MESSAGE, ExampleHouseholdError } from '@/lib/exampleHousehold'
import { readAllCollections } from '@/lib/storage'
import { buildBackup } from '@/lib/backup'
import { Cat } from '@/types/cat'
import { ScheduleEvent } from '@/types/scheduleEvent'

const makeStore = () =>
  configureStore({
    reducer: {
      cats: catsReducer,
      schedule: scheduleReducer,
      items: itemsReducer,
      health: healthReducer,
      example: exampleReducer,
    },
  })

let storage: Map<string, string>

beforeEach(() => {
  storage = new Map<string, string>()
  const mock = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
    clear: () => storage.clear(),
  }
  vi.stubGlobal('localStorage', mock)
  vi.stubGlobal('window', { localStorage: mock })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const realCat = (over: Partial<Cat> = {}): Cat => ({
  id: 'real-1',
  name: 'Tofu',
  breed: [],
  weightUnit: 'lbs',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
})

const realEvent = (over: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id: 'real-event',
  catIds: ['gone-cat'],
  category: 'Feeding',
  title: 'Breakfast',
  date: '2026-06-01',
  times: ['08:00'],
  recurrence: 'daily',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
})

function exampleStore() {
  const store = makeStore()
  store.dispatch(loadHousehold())
  return store
}

describe('the example household', () => {
  it('loads when no cats are stored, into every slice', () => {
    const store = exampleStore()
    const state = store.getState()
    expect(selectIsExample(state)).toBe(true)
    expect(state.cats.loaded).toBe(true)
    expect(state.cats.items).toHaveLength(6)
    expect(state.schedule.loaded && state.items.loaded && state.health.loaded).toBe(true)
    expect(state.schedule.items.length).toBeGreaterThan(0)
    expect(state.items.items.length).toBeGreaterThan(0)
    expect(state.items.catalog.length).toBeGreaterThan(0)
    expect(state.health.records.length).toBeGreaterThan(0)
  })

  it('is never written to storage, so a backup holds none of it', () => {
    exampleStore()
    expect(storage.size).toBe(0)
    const backup = buildBackup(readAllCollections())
    expect(JSON.stringify(backup)).not.toContain('example-')
  })

  it('hides leftover records from a household with no cats, without touching them', () => {
    storage.set('catssistant_schedule_events', JSON.stringify([realEvent()]))
    const store = exampleStore()
    expect(store.getState().schedule.items.some(e => e.id === 'real-event')).toBe(false)
    expect(JSON.parse(storage.get('catssistant_schedule_events')!)).toHaveLength(1)
  })

  it('does not load when real cats are stored', () => {
    storage.set('catssistant_cats', JSON.stringify([realCat()]))
    const store = exampleStore()
    expect(selectIsExample(store.getState())).toBe(false)
    expect(store.getState().cats.items.map(c => c.id)).toEqual(['real-1'])
  })

  it('refuses every save and delete with the nudge, leaving state and storage alone', () => {
    const store = exampleStore()
    const before = store.getState()
    const { cats, schedule, items, health } = before
    const attempts = [
      () => store.dispatch(persistCat({ ...cats.items[0], name: 'Renamed' })),
      () => store.dispatch(removeCat(cats.items[0].id)),
      () => store.dispatch(persistScheduleEvent({ ...schedule.items[0], title: 'Changed' })),
      () => store.dispatch(persistScheduleEvent({ ...schedule.items[0], id: 'brand-new' })),
      () => store.dispatch(removeScheduleEvent(schedule.items[0].id)),
      () =>
        store.dispatch(
          persistHouseholdItem({ ...items.items[0], status: 'past' }, items.catalog[0]),
        ),
      () => store.dispatch(removeHouseholdItem(items.items[0].id)),
      () => store.dispatch(persistHealthRecord({ ...health.records[0], weightLbs: 1 })),
      () => store.dispatch(removeHealthRecord(health.records[0].id)),
    ]
    for (const attempt of attempts) {
      expect(attempt).toThrow(ExampleHouseholdError)
      expect(attempt).toThrow(EXAMPLE_REFUSAL_MESSAGE)
    }
    expect(store.getState()).toEqual(before)
    expect(storage.size).toBe(0)
  })

  it('ends when a first real cat is saved, which is the only thing stored', () => {
    storage.set('catssistant_schedule_events', JSON.stringify([realEvent()]))
    const store = exampleStore()
    store.dispatch(persistCat(realCat()))

    const state = store.getState()
    expect(selectIsExample(state)).toBe(false)
    expect(state.cats.items.map(c => c.id)).toEqual(['real-1'])
    // Example data is gone from every slice; the owner's own leftovers are back.
    expect(state.schedule.items.map(e => e.id)).toEqual(['real-event'])
    expect(state.items.items).toEqual([])
    expect(state.items.catalog).toEqual([])
    expect(state.health.records).toEqual([])

    const stored = readAllCollections()
    expect(stored.cats.map(c => c.id)).toEqual(['real-1'])
    expect(JSON.stringify(stored)).not.toContain('example-')
  })

  it('lets saves through once it has ended', () => {
    const store = exampleStore()
    store.dispatch(persistCat(realCat()))
    store.dispatch(persistScheduleEvent(realEvent({ catIds: ['real-1'] })))
    expect(readAllCollections().scheduleEvents).toHaveLength(1)
  })

  it('comes back when the last real cat is deleted', () => {
    storage.set('catssistant_cats', JSON.stringify([realCat()]))
    const store = exampleStore()
    store.dispatch(removeCat('real-1'))
    expect(selectIsExample(store.getState())).toBe(true)
    expect(store.getState().cats.items).toHaveLength(6)
    expect(readAllCollections().cats).toEqual([])
  })

  it('stays while other real cats remain', () => {
    storage.set('catssistant_cats', JSON.stringify([realCat(), realCat({ id: 'real-2' })]))
    const store = exampleStore()
    store.dispatch(removeCat('real-1'))
    expect(selectIsExample(store.getState())).toBe(false)
    expect(store.getState().cats.items.map(c => c.id)).toEqual(['real-2'])
  })

  it('ends on reload after an import brings cats, and stays after one that does not', () => {
    const store = exampleStore()
    // What the backup page does after writing an import: reload the household.
    storage.set('catssistant_schedule_events', JSON.stringify([realEvent()]))
    store.dispatch(loadHousehold())
    expect(selectIsExample(store.getState())).toBe(true)

    storage.set('catssistant_cats', JSON.stringify([realCat()]))
    store.dispatch(loadHousehold())
    expect(selectIsExample(store.getState())).toBe(false)
    expect(store.getState().cats.items.map(c => c.id)).toEqual(['real-1'])
  })
})
