import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  deleteHealthRecord,
  getHealthRecords,
  getHealthRecordsForCat,
  saveHealthRecord,
} from '@/lib/healthStorage'
import { StorageWriteError } from '@/lib/storageSafety'
import { HealthRecord } from '@/types/healthRecord'

const HEALTH_KEY = 'catssistant_health_records'

/** `window` is stubbed too, because every read is guarded by it for SSR. */
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

const record = (over: Partial<HealthRecord> = {}): HealthRecord => ({
  id: 'r1',
  catId: 'c1',
  date: '2026-06-01',
  weightLbs: 10,
  createdAt: '2026-06-01T00:00:00.000Z',
  ...over,
})

describe('health records', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(getHealthRecords()).toEqual([])
  })

  it('returns an empty array rather than throwing on corrupt JSON', () => {
    localStorage.setItem(HEALTH_KEY, '[{"id":"r1",')
    expect(getHealthRecords()).toEqual([])
  })

  it('returns an empty array during server rendering', () => {
    saveHealthRecord(record())
    vi.stubGlobal('window', undefined)
    expect(getHealthRecords()).toEqual([])
  })

  it('appends, then replaces a corrected reading in place', () => {
    saveHealthRecord(record({ id: 'a', weightLbs: 10 }))
    saveHealthRecord(record({ id: 'b' }))
    saveHealthRecord(record({ id: 'a', weightLbs: 10.4 }))
    const all = getHealthRecords()
    expect(all.map(r => r.id)).toEqual(['a', 'b'])
    expect(all[0].weightLbs).toBe(10.4)
  })

  it('filters to one cat', () => {
    saveHealthRecord(record({ id: 'a', catId: 'c1' }))
    saveHealthRecord(record({ id: 'b', catId: 'c2' }))
    saveHealthRecord(record({ id: 'c', catId: 'c1' }))
    expect(getHealthRecordsForCat('c1').map(r => r.id)).toEqual(['a', 'c'])
    expect(getHealthRecordsForCat('nobody')).toEqual([])
  })

  it('deletes only the record asked for', () => {
    saveHealthRecord(record({ id: 'a' }))
    saveHealthRecord(record({ id: 'b' }))
    deleteHealthRecord('a')
    expect(getHealthRecords().map(r => r.id)).toEqual(['b'])
  })

  it('returns an array for parseable non-array JSON', () => {
    // Used to come back as null, so the per-cat filter and the next save crashed.
    localStorage.setItem(HEALTH_KEY, 'null')
    expect(getHealthRecords()).toEqual([])
    expect(getHealthRecordsForCat('c1')).toEqual([])
    expect(() => saveHealthRecord(record())).toThrow(StorageWriteError)
    expect(localStorage.getItem(`${HEALTH_KEY}__unreadable`)).toBe('null')
  })

  it('does not overwrite unreadable readings when saving a new one', () => {
    const corrupt = '[{"id":"r1","catId":"c1",'
    localStorage.setItem(HEALTH_KEY, corrupt)
    expect(() => saveHealthRecord(record({ id: 'r2' }))).toThrow(StorageWriteError)
    expect(localStorage.getItem(`${HEALTH_KEY}__unreadable`)).toBe(corrupt)
  })

  it('throws a StorageWriteError when storage is full', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(() => saveHealthRecord(record())).toThrow(/enough room/)
  })
})
