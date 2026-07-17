export type ProductCategory = 'Food' | 'Litter' | 'Medication' | 'Toy' | 'Tool' | 'Other'

export interface CatalogProduct {
  id: string
  name: string
  brand?: string
  category: ProductCategory
  subCategory?: string   // free-text finer distinction, e.g. "Wet Food" / "Dry Food"
  createdAt: string
}

export type ItemStatus = 'current' | 'past'

export interface HouseholdItem {
  id: string
  productId: string       // references CatalogProduct.id
  status: ItemStatus
  dateStarted?: string    // ISO date
  dateEnded?: string      // ISO date — only meaningful when status is 'past'
  catIds: string[]        // references existing Cat.id values, may be empty
  notes?: string
  createdAt: string
}
