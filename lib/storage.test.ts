import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  deleteCat,
  deleteScheduleEvent,
  getCatById,
  getCats,
  getScheduleEvents,
  saveCat,
  saveScheduleEvent,
} from '@/lib/storage'
import { Cat } from '@/types/cat'
import { ScheduleEvent } from '@/types/scheduleEvent'

const KEY = 'catssistant_cats'
const SCHEDULE_KEY = 'catssistant_schedule_events'

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

describe('migration idempotence on its own output', () => {
  it('leaves an already-migrated cat byte-for-byte unchanged', () => {
    // The test above reads the same legacy value twice, which only shows the
    // migration is deterministic. This one feeds the migrated shape back in as
    // stored data, which is what "running twice equals running once" means.
    localStorage.setItem(KEY, JSON.stringify([{ ...cat(), color: 'Tuxedo' }]))
    const once = getCats()
    localStorage.setItem(KEY, JSON.stringify(once))
    const twice = getCats()
    expect(twice).toEqual(JSON.parse(JSON.stringify(once)))
  })

  it('migrates each cat in a mixed list independently', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { ...cat({ id: 'a' }), color: 'Calico' },
        { ...cat({ id: 'b' }), color: 'Orange' },
        { ...cat({ id: 'c' }), pattern: 'Solid' },
      ]),
    )
    const [a, b, c] = getCats()
    expect([a.color, a.pattern]).toEqual([undefined, 'Calico'])
    expect([b.color, b.pattern]).toEqual(['Orange', undefined])
    expect([c.color, c.pattern]).toEqual([undefined, 'Solid'])
  })
})

describe('getCats - unusual stored values', () => {
  it('returns an empty array during server rendering, when window is absent', () => {
    localStorage.setItem(KEY, JSON.stringify([cat()]))
    delete (globalThis as unknown as { window?: unknown }).window
    expect(getCats()).toEqual([])
  })

  it.each(['null', '{}', '"text"', '42'])('returns an empty array for parseable non-array JSON %s', raw => {
    localStorage.setItem(KEY, raw)
    expect(getCats()).toEqual([])
  })

  // BUG: lib/storage.ts:53 — a corrupt value reads as [] (the safe default), so
  // the next saveCat writes [thatCat] over the top and every other cat is gone
  // for good. Reads are safe; the read-modify-write is not. Left failing until
  // the team decides how unreadable data should be preserved.
  it.fails('does not overwrite unreadable stored cats when saving a new one', () => {
    localStorage.setItem(KEY, '[{"id":"a","name":"Biscuit"},')
    saveCat(cat({ id: 'b' }))
    expect(localStorage.getItem(KEY)).toContain('Biscuit')
  })
})

describe('getCatById', () => {
  it('finds a saved cat', () => {
    saveCat(cat({ id: 'a', name: 'A' }))
    saveCat(cat({ id: 'b', name: 'B' }))
    expect(getCatById('b')?.name).toBe('B')
  })

  it('returns undefined for an unknown id', () => {
    saveCat(cat({ id: 'a' }))
    expect(getCatById('zzz')).toBeUndefined()
  })

  it('returns the migrated shape, not the raw one', () => {
    localStorage.setItem(KEY, JSON.stringify([{ ...cat({ id: 'a' }), color: 'Tabby' }]))
    expect(getCatById('a')?.pattern).toBe('Tabby')
  })
})

describe('deleteCat', () => {
  it('removes only the cat asked for', () => {
    saveCat(cat({ id: 'a' }))
    saveCat(cat({ id: 'b' }))
    deleteCat('a')
    expect(getCats().map(c => c.id)).toEqual(['b'])
  })

  it('is a no-op for an id that does not exist', () => {
    saveCat(cat({ id: 'a' }))
    deleteCat('zzz')
    expect(getCats().map(c => c.id)).toEqual(['a'])
  })
})

// ─── Schedule events ──────────────────────────────────────────────────────────

function event(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    id: 'ev-1',
    catIds: ['cat-1'],
    category: 'Feeding',
    title: 'Breakfast',
    date: '2026-06-01',
    times: ['08:00'],
    recurrence: 'daily',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('schedule events', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(getScheduleEvents()).toEqual([])
  })

  it('returns an empty array rather than throwing on corrupt JSON', () => {
    localStorage.setItem(SCHEDULE_KEY, '[{"id":')
    expect(getScheduleEvents()).toEqual([])
  })

  it('returns an empty array during server rendering', () => {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify([event()]))
    delete (globalThis as unknown as { window?: unknown }).window
    expect(getScheduleEvents()).toEqual([])
  })

  // BUG: lib/storage.ts:65 — unlike getCats, parseable non-array JSON is
  // returned as-is, so 'null' comes back as null and the next
  // saveScheduleEvent throws on `events.findIndex`.
  it.fails.each(['null', '{}'])('returns an array for parseable non-array JSON %s', raw => {
    localStorage.setItem(SCHEDULE_KEY, raw)
    expect(getScheduleEvents()).toEqual([])
  })

  it('appends new events and replaces existing ones in place', () => {
    saveScheduleEvent(event({ id: 'a', title: 'Old' }))
    saveScheduleEvent(event({ id: 'b' }))
    saveScheduleEvent(event({ id: 'a', title: 'New' }))
    const all = getScheduleEvents()
    expect(all.map(e => e.id)).toEqual(['a', 'b'])
    expect(all[0].title).toBe('New')
  })

  it('round-trips optional fields untouched', () => {
    const e = event({ recurrence: 'monthly', recurrenceEndDate: '2026-12-31', catIds: ['a', 'b'] })
    saveScheduleEvent(e)
    expect(getScheduleEvents()).toEqual([e])
  })

  it('deletes only the event asked for', () => {
    saveScheduleEvent(event({ id: 'a' }))
    saveScheduleEvent(event({ id: 'b' }))
    deleteScheduleEvent('a')
    expect(getScheduleEvents().map(e => e.id)).toEqual(['b'])
  })

  it('keeps cats and events under separate keys', () => {
    saveCat(cat())
    saveScheduleEvent(event())
    deleteCat('cat-1')
    expect(getScheduleEvents()).toHaveLength(1)
  })
})
