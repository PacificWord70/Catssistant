export type ProductCategory = 'Food' | 'Litter' | 'Medication' | 'Toy' | 'Tool' | 'Other'

export type FoodForm = 'wet' | 'dry'

/** How a label states calories: per kilogram, per 100 g, per can, or per cup. */
export type CaloriePer = 'kg' | '100g' | 'can' | 'cup'

/**
 * Facts read off a food product's label. They let a meal plan written the
 * way an owner thinks — half a can, a quarter cup — be charted in grams and
 * calories without guessing. Every field is optional: a chart converts only
 * what the facts allow and says so when a cat is left off.
 */
export interface FoodFacts {
  form?: FoodForm
  /** Net weight of one can or pouch in grams, as printed; packaging excluded. */
  gramsPerCan?: number
  /** Grams in one level measuring cup. Dry food; it varies by kibble. */
  gramsPerCup?: number
  /** Calories as the label states them, with the basis they are stated on. */
  kcal?: { amount: number; per: CaloriePer }
}

/** Where a product's facts came from: typed in by the owner, or from the shared catalog. */
export type ProductSource = 'owner' | 'catalog'
/** An owner-added product stays unverified until it has been checked before it joins the shared catalog. */
export type ProductReview = 'unverified' | 'verified'

export interface CatalogProduct {
  id: string
  name: string
  brand?: string
  category: ProductCategory
  subCategory?: string   // free-text finer distinction, e.g. "Wet Food" / "Dry Food"
  /** Label facts, for food products. */
  food?: FoodFacts
  source?: ProductSource
  review?: ProductReview
  createdAt: string
  /** Last saved, ISO timestamp. Absent on older records; see Cat.updatedAt. */
  updatedAt?: string
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
  /** Last saved, ISO timestamp. Absent on older records; see Cat.updatedAt. */
  updatedAt?: string
}
