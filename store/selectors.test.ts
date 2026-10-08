import { describe, it, expect } from 'vitest'
import {
  selectAllCats,
  selectCatalogById,
  selectCatById,
  selectCatsByNewest,
  selectCurrentItems,
  selectEventsForCat,
  selectHealthRecordsForCat,
  selectSelectedCat,
} from '@/store/selectors'
import type { RootState } from '@/store/types'
import { Cat } from '@/types/cat'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { CatalogProduct, HouseholdItem } from '@/types/item'
import { HealthRecord } from '@/types/healthRecord'

/** Builds state directly: selectors are pure reads and need no store or reducers. */
function state(over: {
  cats?: Cat[]
  selectedCatId?: string | null
  events?: ScheduleEvent[]
  items?: HouseholdItem[]
  catalog?: CatalogProduct[]
  records?: HealthRecord[]
} = {}): RootState {
  return {
    cats: { items: over.cats ?? [], selectedCatId: over.selectedCatId ?? null, loaded: true },
    schedule: { items: over.events ?? [], loaded: true },
    items: { items: over.items ?? [], catalog: over.catalog ?? [], loaded: true },
    health: { records: over.records ?? [], loaded: true },
  }
}

const cat = (id: string, createdAt: string) => ({ id, name: id, breed: [], weightUnit: 'lbs', createdAt }) as Cat

describe('cat selectors', () => {
  const cats = [cat('old', '2025-01-01T00:00:00Z'), cat('new', '2026-03-01T00:00:00Z'), cat('mid', '2025-08-01T00:00:00Z')]

  it('finds the selected cat, or nothing when none is selected', () => {
    expect(selectSelectedCat(state({ cats, selectedCatId: 'mid' }))?.id).toBe('mid')
    expect(selectSelectedCat(state({ cats }))).toBeUndefined()
    expect(selectSelectedCat(state({ cats, selectedCatId: 'gone' }))).toBeUndefined()
  })

  it('finds a cat by id', () => {
    expect(selectCatById('new')(state({ cats }))?.id).toBe('new')
    expect(selectCatById('nope')(state({ cats }))).toBeUndefined()
  })

  it('sorts newest first without reordering the stored list', () => {
    const s = state({ cats })
    expect(selectCatsByNewest(s).map(c => c.id)).toEqual(['new', 'mid', 'old'])
    expect(selectAllCats(s).map(c => c.id)).toEqual(['old', 'new', 'mid'])
  })

  it('returns the same array reference while the cats are unchanged', () => {
    // The point of memoising: a fresh array would re-render every subscriber.
    const s = state({ cats })
    expect(selectCatsByNewest(s)).toBe(selectCatsByNewest({ ...s, schedule: { items: [], loaded: false } }))
  })
})

describe('schedule selectors', () => {
  it('keeps events that involve the cat, including shared ones', () => {
    const events = [
      { id: 'solo', catIds: ['a'] },
      { id: 'shared', catIds: ['b', 'a'] },
      { id: 'other', catIds: ['b'] },
    ] as ScheduleEvent[]
    expect(selectEventsForCat('a')(state({ events })).map(e => e.id)).toEqual(['solo', 'shared'])
  })
})

describe('item selectors', () => {
  it('indexes the catalogue by id', () => {
    const catalog = [{ id: 'p1', name: 'Kibble' }, { id: 'p2', name: 'Litter' }] as CatalogProduct[]
    const byId = selectCatalogById(state({ catalog }))
    expect(byId.get('p2')?.name).toBe('Litter')
    expect(byId.size).toBe(2)
  })

  it('keeps only items currently in use', () => {
    const items = [
      { id: 'a', status: 'current' },
      { id: 'b', status: 'past' },
      { id: 'c', status: 'current' },
    ] as HouseholdItem[]
    expect(selectCurrentItems(state({ items })).map(i => i.id)).toEqual(['a', 'c'])
  })
})

describe('health selectors', () => {
  it('filters readings to one cat', () => {
    const records = [
      { id: 'r1', catId: 'a' },
      { id: 'r2', catId: 'b' },
      { id: 'r3', catId: 'a' },
    ] as HealthRecord[]
    expect(selectHealthRecordsForCat('a')(state({ records })).map(r => r.id)).toEqual(['r1', 'r3'])
  })
})
