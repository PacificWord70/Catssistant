import { CatalogProduct, HouseholdItem } from '@/types/item'
import { readList, readListForWrite, stamped, upsertById, writeList } from '@/lib/storageSafety'

/** Exported for the whole-app read and write in lib/storage.ts that backups use. */
export const CATALOG_KEY = 'catssistant_catalog_products'
export const ITEMS_KEY = 'catssistant_household_items'

export function getCatalogProducts(): CatalogProduct[] {
  return readList<CatalogProduct>(CATALOG_KEY)
}

export function getCatalogProductById(id: string): CatalogProduct | undefined {
  return getCatalogProducts().find(p => p.id === id)
}

/** Returns the product as stored, with `updatedAt` stamped — dispatch that one. */
export function saveCatalogProduct(product: CatalogProduct): CatalogProduct {
  const saved = stamped(product)
  writeList(CATALOG_KEY, upsertById(readListForWrite<CatalogProduct>(CATALOG_KEY), saved))
  return saved
}

export function deleteCatalogProduct(id: string): void {
  const remaining = readListForWrite<CatalogProduct>(CATALOG_KEY).filter(p => p.id !== id)
  writeList(CATALOG_KEY, remaining)
}

export function getHouseholdItems(): HouseholdItem[] {
  return readList<HouseholdItem>(ITEMS_KEY)
}

export function getHouseholdItemById(id: string): HouseholdItem | undefined {
  return getHouseholdItems().find(i => i.id === id)
}

/** Returns the item as stored, with `updatedAt` stamped — dispatch that one. */
export function saveHouseholdItem(item: HouseholdItem): HouseholdItem {
  const saved = stamped(item)
  writeList(ITEMS_KEY, upsertById(readListForWrite<HouseholdItem>(ITEMS_KEY), saved))
  return saved
}

export function deleteHouseholdItem(id: string): void {
  const remaining = readListForWrite<HouseholdItem>(ITEMS_KEY).filter(i => i.id !== id)
  writeList(ITEMS_KEY, remaining)
}
