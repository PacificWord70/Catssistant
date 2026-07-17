import { CatalogProduct, HouseholdItem } from '@/types/item'

const CATALOG_KEY = 'catssistant_catalog_products'
const ITEMS_KEY = 'catssistant_household_items'

export function getCatalogProducts(): CatalogProduct[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CATALOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getCatalogProductById(id: string): CatalogProduct | undefined {
  return getCatalogProducts().find(p => p.id === id)
}

export function saveCatalogProduct(product: CatalogProduct): void {
  const products = getCatalogProducts()
  const idx = products.findIndex(p => p.id === product.id)
  if (idx >= 0) {
    products[idx] = product
  } else {
    products.push(product)
  }
  localStorage.setItem(CATALOG_KEY, JSON.stringify(products))
}

export function deleteCatalogProduct(id: string): void {
  const products = getCatalogProducts().filter(p => p.id !== id)
  localStorage.setItem(CATALOG_KEY, JSON.stringify(products))
}

export function getHouseholdItems(): HouseholdItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ITEMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getHouseholdItemById(id: string): HouseholdItem | undefined {
  return getHouseholdItems().find(i => i.id === id)
}

export function saveHouseholdItem(item: HouseholdItem): void {
  const items = getHouseholdItems()
  const idx = items.findIndex(i => i.id === item.id)
  if (idx >= 0) {
    items[idx] = item
  } else {
    items.push(item)
  }
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
}

export function deleteHouseholdItem(id: string): void {
  const items = getHouseholdItems().filter(i => i.id !== id)
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
}
