import { CatalogProduct, HouseholdItem } from '@/types/item'
import { readList, readListForWrite, upsertById, writeList } from '@/lib/storageSafety'

const CATALOG_KEY = 'catssistant_catalog_products'
const ITEMS_KEY = 'catssistant_household_items'

export function getCatalogProducts(): CatalogProduct[] {
  return readList<CatalogProduct>(CATALOG_KEY)
}

export function getCatalogProductById(id: string): CatalogProduct | undefined {
  return getCatalogProducts().find(p => p.id === id)
}

export function saveCatalogProduct(product: CatalogProduct): void {
  writeList(CATALOG_KEY, upsertById(readListForWrite<CatalogProduct>(CATALOG_KEY), product))
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

export function saveHouseholdItem(item: HouseholdItem): void {
  writeList(ITEMS_KEY, upsertById(readListForWrite<HouseholdItem>(ITEMS_KEY), item))
}

export function deleteHouseholdItem(id: string): void {
  const remaining = readListForWrite<HouseholdItem>(ITEMS_KEY).filter(i => i.id !== id)
  writeList(ITEMS_KEY, remaining)
}
