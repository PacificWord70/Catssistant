import { ProductCategory } from '@/types/item'

export const PRODUCT_CATEGORIES: ProductCategory[] = ['Food', 'Litter', 'Medication', 'Toy', 'Tool', 'Other']

export const CATEGORY_ORDER: Record<ProductCategory, number> = {
  Food: 0,
  Litter: 1,
  Medication: 2,
  Toy: 3,
  Tool: 4,
  Other: 5,
}
