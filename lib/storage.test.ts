import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  deleteCat,
  deleteScheduleEvent,
  getCatById,
  getCats,
  getScheduleEvents,
  PartialWriteError,
  readAllCollections,
  saveCat,
  saveScheduleEvent,
  writeAllCollections,
} from '@/lib/storage'
import { getHealthRecords, saveHealthRecord } from '@/lib/healthStorage'
import { StorageWriteError } from '@/lib/storageSafety'
import { Cat } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { ScheduleEvent } from '@/types/scheduleEvent'

const KEY = 'catssistant_cats'
const SCHEDULE_KEY = 'catssistant_schedule_events'
const BACKUP = `${KEY}__unreadable`

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
    const saved = saveCat(migrated)
    expect(getCats()[0]).toEqual(saved)
    expect(saved).toEqual({ ...migrated, updatedAt: expect.any(String) })
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

  it('does not overwrite unreadable stored cats when saving a new one', () => {
    // A corrupt value reads as [] so the page can render, but saving must not
    // treat that [] as the truth and write [newCat] over everything.
    const corrupt = '[{"id":"a","name":"Biscuit"},'
    localStorage.setItem(KEY, corrupt)
    expect(() => saveCat(cat({ id: 'b' }))).toThrow(StorageWriteError)
    expect(localStorage.getItem(BACKUP)).toBe(corrupt)
  })

  it.each(['null', '{}', '42'])('refuses to save over parseable non-array JSON %s', raw => {
    localStorage.setItem(KEY, raw)
    expect(() => saveCat(cat())).toThrow(StorageWriteError)
    expect(localStorage.getItem(BACKUP)).toBe(raw)
  })
})

/** Makes every setItem fail the way a full browser does, until the returned function is called. */
function fillStorage(error: unknown = new DOMException('full', 'QuotaExceededError')) {
  const realSet = localStorage.setItem
  localStorage.setItem = () => {
    throw error
  }
  return () => {
    localStorage.setItem = realSet
  }
}

/** Runs `fn` and returns what it threw, so the error's fields can be checked. */
function thrownBy(fn: () => void): StorageWriteError {
  try {
    fn()
  } catch (e) {
    expect(e).toBeInstanceOf(StorageWriteError)
    return e as StorageWriteError
  }
  throw new Error('expected a StorageWriteError')
}

