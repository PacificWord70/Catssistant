import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import catsReducer, {
  catDeleted,
  catSaved,
  catSelected,
  catsLoaded,
  loadCats,
  persistCat,
  removeCat,
} from '@/store/catsSlice'
import scheduleReducer, {
  loadScheduleEvents,
  persistScheduleEvent,
  removeScheduleEvent,
  scheduleEventDeleted,
  scheduleEventSaved,
} from '@/store/scheduleSlice'
import itemsReducer, {
  catalogProductSaved,
  householdItemDeleted,
  householdItemSaved,
  loadItems,
  persistHouseholdItem,
  removeHouseholdItem,
} from '@/store/itemsSlice'
import healthReducer, {
  healthRecordDeleted,
  healthRecordSaved,
  loadHealthRecords,
  persistHealthRecord,
  removeHealthRecord,
} from '@/store/healthSlice'
import { getCats, getScheduleEvents } from '@/lib/storage'
import { getCatalogProducts, getHouseholdItems } from '@/lib/itemStorage'
import { getHealthRecords } from '@/lib/healthStorage'
import { Cat } from '@/types/cat'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { CatalogProduct, HouseholdItem } from '@/types/item'
import { HealthRecord } from '@/types/healthRecord'

/**
 * A fresh store per test, built from the real reducers. Importing the app's
 * singleton from store/index.ts would carry state from one test into the next.
 */
const makeStore = () =>
  configureStore({
    reducer: { cats: catsReducer, schedule: scheduleReducer, items: itemsReducer, health: healthReducer },
  })

/** The thunks write through lib/ storage, which needs `window` to exist as well. */
beforeEach(() => {
  const store = new Map<string, string>()
  const mock = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  }
  vi.stubGlobal('localStorage', mock)
  vi.stubGlobal('window', { localStorage: mock })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const cat = (over: Partial<Cat> = {}): Cat =>
  ({ id: 'c1', name: 'Mochi', breed: [], weightUnit: 'lbs', createdAt: '2026-01-01T00:00:00.000Z', ...over }) as Cat
const event = (over: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id: 'e1',
  catIds: ['c1'],
  category: 'Feeding',
  title: 'Breakfast',
  date: '2026-06-01',
  times: [],
  recurrence: 'none',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
})
const product = (over: Partial<CatalogProduct> = {}): CatalogProduct => ({
  id: 'p1',
  name: 'Kibble',
  category: 'Food',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
})
const item = (over: Partial<HouseholdItem> = {}): HouseholdItem => ({
  id: 'i1',
  productId: 'p1',
  status: 'current',
  catIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
})
const record = (over: Partial<HealthRecord> = {}): HealthRecord => ({
  id: 'r1',
  catId: 'c1',
  date: '2026-06-01',
  weightLbs: 10,
  createdAt: '2026-06-01T00:00:00.000Z',
  ...over,
})

describe('cats reducer', () => {
  it('starts empty and not yet loaded', () => {
    expect(catsReducer(undefined, { type: '@@init' })).toEqual({ items: [], selectedCatId: null, loaded: false })
  })

  it('marks itself loaded even when there are no cats', () => {
    // Otherwise a user with no cats would see a loading state forever.
    expect(catsReducer(undefined, catsLoaded([])).loaded).toBe(true)
  })

  it('appends a new cat and replaces an existing one in place', () => {
    let s = catsReducer(undefined, catsLoaded([cat({ id: 'a' }), cat({ id: 'b' })]))
    s = catsReducer(s, catSaved(cat({ id: 'a', name: 'Renamed' })))
    s = catsReducer(s, catSaved(cat({ id: 'c' })))
    expect(s.items.map(c => [c.id, c.name])).toEqual([
      ['a', 'Renamed'],
      ['b', 'Mochi'],
      ['c', 'Mochi'],
    ])
  })

  it('does not mutate the previous state', () => {
    const before = catsReducer(undefined, catsLoaded([cat({ id: 'a' })]))
    const snapshot = JSON.parse(JSON.stringify(before))
    catsReducer(before, catSaved(cat({ id: 'a', name: 'Changed' })))
    expect(before).toEqual(snapshot)
  })

  it('clears the selection when the selected cat is deleted', () => {
    let s = catsReducer(undefined, catsLoaded([cat({ id: 'a' }), cat({ id: 'b' })]))
    s = catsReducer(s, catSelected('a'))
    s = catsReducer(s, catDeleted('a'))
    expect(s.selectedCatId).toBeNull()
    expect(s.items.map(c => c.id)).toEqual(['b'])
  })

  it('keeps the selection when a different cat is deleted', () => {
    let s = catsReducer(undefined, catsLoaded([cat({ id: 'a' }), cat({ id: 'b' })]))
    s = catsReducer(s, catSelected('a'))
    s = catsReducer(s, catDeleted('b'))
    expect(s.selectedCatId).toBe('a')
  })
})

