import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  deleteCatalogProduct,
  deleteHouseholdItem,
  getCatalogProductById,
  getCatalogProducts,
  getHouseholdItemById,
  getHouseholdItems,
  saveCatalogProduct,
  saveHouseholdItem,
} from '@/lib/itemStorage'
import { CatalogProduct, HouseholdItem } from '@/types/item'

const CATALOG_KEY = 'catssistant_catalog_products'
const ITEMS_KEY = 'catssistant_household_items'

/**
 * Both `localStorage` and `window` are stubbed: every read is guarded by
 * `typeof window === 'undefined'` for server rendering, so without a window the
 * module would short-circuit to [] and nothing below would be exercised.
 */
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
afterEach(() => vi.unstubAllGlobals())

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

describe('catalog products', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(getCatalogProducts()).toEqual([])
  })

  it('returns an empty array rather than throwing on corrupt JSON', () => {
    localStorage.setItem(CATALOG_KEY, '{oops')
    expect(getCatalogProducts()).toEqual([])
  })

  it('returns an empty array during server rendering', () => {
    saveCatalogProduct(product())
    vi.stubGlobal('window', undefined)
    expect(getCatalogProducts()).toEqual([])
  })

  it('appends, then replaces in place by id', () => {
    saveCatalogProduct(product({ id: 'a', name: 'Old' }))
    saveCatalogProduct(product({ id: 'b' }))
    saveCatalogProduct(product({ id: 'a', name: 'New' }))
    expect(getCatalogProducts().map(p => [p.id, p.name])).toEqual([
      ['a', 'New'],
      ['b', 'Kibble'],
    ])
  })

  it('looks a product up by id', () => {
    saveCatalogProduct(product({ id: 'a' }))
    expect(getCatalogProductById('a')?.id).toBe('a')
    expect(getCatalogProductById('zzz')).toBeUndefined()
  })

  it('deletes only the product asked for', () => {
    saveCatalogProduct(product({ id: 'a' }))
    saveCatalogProduct(product({ id: 'b' }))
    deleteCatalogProduct('a')
    expect(getCatalogProducts().map(p => p.id)).toEqual(['b'])
  })

  // BUG: lib/itemStorage.ts:10 — parseable non-array JSON is returned as-is,
  // so a stored 'null' reaches saveCatalogProduct and throws on findIndex.
  it.fails('returns an array for parseable non-array JSON', () => {
    localStorage.setItem(CATALOG_KEY, 'null')
    expect(getCatalogProducts()).toEqual([])
  })
})

describe('household items', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(getHouseholdItems()).toEqual([])
  })

  it('returns an empty array rather than throwing on corrupt JSON', () => {
    localStorage.setItem(ITEMS_KEY, '[{')
    expect(getHouseholdItems()).toEqual([])
  })

  it('appends, then replaces in place by id', () => {
    saveHouseholdItem(item({ id: 'a', status: 'current' }))
    saveHouseholdItem(item({ id: 'b' }))
    saveHouseholdItem(item({ id: 'a', status: 'past', dateEnded: '2026-05-01' }))
    const all = getHouseholdItems()
    expect(all.map(i => i.id)).toEqual(['a', 'b'])
    expect(all[0]).toMatchObject({ status: 'past', dateEnded: '2026-05-01' })
  })

  it('looks an item up by id', () => {
    saveHouseholdItem(item({ id: 'a', notes: 'blue bowl' }))
    expect(getHouseholdItemById('a')?.notes).toBe('blue bowl')
    expect(getHouseholdItemById('zzz')).toBeUndefined()
  })

  it('deletes only the item asked for', () => {
    saveHouseholdItem(item({ id: 'a' }))
    saveHouseholdItem(item({ id: 'b' }))
    deleteHouseholdItem('b')
    expect(getHouseholdItems().map(i => i.id)).toEqual(['a'])
  })

  it('keeps items and the catalogue under separate keys', () => {
    // The same id in both collections must not collide.
    saveCatalogProduct(product({ id: 'x' }))
    saveHouseholdItem(item({ id: 'x' }))
    deleteHouseholdItem('x')
    expect(getCatalogProducts().map(p => p.id)).toEqual(['x'])
  })

  // BUG: lib/itemStorage.ts:40 — same non-array hole as the catalogue.
  it.fails('returns an array for parseable non-array JSON', () => {
    localStorage.setItem(ITEMS_KEY, '{}')
    expect(getHouseholdItems()).toEqual([])
  })
})