describe('unreadable data', () => {
  const corrupt = '[{"id":"a","name":"Biscuit"},'

  it('backs the raw value up on read, leaving the live key alone', () => {
    localStorage.setItem(KEY, corrupt)
    expect(getCats()).toEqual([])
    expect(localStorage.getItem(BACKUP)).toBe(corrupt)
    expect(localStorage.getItem(KEY)).toBe(corrupt)
  })

  it('reading twice equals reading once', () => {
    localStorage.setItem(KEY, corrupt)
    getCats()
    getCats()
    expect(localStorage.getItem(BACKUP)).toBe(corrupt)
    expect(localStorage.getItem(`${BACKUP}_2`)).toBeNull()
  })

  it('never overwrites an earlier backup with a different value', () => {
    localStorage.setItem(BACKUP, 'older damage')
    localStorage.setItem(KEY, corrupt)
    getCats()
    expect(localStorage.getItem(BACKUP)).toBe('older damage')
    expect(localStorage.getItem(`${BACKUP}_2`)).toBe(corrupt)
  })

  it('tells the user in plain words, then lets the retry through', () => {
    // The refused save is how the user finds out. Once the backup is confirmed
    // the bad value is moved aside, so trying again works from an empty list.
    localStorage.setItem(KEY, corrupt)
    const error = thrownBy(() => saveCat(cat({ id: 'b' })))
    expect(error.reason).toBe('unreadable')
    expect(error.message).toMatch(/couldn't be read/)
    expect(localStorage.getItem(KEY)).toBeNull()

    saveCat(cat({ id: 'b' }))
    expect(getCats().map(c => c.id)).toEqual(['b'])
    expect(localStorage.getItem(BACKUP)).toBe(corrupt)
  })

  it('keeps refusing while the backup cannot be made', () => {
    // With nowhere safe to put the old value, staying stuck beats losing it.
    localStorage.setItem(KEY, corrupt)
    const restore = fillStorage()
    expect(() => saveCat(cat())).toThrow(StorageWriteError)
    expect(() => saveCat(cat())).toThrow(StorageWriteError)
    restore()
    expect(localStorage.getItem(KEY)).toBe(corrupt)
    expect(localStorage.getItem(BACKUP)).toBeNull()
  })

  it('refuses deletes too, since they rewrite the same list', () => {
    localStorage.setItem(KEY, corrupt)
    expect(() => deleteCat('a')).toThrow(StorageWriteError)
    expect(localStorage.getItem(BACKUP)).toBe(corrupt)
  })
})

describe('when a write fails', () => {
  it('says there is not enough room when storage is full', () => {
    saveCat(cat({ id: 'a' }))
    const restore = fillStorage()
    const error = thrownBy(() => saveCat(cat({ id: 'b', photoUrl: 'data:image/png;base64,AAAA' })))
    restore()
    expect(error.reason).toBe('quota')
    expect(error.message).toMatch(/enough room/)
    expect(getCats().map(c => c.id)).toEqual(['a'])
  })

  it('recognises the older numeric quota code too', () => {
    const restore = fillStorage({ name: 'Error', code: 22 })
    expect(thrownBy(() => saveCat(cat())).reason).toBe('quota')
    restore()
  })

  it('reports any other failure without the photo advice', () => {
    const restore = fillStorage(new Error('SecurityError'))
    const error = thrownBy(() => saveScheduleEvent(event()))
    restore()
    expect(error.reason).toBe('unknown')
    expect(error.message).toMatch(/wasn't saved/)
    expect(error.cause).toBeInstanceOf(Error)
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

  it.each(['null', '{}'])('returns an array for parseable non-array JSON %s', raw => {
    localStorage.setItem(SCHEDULE_KEY, raw)
    expect(getScheduleEvents()).toEqual([])
    // ...and the next save refuses cleanly instead of crashing on findIndex.
    expect(() => saveScheduleEvent(event())).toThrow(StorageWriteError)
    expect(localStorage.getItem(`${SCHEDULE_KEY}__unreadable`)).toBe(raw)
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
    expect(getScheduleEvents()).toEqual([{ ...e, updatedAt: expect.any(String) }])
  })

  it('deletes only the event asked for', () => {
    saveScheduleEvent(event({ id: 'a' }))
    saveScheduleEvent(event({ id: 'b' }))
    deleteScheduleEvent('a')
    expect(getScheduleEvents().map(e => e.id)).toEqual(['b'])
  })

  it('keeps cats and events under separate keys', () => {
    saveCat(cat())
    saveScheduleEvent(event({ catIds: ['cat-2'] }))
    deleteCat('cat-1')
    expect(getScheduleEvents()).toHaveLength(1)
  })
})

// ─── Deleting a cat ───────────────────────────────────────────────────────────

describe('deleteCat cascade', () => {
  const reading = (over: Partial<HealthRecord> = {}): HealthRecord => ({
    id: 'r1',
    catId: 'cat-1',
    date: '2026-06-01',
    weightLbs: 10,
    createdAt: '2026-06-01T00:00:00.000Z',
    ...over,
  })

  beforeEach(() => {
    saveCat(cat({ id: 'cat-1' }))
    saveCat(cat({ id: 'cat-2' }))
  })

  it('drops the cat from a shared event and keeps the event for the other cat', () => {
    saveScheduleEvent(event({ id: 'shared', catIds: ['cat-1', 'cat-2'] }))
    const result = deleteCat('cat-1')
    expect(getScheduleEvents()).toEqual([
      { ...event({ id: 'shared', catIds: ['cat-2'] }), updatedAt: expect.any(String) },
    ])
    expect(result.updatedEvents).toEqual(getScheduleEvents())
    expect(result.deletedEventIds).toEqual([])
  })

  it('deletes an event once no cats are left on it', () => {
    saveScheduleEvent(event({ id: 'mine', catIds: ['cat-1'] }))
    saveScheduleEvent(event({ id: 'theirs', catIds: ['cat-2'] }))
    const result = deleteCat('cat-1')
    expect(getScheduleEvents().map(e => e.id)).toEqual(['theirs'])
    expect(result.deletedEventIds).toEqual(['mine'])
  })

  it("deletes the cat's health records and only those", () => {
    saveHealthRecord(reading({ id: 'a', catId: 'cat-1' }))
    saveHealthRecord(reading({ id: 'b', catId: 'cat-2' }))
    const result = deleteCat('cat-1')
    expect(getHealthRecords().map(r => r.id)).toEqual(['b'])
    expect(result.deletedHealthRecordIds).toEqual(['a'])
  })

  it('writes nothing at all if any collection is unreadable', () => {
    saveScheduleEvent(event({ id: 'mine', catIds: ['cat-1'] }))
    localStorage.setItem('catssistant_health_records', '[{')
    expect(() => deleteCat('cat-1')).toThrow(StorageWriteError)
    expect(getCats().map(c => c.id)).toEqual(['cat-1', 'cat-2'])
    expect(getScheduleEvents().map(e => e.id)).toEqual(['mine'])
  })
})

// ─── updatedAt ────────────────────────────────────────────────────────────────

describe('updatedAt', () => {
  afterEach(() => vi.useRealTimers())

  it('is stamped on every save, and the stamped copy is what is returned', () => {
    vi.useFakeTimers({ now: new Date('2026-05-01T12:00:00.000Z') })
    const saved = saveCat(cat())
    expect(saved.updatedAt).toBe('2026-05-01T12:00:00.000Z')
    expect(getCats()).toEqual([saved])
  })

  it('moves forward on each save, so the later edit reads as newer', () => {
    vi.useFakeTimers({ now: new Date('2026-05-01T12:00:00.000Z') })
    saveCat(cat({ name: 'Old' }))
    vi.setSystemTime(new Date('2026-05-02T12:00:00.000Z'))
    saveCat(cat({ name: 'New' }))
    expect(getCats()[0].updatedAt).toBe('2026-05-02T12:00:00.000Z')
  })

  it('leaves records saved before it existed untouched on read', () => {
    // No migration fills it in: the age of an old record is its createdAt, read
    // as such by lib/backup.ts, rather than a made-up time written on read.
    const old = cat()
    localStorage.setItem(KEY, JSON.stringify([old]))
    expect(getCats()).toEqual([old])
    expect(getCats()[0].updatedAt).toBeUndefined()
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify([old]))
  })

  it('is stamped on a shared event that lost a cat to deleteCat', () => {
    saveCat(cat({ id: 'cat-1' }))
    localStorage.setItem(
      SCHEDULE_KEY,
      JSON.stringify([event({ id: 'shared', catIds: ['cat-1', 'cat-2'] })]),
    )
    vi.useFakeTimers({ now: new Date('2026-07-01T00:00:00.000Z') })
    const { updatedEvents } = deleteCat('cat-1')
    expect(updatedEvents[0].updatedAt).toBe('2026-07-01T00:00:00.000Z')
    expect(getScheduleEvents()).toEqual(updatedEvents)
  })
})

// ─── Every collection at once ─────────────────────────────────────────────────

describe('readAllCollections / writeAllCollections', () => {
  it('reads every key, migrating cats as getCats does', () => {
    localStorage.setItem(KEY, JSON.stringify([{ ...cat(), color: 'Tabby' }]))
    saveScheduleEvent(event())
    const all = readAllCollections()
    expect(all.cats[0].pattern).toBe('Tabby')
    expect(all.scheduleEvents).toHaveLength(1)
    expect(all).toMatchObject({ healthRecords: [], catalogProducts: [], householdItems: [] })
  })

  it('refuses when any one collection is unreadable', () => {
    localStorage.setItem('catssistant_household_items', '{oops')
    expect(() => readAllCollections()).toThrow(StorageWriteError)
  })

  it('writes only the collections that are a different array', () => {
    const before = readAllCollections()
    const written: string[] = []
    const realSet = localStorage.setItem
    localStorage.setItem = (k: string, v: string) => {
      written.push(k)
      realSet(k, v)
    }
    writeAllCollections({ ...before, cats: [cat()] }, before)
    localStorage.setItem = realSet
    expect(written).toEqual([KEY])
    expect(getCats()).toEqual([cat()])
  })

  it('puts back what it already wrote when a later write fails', () => {
    saveCat(cat({ id: 'a' }))
    const before = readAllCollections()
    const realSet = localStorage.setItem
    localStorage.setItem = (k: string, v: string) => {
      if (k === SCHEDULE_KEY) throw new DOMException('full', 'QuotaExceededError')
      realSet(k, v)
    }
    const err = thrownBy(() =>
      writeAllCollections({ ...before, cats: [...before.cats, cat({ id: 'b' })], scheduleEvents: [event()] }, before),
    )
    localStorage.setItem = realSet
    expect(err.reason).toBe('quota')
    expect(getCats().map(c => c.id)).toEqual(['a'])
    expect(getScheduleEvents()).toEqual([])
  })

  it('says so plainly when putting things back fails too', () => {
    const before = readAllCollections()
    let calls = 0
    const realSet = localStorage.setItem
    localStorage.setItem = (k: string, v: string) => {
      // First write (cats) works; everything after it fails, restore included.
      if (calls++ > 0) throw new Error('broken')
      realSet(k, v)
    }
    const err = thrownBy(() =>
      writeAllCollections({ ...before, cats: [cat()], scheduleEvents: [event()] }, before),
    )
    localStorage.setItem = realSet
    expect(err).toBeInstanceOf(PartialWriteError)
    expect(err.message).toMatch(/importing the same file again/)
  })
})
