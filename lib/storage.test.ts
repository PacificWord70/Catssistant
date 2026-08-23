import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getCats, saveCat } from '@/lib/storage'
import { Cat } from '@/types/cat'

const KEY = 'catssistant_cats'

/**
 * Stands in for the browser globals the storage module needs.
 *
 * Two are required, not one. localStorage is the obvious part, but every read
 * in lib/storage.ts is guarded by `typeof window === 'undefined'` so it stays
 * safe during server rendering — under the node environment that guard is true
 * and every call would short-circuit to an empty array. So `window` has to
 * exist as well, even though nothing reads anything off it.
 */
function installLocalStorage() {
  const store = new Map<string, string>()
  const mock = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  }
  const g = globalThis as unknown as { localStorage: unknown; window: unknown }
  g.localStorage = mock
  g.window = { localStorage: mock }
  return mock
}

function cat(overrides: Partial<Cat> = {}): Cat {
  return {
    id: 'cat-1',
    name: 'Mochi',
    breed: [],
    weightUnit: 'lbs',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Cat
}

beforeEach(() => installLocalStorage())
afterEach(() => {
  const g = globalThis as unknown as { localStorage?: unknown; window?: unknown }
  delete g.localStorage
  delete g.window
})

describe('getCats', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(getCats()).toEqual([])
  })

  it('returns an empty array rather than throwing on corrupt JSON', () => {
    // A half-written value should not take the whole page down.
    localStorage.setItem(KEY, '{not json')
    expect(getCats()).toEqual([])
  })

  it('reads back what was saved', () => {
    saveCat(cat({ name: 'Mochi' }))
    expect(getCats().map(c => c.name)).toEqual(['Mochi'])
  })
})

describe('saveCat', () => {
  it('appends a new cat', () => {
    saveCat(cat({ id: 'a', name: 'A' }))
    saveCat(cat({ id: 'b', name: 'B' }))
    expect(getCats().map(c => c.id)).toEqual(['a', 'b'])
  })

  it('replaces an existing cat in place rather than duplicating it', () => {
    saveCat(cat({ id: 'a', name: 'Old' }))
    saveCat(cat({ id: 'a', name: 'New' }))
    const all = getCats()
    expect(all).toHaveLength(1)
    expect(all[0].name).toBe('New')
  })
})

describe('colour/pattern migration', () => {
  /** Writes a cat shaped the way it was before colour and pattern were split. */
  function storeLegacy(color: string) {
    localStorage.setItem(KEY, JSON.stringify([{ ...cat(), color }]))
  }

  it('moves a pattern name out of the colour field', () => {
    storeLegacy('Tabby')
    const [migrated] = getCats()
    expect(migrated.pattern).toBe('Tabby')
    expect(migrated.color).toBeUndefined()
  })

  it('leaves a real colour alone', () => {
    storeLegacy('Black')
    const [migrated] = getCats()
    expect(migrated.color).toBe('Black')
    expect(migrated.pattern).toBeUndefined()
  })

  it('does not overwrite a pattern that is already set', () => {
    localStorage.setItem(KEY, JSON.stringify([{ ...cat(), color: 'Tabby', pattern: 'Calico' }]))
    expect(getCats()[0].pattern).toBe('Calico')
  })

  it('is idempotent - running twice equals running once', () => {
    // CLAUDE.md requires this. Reads do not rewrite storage, so the same raw
    // value is migrated afresh every time and must land identically.
    storeLegacy('Tortoiseshell')
    expect(getCats()).toEqual(getCats())
  })

  it('survives a round trip back through save', () => {
    // The migrated shape is what gets persisted on the next save, and reading
    // that back must not migrate it a second time.
    storeLegacy('Colorpoint')
    const [migrated] = getCats()
    saveCat(migrated)
    expect(getCats()[0]).toEqual(migrated)
  })

  it.each(['Tabby', 'Calico', 'Tortoiseshell', 'Tuxedo', 'Colorpoint'])(
    'migrates %s',
    legacy => {
      storeLegacy(legacy)
      expect(getCats()[0].pattern).toBe(legacy)
    },
  )
})
