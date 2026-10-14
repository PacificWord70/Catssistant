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
import { StorageWriteError } from '@/lib/storageSafety'
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

  it('returns an array for parseable non-array JSON, and refuses to save over it', () => {
    localStorage.setItem(CATALOG_KEY, 'null')
    expect(getCatalogProducts()).toEqual([])
    expect(() => saveCatalogProduct(product())).toThrow(StorageWriteError)
    expect(localStorage.getItem(`${CATALOG_KEY}__unreadable`)).toBe('null')
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

  it('returns an array for parseable non-array JSON, and refuses to save over it', () => {
    localStorage.setItem(ITEMS_KEY, '{}')
    expect(getHouseholdItems()).toEqual([])
    expect(() => saveHouseholdItem(item())).toThrow(StorageWriteError)
    expect(localStorage.getItem(`${ITEMS_KEY}__unreadable`)).toBe('{}')
  })

  it('does not overwrite unreadable items when saving a new one', () => {
    const corrupt = '[{"id":"a","productId":"p1"},'
    localStorage.setItem(ITEMS_KEY, corrupt)
    expect(() => saveHouseholdItem(item({ id: 'b' }))).toThrow(StorageWriteError)
    expect(localStorage.getItem(`${ITEMS_KEY}__unreadable`)).toBe(corrupt)
  })

  it('throws a StorageWriteError when storage is full', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(() => saveHouseholdItem(item())).toThrow(StorageWriteError)
  })
})