describe('schedule, items and health reducers', () => {
  it('schedule: upserts by id and deletes', () => {
    let s = scheduleReducer(undefined, scheduleEventSaved(event({ id: 'a' })))
    s = scheduleReducer(s, scheduleEventSaved(event({ id: 'a', title: 'Dinner' })))
    s = scheduleReducer(s, scheduleEventSaved(event({ id: 'b' })))
    s = scheduleReducer(s, scheduleEventDeleted('b'))
    expect(s.items.map(e => [e.id, e.title])).toEqual([['a', 'Dinner']])
  })

  it('items: upserts items and catalogue products independently', () => {
    let s = itemsReducer(undefined, householdItemSaved(item({ id: 'x' })))
    s = itemsReducer(s, catalogProductSaved(product({ id: 'x' })))
    s = itemsReducer(s, catalogProductSaved(product({ id: 'x', name: 'Better kibble' })))
    s = itemsReducer(s, householdItemDeleted('x'))
    expect(s.items).toEqual([])
    expect(s.catalog.map(p => p.name)).toEqual(['Better kibble'])
  })

  it('health: upserts by id and deletes', () => {
    let s = healthReducer(undefined, healthRecordSaved(record({ id: 'a', weightLbs: 9 })))
    s = healthReducer(s, healthRecordSaved(record({ id: 'a', weightLbs: 9.5 })))
    s = healthReducer(s, healthRecordSaved(record({ id: 'b' })))
    s = healthReducer(s, healthRecordDeleted('a'))
    expect(s.records.map(r => r.id)).toEqual(['b'])
  })
})

describe('thunks keep storage and state in step', () => {
  it('cats: load, persist and remove', () => {
    const store = makeStore()
    store.dispatch(persistCat(cat({ id: 'a' })))
    store.dispatch(persistCat(cat({ id: 'b' })))
    store.dispatch(removeCat('a'))
    expect(store.getState().cats.items.map(c => c.id)).toEqual(['b'])
    expect(getCats().map(c => c.id)).toEqual(['b'])

    const reloaded = makeStore()
    reloaded.dispatch(loadCats())
    expect(reloaded.getState().cats).toMatchObject({ loaded: true, items: [expect.objectContaining({ id: 'b' })] })
  })

  it('cats: load applies the storage migration', () => {
    localStorage.setItem('catssistant_cats', JSON.stringify([{ ...cat(), color: 'Tabby' }]))
    const store = makeStore()
    store.dispatch(loadCats())
    expect(store.getState().cats.items[0].pattern).toBe('Tabby')
  })

  it('schedule: load, persist and remove', () => {
    const store = makeStore()
    store.dispatch(persistScheduleEvent(event({ id: 'a' })))
    store.dispatch(persistScheduleEvent(event({ id: 'b' })))
    store.dispatch(removeScheduleEvent('b'))
    expect(getScheduleEvents().map(e => e.id)).toEqual(['a'])

    const reloaded = makeStore()
    reloaded.dispatch(loadScheduleEvents())
    expect(reloaded.getState().schedule.items).toEqual(store.getState().schedule.items)
    expect(reloaded.getState().schedule.loaded).toBe(true)
  })

  it('items: saves an inline product before the item that references it', () => {
    const order: string[] = []
    const original = localStorage.setItem.bind(localStorage)
    vi.spyOn(localStorage, 'setItem').mockImplementation((k: string, v: string) => {
      order.push(k)
      original(k, v)
    })
    const store = makeStore()
    store.dispatch(persistHouseholdItem(item(), product()))
    expect(order).toEqual(['catssistant_catalog_products', 'catssistant_household_items'])
    expect(store.getState().items.catalog.map(p => p.id)).toEqual(['p1'])
    expect(store.getState().items.items.map(i => i.id)).toEqual(['i1'])
  })

  it('items: leaves the catalogue alone when no new product is given', () => {
    const store = makeStore()
    store.dispatch(persistHouseholdItem(item()))
    expect(getCatalogProducts()).toEqual([])
    expect(store.getState().items.catalog).toEqual([])
  })

  it('items: load and remove', () => {
    const store = makeStore()
    store.dispatch(persistHouseholdItem(item({ id: 'a' }), product()))
    store.dispatch(persistHouseholdItem(item({ id: 'b' })))
    store.dispatch(removeHouseholdItem('a'))
    expect(getHouseholdItems().map(i => i.id)).toEqual(['b'])

    const reloaded = makeStore()
    reloaded.dispatch(loadItems())
    expect(reloaded.getState().items).toMatchObject({
      loaded: true,
      items: [expect.objectContaining({ id: 'b' })],
      catalog: [expect.objectContaining({ id: 'p1' })],
    })
  })

  it('health: load, persist and remove', () => {
    const store = makeStore()
    store.dispatch(persistHealthRecord(record({ id: 'a' })))
    store.dispatch(persistHealthRecord(record({ id: 'b' })))
    store.dispatch(removeHealthRecord('a'))
    expect(getHealthRecords().map(r => r.id)).toEqual(['b'])

    const reloaded = makeStore()
    reloaded.dispatch(loadHealthRecords())
    expect(reloaded.getState().health.records.map(r => r.id)).toEqual(['b'])
  })
})
