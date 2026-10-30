import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  BACKUP_SCHEMA_VERSION,
  BackupFileError,
  backupFileName,
  buildBackup,
  describePlan,
  describeResult,
  importedWins,
  lastChanged,
  parseBackup,
  planMerge,
} from '@/lib/backup'
import {
  getCats,
  getScheduleEvents,
  readAllCollections,
  saveCat,
  saveScheduleEvent,
  StoredCollections,
  writeAllCollections,
} from '@/lib/storage'
import { getHealthRecords, saveHealthRecord } from '@/lib/healthStorage'
import {
  getCatalogProducts,
  getHouseholdItems,
  saveCatalogProduct,
  saveHouseholdItem,
} from '@/lib/itemStorage'
import { Cat } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { CatalogProduct, HouseholdItem } from '@/types/item'
import { ScheduleEvent } from '@/types/scheduleEvent'

const T1 = '2026-01-01T00:00:00.000Z'
const T2 = '2026-02-01T00:00:00.000Z'
const T3 = '2026-03-01T00:00:00.000Z'

const cat = (over: Partial<Cat> = {}): Cat =>
  ({ id: 'c1', name: 'Mochi', breed: [], weightUnit: 'lbs', createdAt: T1, ...over }) as Cat
const event = (over: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id: 'e1',
  catIds: ['c1'],
  category: 'Feeding',
  title: 'Breakfast',
  date: '2026-06-01',
  times: ['08:00'],
  recurrence: 'daily',
  createdAt: T1,
  ...over,
})
const record = (over: Partial<HealthRecord> = {}): HealthRecord => ({
  id: 'r1',
  catId: 'c1',
  date: '2026-06-01',
  weightLbs: 10,
  createdAt: T1,
  ...over,
})
const product = (over: Partial<CatalogProduct> = {}): CatalogProduct => ({
  id: 'p1',
  name: 'Kibble',
  category: 'Food',
  createdAt: T1,
  ...over,
})
const item = (over: Partial<HouseholdItem> = {}): HouseholdItem => ({
  id: 'i1',
  productId: 'p1',
  status: 'current',
  catIds: ['c1'],
  createdAt: T1,
  ...over,
})

const empty = (): StoredCollections => ({
  cats: [],
  scheduleEvents: [],
  healthRecords: [],
  catalogProducts: [],
  householdItems: [],
})
const full = (): StoredCollections => ({
  cats: [cat()],
  scheduleEvents: [event()],
  healthRecords: [record()],
  catalogProducts: [product()],
  householdItems: [item()],
})

/** A backup file's text, as the export button would write it. */
const fileFor = (c: StoredCollections) => JSON.stringify(buildBackup(c, new Date(T3)), null, 2)

// ─── Export ───────────────────────────────────────────────────────────────────

describe('buildBackup', () => {
  it('carries the app name, schema version, export time and every collection', () => {
    const backup = buildBackup(full(), new Date(T3))
    expect(backup).toMatchObject({
      app: 'Catssistant',
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: T3,
    })
    expect(Object.keys(backup.data).sort()).toEqual([
      'catalogProducts',
      'cats',
      'healthRecords',
      'householdItems',
      'scheduleEvents',
    ])
  })

  it('keeps a cat’s photo inside the cat', () => {
    const photo = 'data:image/jpeg;base64,/9j/AAAA'
    const backup = buildBackup({ ...empty(), cats: [cat({ photoUrl: photo })] })
    expect(backup.data.cats[0].photoUrl).toBe(photo)
  })
})

describe('backupFileName', () => {
  it('uses the local calendar day, not the UTC one', () => {
    // 11pm local on the 26th is already the 27th in UTC for anyone west of it.
    expect(backupFileName(new Date(2026, 9, 26, 23, 0))).toBe('catssistant-backup-2026-10-26.json')
  })
})

// ─── Reading a file ───────────────────────────────────────────────────────────

