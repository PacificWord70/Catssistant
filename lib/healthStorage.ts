import { HealthRecord } from '@/types/healthRecord'
import { readList, readListForWrite, upsertById, writeList } from '@/lib/storageSafety'

/** Exported for `deleteCat` in lib/storage.ts, which clears a cat's readings along with it. */
export const HEALTH_KEY = 'catssistant_health_records'

/**
 * Dated health measurements, one row per reading.
 *
 * Separate from `lib/storage.ts` for the same reason `itemStorage.ts` is: these
 * grow per reading rather than per cat, so a cat with three years of weekly
 * weights would otherwise bloat every read of the cat list.
 */
export function getHealthRecords(): HealthRecord[] {
  return readList<HealthRecord>(HEALTH_KEY)
}

export function getHealthRecordsForCat(catId: string): HealthRecord[] {
  return getHealthRecords().filter(r => r.catId === catId)
}

export function saveHealthRecord(record: HealthRecord): void {
  writeList(HEALTH_KEY, upsertById(readListForWrite<HealthRecord>(HEALTH_KEY), record))
}

export function deleteHealthRecord(id: string): void {
  const remaining = readListForWrite<HealthRecord>(HEALTH_KEY).filter(r => r.id !== id)
  writeList(HEALTH_KEY, remaining)
}
