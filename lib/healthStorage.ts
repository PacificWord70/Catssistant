import { HealthRecord } from '@/types/healthRecord'

const HEALTH_KEY = 'catssistant_health_records'

/**
 * Dated health measurements, one row per reading.
 *
 * Separate from `lib/storage.ts` for the same reason `itemStorage.ts` is: these
 * grow per reading rather than per cat, so a cat with three years of weekly
 * weights would otherwise bloat every read of the cat list.
 */
export function getHealthRecords(): HealthRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HEALTH_KEY)
    return raw ? (JSON.parse(raw) as HealthRecord[]) : []
  } catch {
    return []
  }
}

export function getHealthRecordsForCat(catId: string): HealthRecord[] {
  return getHealthRecords().filter(r => r.catId === catId)
}

export function saveHealthRecord(record: HealthRecord): void {
  const records = getHealthRecords()
  const idx = records.findIndex(r => r.id === record.id)
  if (idx >= 0) {
    records[idx] = record
  } else {
    records.push(record)
  }
  localStorage.setItem(HEALTH_KEY, JSON.stringify(records))
}

export function deleteHealthRecord(id: string): void {
  const records = getHealthRecords().filter(r => r.id !== id)
  localStorage.setItem(HEALTH_KEY, JSON.stringify(records))
}