describe('parseBackup', () => {
  it('reads back exactly what was exported', () => {
    expect(parseBackup(fileFor(full()))).toEqual(full())
  })

  const rejects = (text: string, message: RegExp) => {
    let thrown: unknown
    try {
      parseBackup(text)
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(BackupFileError)
    expect((thrown as Error).message).toMatch(message)
  }

  it('rejects text that is not JSON', () => rejects('{"app": "Cats', /isn’t a Catssistant backup/))
  it('rejects JSON from some other app', () =>
    rejects(
      JSON.stringify({ ...buildBackup(full()), app: 'Dogssistant' }),
      /isn’t a Catssistant backup/,
    ))
  it('rejects a bare array', () => rejects('[]', /isn’t a Catssistant backup/))
  it('rejects a newer schema version with its own message', () =>
    rejects(JSON.stringify({ ...buildBackup(full()), schemaVersion: 2 }), /newer version/))
  it.each([0, '1', null, undefined, 1.5])('rejects schema version %s', version =>
    rejects(
      JSON.stringify({ ...buildBackup(full()), schemaVersion: version }),
      /isn’t one Catssistant recognises/,
    ),
  )
  it('rejects a file with no data', () =>
    rejects(JSON.stringify({ app: 'Catssistant', schemaVersion: 1 }), /incomplete or damaged/))

  it.each(['cats', 'scheduleEvents', 'healthRecords', 'catalogProducts', 'householdItems'])(
    'rejects %s that is missing or not an array',
    name => {
      const backup = buildBackup(full()) as unknown as { data: Record<string, unknown> }
      backup.data[name] = { 0: 'nope' }
      rejects(JSON.stringify(backup), /incomplete or damaged/)
      delete backup.data[name]
      rejects(JSON.stringify(backup), /incomplete or damaged/)
    },
  )

  it.each([
    ['a record with no id', { ...full(), cats: [{ ...cat(), id: undefined }] }],
    ['a record with an empty id', { ...full(), cats: [cat({ id: '' })] }],
    ['a record that is not an object', { ...full(), healthRecords: ['r1'] }],
    [
      'a record with no createdAt',
      { ...full(), catalogProducts: [{ ...product(), createdAt: undefined }] },
    ],
    ['a non-string updatedAt', { ...full(), scheduleEvents: [{ ...event(), updatedAt: 5 }] }],
    ['a cat whose breed is not a list', { ...full(), cats: [{ ...cat(), breed: 'Siamese' }] }],
    [
      'an event with no times list',
      { ...full(), scheduleEvents: [{ ...event(), times: undefined }] },
    ],
    [
      'an item with an unknown status',
      { ...full(), householdItems: [{ ...item(), status: 'lost' }] },
    ],
    [
      'a reading whose weight is text',
      { ...full(), healthRecords: [{ ...record(), weightLbs: '10' }] },
    ],
  ])('rejects %s', (_label, data) => {
    rejects(JSON.stringify({ app: 'Catssistant', schemaVersion: 1, data }), /missing details/)
  })

  it('names which entry is wrong, counting from one', () => {
    const data = { ...full(), cats: [cat({ id: 'a' }), cat({ id: 'b' }), { id: 'c' }] }
    rejects(JSON.stringify({ app: 'Catssistant', schemaVersion: 1, data }), /Cats entry 3/)
  })

  it('rejects the same id twice in one collection, rather than duplicating it', () => {
    const data = { ...full(), cats: [cat(), cat({ name: 'Copy' })] }
    rejects(JSON.stringify({ app: 'Catssistant', schemaVersion: 1, data }), /same cat twice/)
  })

  it('drops a photo that is not a safe image, and keeps the cat', () => {
    const data = { ...full(), cats: [cat({ photoUrl: 'javascript:alert(1)' })] }
    const parsed = parseBackup(JSON.stringify({ app: 'Catssistant', schemaVersion: 1, data }))
    expect(parsed.cats).toHaveLength(1)
    expect('photoUrl' in parsed.cats[0]).toBe(false)
  })

  it('keeps a safe photo as it was', () => {
    const photo = 'data:image/jpeg;base64,/9j/AAAA'
    const parsed = parseBackup(fileFor({ ...empty(), cats: [cat({ photoUrl: photo })] }))
    expect(parsed.cats[0].photoUrl).toBe(photo)
  })

  it('ignores keys it does not know, at the top and inside data', () => {
    const backup = {
      ...buildBackup(full()),
      extra: 1,
      data: { ...full(), gps: [{ id: 'x', lat: 1 }] },
    }
    const parsed = parseBackup(JSON.stringify(backup))
    expect(Object.keys(parsed).sort()).toEqual([
      'catalogProducts',
      'cats',
      'healthRecords',
      'householdItems',
      'scheduleEvents',
    ])
  })

  it('brings an old-shaped cat up to date, as reading storage does', () => {
    const data = { ...full(), cats: [{ ...cat(), color: 'Tabby' }] }
    const parsed = parseBackup(JSON.stringify({ app: 'Catssistant', schemaVersion: 1, data }))
    expect(parsed.cats[0].pattern).toBe('Tabby')
    expect(parsed.cats[0].color).toBeUndefined()
  })
})

// ─── Times ────────────────────────────────────────────────────────────────────

describe('lastChanged / importedWins', () => {
  it('prefers updatedAt and falls back to createdAt', () => {
    expect(lastChanged({ createdAt: T1, updatedAt: T2 })).toBe(Date.parse(T2))
    expect(lastChanged({ createdAt: T1 })).toBe(Date.parse(T1))
    expect(lastChanged({ createdAt: T1, updatedAt: 'not a date' })).toBe(Date.parse(T1))
    expect(lastChanged({ createdAt: 'nope' })).toBeNull()
  })

  it('the newer side wins whichever side it is on', () => {
    expect(
      importedWins({ id: 'a', createdAt: T1 }, { id: 'a', createdAt: T1, updatedAt: T2 }),
    ).toBe(true)
    expect(
      importedWins(
        { id: 'a', createdAt: T1, updatedAt: T3 },
        { id: 'a', createdAt: T1, updatedAt: T2 },
      ),
    ).toBe(false)
  })

  it('a tie goes to the file', () => {
    expect(
      importedWins(
        { id: 'a', createdAt: T1, updatedAt: T2 },
        { id: 'a', createdAt: T1, updatedAt: T2 },
      ),
    ).toBe(true)
  })

  it('no usable time on either side goes to the file', () => {
    expect(importedWins({ id: 'a', createdAt: 'x' }, { id: 'a', createdAt: 'y' })).toBe(true)
  })

  it('a usable time beats none at all', () => {
    expect(importedWins({ id: 'a', createdAt: T1 }, { id: 'a', createdAt: 'x' })).toBe(false)
    expect(importedWins({ id: 'a', createdAt: 'x' }, { id: 'a', createdAt: T1 })).toBe(true)
  })
})

// ─── Merging ──────────────────────────────────────────────────────────────────

describe('planMerge', () => {
  it('importing the same data changes nothing and reuses every array', () => {
    const device = full()
    const plan = planMerge(device, parseBackup(fileFor(device)))
    expect(plan.hasChanges).toBe(false)
    expect(plan.counts.cats).toEqual({
      added: 0,
      updated: 0,
      unchanged: 1,
      keptNewer: 0,
      keptOnlyHere: 0,
    })
    for (const name of Object.keys(device) as (keyof StoredCollections)[]) {
      expect(plan.next[name]).toBe(device[name])
    }
  })

  it('treats a different key order as the same record', () => {
    const device = { ...empty(), cats: [cat()] }
    const reordered = JSON.parse(
      JSON.stringify({ createdAt: T1, weightUnit: 'lbs', breed: [], name: 'Mochi', id: 'c1' }),
    )
    expect(planMerge(device, { ...empty(), cats: [reordered] }).counts.cats.unchanged).toBe(1)
  })

  it('adds what is only in the file and keeps what is only on the device', () => {
    const device = { ...empty(), cats: [cat({ id: 'mine' })] }
    const imported = { ...empty(), cats: [cat({ id: 'theirs' })] }
    const plan = planMerge(device, imported)
    expect(plan.next.cats.map(c => c.id)).toEqual(['mine', 'theirs'])
    expect(plan.counts.cats).toMatchObject({ added: 1, keptOnlyHere: 1 })
  })

  it('takes the file’s copy when it is newer', () => {
    const device = { ...empty(), cats: [cat({ name: 'Old', updatedAt: T1 })] }
    const imported = { ...empty(), cats: [cat({ name: 'New', updatedAt: T2 })] }
    const plan = planMerge(device, imported)
    expect(plan.next.cats).toEqual([imported.cats[0]])
    expect(plan.counts.cats.updated).toBe(1)
  })

  it('keeps the device’s copy when it is newer', () => {
    const device = { ...empty(), cats: [cat({ name: 'Edited here', updatedAt: T3 })] }
    const imported = { ...empty(), cats: [cat({ name: 'Backed up', updatedAt: T2 })] }
    const plan = planMerge(device, imported)
    expect(plan.next.cats).toBe(device.cats)
    expect(plan.counts.cats.keptNewer).toBe(1)
    expect(plan.hasChanges).toBe(false)
  })

  it('on a tie, the file wins', () => {
    const device = { ...empty(), cats: [cat({ name: 'Here', updatedAt: T2 })] }
    const imported = { ...empty(), cats: [cat({ name: 'File', updatedAt: T2 })] }
    expect(planMerge(device, imported).next.cats[0].name).toBe('File')
  })

  it('records with no updatedAt compare by createdAt, so an edit since beats them', () => {
    const device = { ...empty(), cats: [cat({ name: 'Edited', updatedAt: T2 })] }
    const imported = { ...empty(), cats: [cat({ name: 'Original' })] } // createdAt T1, no updatedAt
    expect(planMerge(device, imported).next.cats[0].name).toBe('Edited')
  })

  it('with no usable time on either side, the file wins', () => {
    const device = { ...empty(), cats: [cat({ name: 'Here', createdAt: '' })] }
    const imported = { ...empty(), cats: [cat({ name: 'File', createdAt: '' })] }
    expect(planMerge(device, imported).next.cats[0].name).toBe('File')
  })

  it('never duplicates or drops a record, whatever the mix', () => {
    const device = {
      ...full(),
      cats: [cat({ id: 'a' }), cat({ id: 'b', updatedAt: T3 }), cat({ id: 'c' })],
    }
    const imported = {
      ...full(),
      cats: [
        cat({ id: 'b', name: 'Older', updatedAt: T2 }),
        cat({ id: 'c', name: 'Newer', updatedAt: T2 }),
        cat({ id: 'd' }),
      ],
    }
    const plan = planMerge(device, imported)
    const ids = plan.next.cats.map(c => c.id)
    expect(ids).toEqual(['a', 'b', 'c', 'd'])
    expect(new Set(ids).size).toBe(ids.length)
    expect(plan.counts.cats).toEqual({
      added: 1,
      updated: 1,
      unchanged: 0,
      keptNewer: 1,
      keptOnlyHere: 1,
    })
  })

  it('merges every collection, not just cats', () => {
    const imported: StoredCollections = {
      cats: [cat({ id: 'c2' })],
      scheduleEvents: [event({ id: 'e2' })],
      healthRecords: [record({ id: 'r2' })],
      catalogProducts: [product({ id: 'p2' })],
      householdItems: [item({ id: 'i2' })],
    }
    const plan = planMerge(full(), imported)
    for (const name of Object.keys(imported) as (keyof StoredCollections)[]) {
      expect(plan.next[name]).toHaveLength(2)
      expect(plan.counts[name].added).toBe(1)
    }
  })
})

describe('describePlan / describeResult', () => {
  it('says what will happen in plain words, and skips empty collections', () => {
    const device = { ...empty(), cats: [cat({ id: 'a' }), cat({ id: 'b', updatedAt: T3 })] }
    const imported = {
      ...empty(),
      cats: [cat({ id: 'b', name: 'x', updatedAt: T2 }), cat({ id: 'n1' }), cat({ id: 'n2' })],
    }
    expect(describePlan(planMerge(device, imported))).toEqual([
      {
        title: 'Cats',
        lines: [
          '2 new cats will be added',
          '1 cat was changed here more recently and will stay as it is',
          '1 cat not in the backup will stay as it is',
        ],
      },
    ])
  })

  it('sums up the result in one sentence', () => {
    const plan = planMerge(
      { ...empty(), scheduleEvents: [event({ updatedAt: T1 })] },
      {
        ...empty(),
        cats: [cat(), cat({ id: 'c2' })],
        scheduleEvents: [event({ title: 'x', updatedAt: T2 })],
      },
    )
    expect(describeResult(plan)).toBe('Backup restored: added 2 cats and updated 1 schedule event.')
    expect(describeResult(planMerge(full(), full()))).toMatch(/already here/)
  })
})

// ─── End to end, through storage ──────────────────────────────────────────────

describe('export then import through storage', () => {
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
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function seed() {
    saveCat(cat({ photoUrl: 'data:image/jpeg;base64,/9j/AAAA' }))
    saveScheduleEvent(event())
    saveHealthRecord(record())
    saveCatalogProduct(product())
    saveHouseholdItem(item())
  }

  /** What the page does: read everything, plan, write the plan. */
  function importText(text: string) {
    const device = readAllCollections()
    const plan = planMerge(device, parseBackup(text))
    writeAllCollections(plan.next, device)
    return plan
  }

  it('re-importing a fresh export leaves storage byte-for-byte the same', () => {
    seed()
    const snapshot = () =>
      [
        'catssistant_cats',
        'catssistant_schedule_events',
        'catssistant_health_records',
        'catssistant_catalog_products',
        'catssistant_household_items',
      ].map(k => localStorage.getItem(k))
    const before = snapshot()
    const plan = importText(fileFor(readAllCollections()))
    expect(plan.hasChanges).toBe(false)
    expect(snapshot()).toEqual(before)
  })

  it('restores everything into an empty browser', () => {
    seed()
    const text = fileFor(readAllCollections())
    const original = readAllCollections()
    localStorage.clear()

    importText(text)
    expect(getCats()).toEqual(original.cats)
    expect(getScheduleEvents()).toEqual(original.scheduleEvents)
    expect(getHealthRecords()).toEqual(original.healthRecords)
    expect(getCatalogProducts()).toEqual(original.catalogProducts)
    expect(getHouseholdItems()).toEqual(original.householdItems)
  })

  it('an edit made after the backup survives importing it', () => {
    vi.useFakeTimers({ now: new Date(T1) })
    seed()
    const text = fileFor(readAllCollections())
    vi.setSystemTime(new Date(T2))
    saveCat({ ...getCats()[0], name: 'Mochi the Great' })
    saveCat(cat({ id: 'c2', name: 'Newcomer' }))

    const plan = importText(text)
    expect(plan.counts.cats).toMatchObject({ keptNewer: 1, keptOnlyHere: 1, added: 0, updated: 0 })
    expect(getCats().map(c => c.name)).toEqual(['Mochi the Great', 'Newcomer'])
  })

  it('a backup newer than the device updates it, and a second import is a no-op', () => {
    vi.useFakeTimers({ now: new Date(T1) })
    seed()
    const stale = readAllCollections()
    vi.setSystemTime(new Date(T2))
    saveCat({ ...getCats()[0], name: 'Renamed' })
    const text = fileFor(readAllCollections())
    writeAllCollections(stale, readAllCollections()) // the device goes back to before the rename

    expect(importText(text).counts.cats.updated).toBe(1)
    expect(getCats()[0].name).toBe('Renamed')
    expect(importText(text).hasChanges).toBe(false)
  })

  it('writes nothing for a bad file', () => {
    seed()
    const before = localStorage.getItem('catssistant_cats')
    expect(() => importText('{"app":"Catssistant","schemaVersion":1,"data":{"cats":"x"}}')).toThrow(
      BackupFileError,
    )
    expect(localStorage.getItem('catssistant_cats')).toBe(before)
  })
})

describe('label facts on import', () => {
  it('cleans a product\u2019s label facts rather than refusing the file or trusting them', () => {
    const dirty = { ...product(), food: { gramsPerCan: 0, gramsPerCup: '110', kcal: { amount: 180, per: 'can' } } }
    const parsed = parseBackup(fileFor({ ...empty(), catalogProducts: [dirty as unknown as CatalogProduct] }))
    expect(parsed.catalogProducts[0].food).toEqual({ kcal: { amount: 180, per: 'can' } })
  })

  it('drops the facts entirely when none survive', () => {
    const dirty = { ...product(), food: 'about a cup' }
    const parsed = parseBackup(fileFor({ ...empty(), catalogProducts: [dirty as unknown as CatalogProduct] }))
    expect('food' in parsed.catalogProducts[0]).toBe(false)
  })
})
